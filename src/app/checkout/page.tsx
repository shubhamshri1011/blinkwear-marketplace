'use client';

import React, { Suspense, useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useCity } from '@/context/CityContext';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Address, CartItemWithProduct, PlatformSettings } from '@/types/database';
import {
  calculateMultiRentalOrder,
  calculateBuyOrder,
  RentalItemInput,
  BuyItemInput,
} from '@/lib/pricing';
import { load } from '@cashfreepayments/cashfree-js';
import {
  ShieldCheck,
  CreditCard,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle,
  Truck,
  ArrowRight,
  Phone,
  RotateCcw,
} from 'lucide-react';

async function getFunctionErrorMessage(error: any, fallbackMessage: string): Promise<string> {
  if (!error) return fallbackMessage;
  try {
    if (error.context && typeof error.context.json === 'function') {
      const body = await error.context.json();
      if (body?.error && typeof body.error === 'string') return body.error;
      if (body?.message && typeof body.message === 'string') return body.message;
    }
  } catch {
    try {
      if (error.context && typeof error.context.text === 'function') {
        const text = await error.context.text();
        if (text) {
          try {
            const parsed = JSON.parse(text);
            if (parsed?.error) return parsed.error;
            if (parsed?.message) return parsed.message;
          } catch {
            return text;
          }
        }
      }
    } catch {}
  }
  return error.message && error.message !== 'Edge Function returned a non-2xx status code'
    ? error.message
    : fallbackMessage;
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto py-20 text-center animate-pulse">Loading Checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, refreshProfile } = useAuth();
  const { cartItems, refreshCart } = useCart();
  const { selectedCity } = useCity();

  const checkoutType = searchParams.get('type') || 'rental';
  const cartItemId = searchParams.get('cart_item_id');

  const supabase = createClient();

  // State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address_line1: '',
    address_line2: '',
    city: selectedCity,
    state: selectedCity.toLowerCase() === 'bhopal' ? 'Madhya Pradesh' : 'Maharashtra',
    pincode: '',
    is_default: true,
  });

  const [contactPhone, setContactPhone] = useState(profile?.phone || '');
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load addresses & settings
  useEffect(() => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.href)}`);
      return;
    }

    async function loadData() {
      setIsLoading(true);
      try {
        const [{ data: addrs }, { data: settings }] = await Promise.all([
          supabase.from('addresses').select('*').eq('user_id', user!.id).order('is_default', { ascending: false }),
          supabase.from('platform_settings').select('*').eq('id', 1).single(),
        ]);

        if (addrs && addrs.length > 0) {
          setAddresses(addrs as Address[]);
          const def = addrs.find((a) => a.is_default) || addrs[0];
          setSelectedAddressId(def.id);
        } else {
          setIsAddingAddress(true);
        }

        if (settings) {
          setPlatformSettings(settings as PlatformSettings);
        }
      } catch (err) {
        console.error('Error loading checkout dependencies:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user, router, supabase]);

  // Selected items to checkout (Multi-product support)
  const activeRentalItems: CartItemWithProduct[] = useMemo(() => {
    if (checkoutType !== 'rental') return [];
    if (cartItemId) {
      const match = cartItems.find((i) => i.id === cartItemId && i.purchase_type === 'rent' && i.rental_start_date && i.rental_end_date);
      return match ? [match] : [];
    }
    // Only include rental items that have dates set — items without dates cannot be checked out
    return cartItems.filter((i) => i.purchase_type === 'rent' && i.rental_start_date && i.rental_end_date);
  }, [checkoutType, cartItemId, cartItems]);

  // Items missing dates — shown as a warning to the user
  const incompletRentalItems: CartItemWithProduct[] = useMemo(() => {
    if (checkoutType !== 'rental') return [];
    return cartItems.filter((i) => i.purchase_type === 'rent' && (!i.rental_start_date || !i.rental_end_date));
  }, [checkoutType, cartItemId, cartItems]);

  const activeBuyItems: CartItemWithProduct[] = useMemo(() => {
    if (checkoutType !== 'buy') return [];
    if (cartItemId) {
      const match = cartItems.find((i) => i.id === cartItemId && i.purchase_type === 'buy');
      return match ? [match] : [];
    }
    return cartItems.filter((i) => i.purchase_type === 'buy');
  }, [checkoutType, cartItemId, cartItems]);

  // Authoritative Pricing Calculations
  const rentalCalculation = useMemo(() => {
    if (activeRentalItems.length === 0) return null;
    const inputs: RentalItemInput[] = activeRentalItems.map((ci) => ({
      productId: ci.product_id,
      product: ci.product!,
      rentalStartDate: ci.rental_start_date!,
      rentalEndDate: ci.rental_end_date!,
      selectedSize: ci.selected_size,
      selectedColor: ci.selected_color,
    }));
    return calculateMultiRentalOrder(inputs, platformSettings);
  }, [activeRentalItems, platformSettings]);

  const buyCalculation = useMemo(() => {
    if (activeBuyItems.length === 0) return null;
    const inputs: BuyItemInput[] = activeBuyItems.map((ci) => ({
      productId: ci.product_id,
      product: ci.product!,
      quantity: ci.quantity,
      selectedSize: ci.selected_size,
      selectedColor: ci.selected_color,
    }));
    return calculateBuyOrder(inputs, platformSettings);
  }, [activeBuyItems, platformSettings]);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  // Handle saving new address
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newAddress.address_line1 || !newAddress.pincode || !newAddress.city) {
      setErrorMessage('Please fill in complete address details.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          label: newAddress.label,
          full_name: newAddress.full_name || profile?.full_name || 'Customer',
          phone: newAddress.phone || contactPhone,
          address_line1: newAddress.address_line1,
          address_line2: newAddress.address_line2 || null,
          city: newAddress.city,
          state: newAddress.state,
          pincode: newAddress.pincode,
          is_default: addresses.length === 0,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setAddresses((prev) => [data as Address, ...prev]);
        setSelectedAddressId(data.id);
        setIsAddingAddress(false);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save address');
    }
  };

  // Handle Complete Order / Payment via Cashfree
  const handleProceedToPayment = async () => {
    setErrorMessage(null);

    const cleanPhone = (contactPhone || selectedAddress?.phone || profile?.phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number for order delivery coordination.');
      return;
    }

    if (!selectedAddress && !isAddingAddress) {
      setErrorMessage('Please select or add a delivery address.');
      return;
    }

    // Update phone on profile if not already present
    if (!profile?.phone || profile.phone !== cleanPhone) {
      await supabase.from('profiles').update({ phone: cleanPhone }).eq('id', user!.id);
      await refreshProfile();
    }

    setIsProcessing(true);

    try {
      if (checkoutType === 'rental') {
        if (activeRentalItems.length === 0) {
          const hasIncomplete = incompletRentalItems.length > 0;
          throw new Error(
            hasIncomplete
              ? `${incompletRentalItems.length} item(s) in your cart are missing rental dates. Please go back to the cart and select dates before checking out.`
              : 'No rental items selected for checkout. Please add items to your cart.'
          );
        }

        // Snapshot address details
        const addressSnapshot = selectedAddress
          ? {
              full_name: selectedAddress.full_name,
              phone: cleanPhone,
              address_line1: selectedAddress.address_line1,
              address_line2: selectedAddress.address_line2,
              city: selectedAddress.city,
              state: selectedAddress.state,
              pincode: selectedAddress.pincode,
            }
          : null;

        // Build multi-item rental payload
        const rentalPayload = {
          items: activeRentalItems.map((item) => ({
            cart_item_id: item.id,
            product_id: item.product_id,
            rental_start_date: item.rental_start_date,
            rental_end_date: item.rental_end_date,
            selected_size: item.selected_size,
            selected_color: item.selected_color,
          })),
          delivery_address: addressSnapshot,
        };

        const { data: cfOrder, error: fnErr } = await supabase.functions.invoke(
          'create-cashfree-rental-order',
          {
            body: rentalPayload,
          }
        );

        if (fnErr || !cfOrder) {
          const detail = await getFunctionErrorMessage(
            fnErr,
            cfOrder?.error || 'Unable to initiate Cashfree payment session.'
          );
          throw new Error(detail);
        }

        // Initialize Cashfree SDK (server-driven mode from order creation)
        const cashfreeMode = cfOrder.cf_env === 'production' ? 'production' : 'sandbox';
        const cashfree = await load({ mode: cashfreeMode });

        if (!cashfree) {
          throw new Error('Failed to load Cashfree checkout gateway.');
        }

        // Launch Cashfree modal
        await cashfree.checkout({
          paymentSessionId: cfOrder.payment_session_id,
          redirectTarget: '_modal',
        });

        // Server-side Payment Verification
        const { data: verifyRes, error: verifyErr } = await supabase.functions.invoke(
          'verify-cashfree-rental-payment',
          {
            body: {
              cashfree_order_id: cfOrder.cashfree_order_id,
            },
          }
        );

        if (verifyErr || !verifyRes?.success) {
          const detail = await getFunctionErrorMessage(
            verifyErr,
            verifyRes?.error ||
              'Payment was not completed. Your shopping bag has been preserved — you can try again.'
          );
          throw new Error(detail);
        }

        await refreshCart();
        router.push(`/checkout/success?type=rental&id=${verifyRes.booking_id}&method=cashfree`);
      } else {
        // BUY FLOW (100% PREPAID)
        if (activeBuyItems.length === 0) {
          throw new Error('No buy items selected for checkout.');
        }

        const addressSnapshot = selectedAddress
          ? {
              full_name: selectedAddress.full_name,
              phone: cleanPhone,
              address_line1: selectedAddress.address_line1,
              address_line2: selectedAddress.address_line2,
              city: selectedAddress.city,
              state: selectedAddress.state,
              pincode: selectedAddress.pincode,
            }
          : null;

        const { data: cfOrder, error: fnErr } = await supabase.functions.invoke(
          'create-cashfree-order',
          {
            body: {
              delivery_address: addressSnapshot,
            },
          }
        );

        if (fnErr || !cfOrder) {
          const detail = await getFunctionErrorMessage(
            fnErr,
            cfOrder?.error || 'Unable to initiate Cashfree payment session.'
          );
          throw new Error(detail);
        }

        const cashfreeMode = cfOrder.cf_env === 'production' ? 'production' : 'sandbox';
        const cashfree = await load({ mode: cashfreeMode });

        if (!cashfree) {
          throw new Error('Failed to load Cashfree checkout gateway.');
        }

        await cashfree.checkout({
          paymentSessionId: cfOrder.payment_session_id,
          redirectTarget: '_modal',
        });

        // Server-side verification for Buy Order
        const { data: verifyRes, error: verifyErr } = await supabase.functions.invoke(
          'verify-cashfree-payment',
          {
            body: {
              cashfree_order_id: cfOrder.cashfree_order_id,
            },
          }
        );

        if (verifyErr || !verifyRes?.success) {
          const detail = await getFunctionErrorMessage(
            verifyErr,
            verifyRes?.error ||
              'Payment was not completed. Your shopping bag has been preserved.'
          );
          throw new Error(detail);
        }

        await refreshCart();
        router.push(`/checkout/success?type=order&id=${verifyRes.order_id}&method=cashfree`);
      }
    } catch (err: unknown) {
      console.error('Checkout error:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Payment was not completed. Your shopping bag has been preserved so you can retry safely.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="max-w-4xl mx-auto py-20 text-center animate-pulse">Loading checkout options...</div>;
  }

  const grandTotal =
    checkoutType === 'rental'
      ? rentalCalculation?.grandTotal ?? 0
      : buyCalculation?.grandTotal ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="pb-6 border-b border-neutral-100 mb-8">
        <h1 className="font-serif text-3xl font-bold text-neutral-900">Secure Checkout</h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          100% Prepaid via Cashfree Payments • Guaranteed Sanitization & Doorstep Delivery
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Delivery Address & Payment Method */}
        <div className="lg:col-span-7 space-y-8">
          {/* Contact Verification */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-2xs space-y-4">
            <h3 className="font-semibold text-sm text-neutral-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              Contact Mobile Number
            </h3>
            <p className="text-xs text-neutral-500">
              Required for delivery coordination and payment verification.
            </p>
            <div className="relative max-w-sm">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-500">
                +91
              </span>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full pl-12 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-900 focus:outline-hidden focus:border-neutral-900"
              />
            </div>
          </div>

          {/* Delivery Address Section */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-neutral-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Delivery Address
              </h3>
              {!isAddingAddress && (
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(true)}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  + Add New Address
                </button>
              )}
            </div>

            {/* Saved Addresses Radio Group */}
            {!isAddingAddress && addresses.length > 0 && (
              <div className="space-y-3">
                {addresses.map((addr) => {
                  const isSelected = addr.id === selectedAddressId;
                  return (
                    <label
                      key={addr.id}
                      className={`block p-4 rounded-2xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/30 shadow-xs'
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="address_select"
                            checked={isSelected}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-neutral-900">{addr.full_name}</span>
                              <span className="text-[10px] uppercase font-bold tracking-wider bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md">
                                {addr.label}
                              </span>
                            </div>
                            <p className="text-neutral-600">
                              {addr.address_line1}
                              {addr.address_line2 ? `, ${addr.address_line2}` : ''}
                            </p>
                            <p className="text-neutral-500 font-medium">
                              {addr.city}, {addr.state} — {addr.pincode}
                            </p>
                            <p className="text-neutral-500 flex items-center gap-1">
                              Phone: <span className="font-semibold">{addr.phone}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Add Address Form */}
            {isAddingAddress && (
              <form onSubmit={handleSaveAddress} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-neutral-500 block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Recipient full name"
                      value={newAddress.full_name}
                      onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                      className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:border-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-neutral-500 block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:border-neutral-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-500 block mb-1">Address Line 1</label>
                  <input
                    type="text"
                    required
                    placeholder="House / Flat / Building No., Street Name"
                    value={newAddress.address_line1}
                    onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                    className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-500 block mb-1">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    placeholder="Landmark, Area, Floor"
                    value={newAddress.address_line2}
                    onChange={(e) => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                    className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:border-neutral-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-neutral-500 block mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:border-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-neutral-500 block mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:border-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-neutral-500 block mb-1">Pincode</label>
                    <input
                      type="text"
                      required
                      placeholder="6-digit pincode"
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                      className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:border-neutral-900"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="py-2 px-5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Save Address
                  </button>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="text-xs text-neutral-500 hover:text-neutral-900"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* Payment Method Selector — 100% PREPAID ONLY */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-neutral-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Payment Gateway
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Prepaid Only
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-emerald-600 bg-emerald-50/40 text-xs shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                  Cashfree
                </div>
                <div>
                  <span className="font-bold text-neutral-900 text-sm block">
                    Cashfree Payments (Prepaid Only)
                  </span>
                  <span className="text-neutral-500 text-xs mt-0.5 block">
                    Fast & secure via UPI (GPay, PhonePe, Paytm), Debit/Credit Cards, Net Banking
                  </span>
                </div>
              </div>
              <div className="w-4 h-4 rounded-full border-2 border-emerald-600 bg-emerald-600 flex items-center justify-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-[11px] text-neutral-600 space-y-1">
              <p className="font-semibold text-neutral-800">
                🛡️ 100% Prepaid Policy — Cash on Delivery is not available.
              </p>
              <p className="leading-relaxed">
                All rental bookings and purchases must be confirmed via Cashfree prior to dispatch. Security deposits are tracked separately and refunded following post-rental garment inspection.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order CTA */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-neutral-50 rounded-3xl p-6 border border-neutral-200 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-neutral-900">
                {checkoutType === 'rental'
                  ? `Rental Summary (${activeRentalItems.length} outfit${activeRentalItems.length > 1 ? 's' : ''})`
                  : `Purchase Summary (${activeBuyItems.length} item${activeBuyItems.length > 1 ? 's' : ''})`}
              </h3>
              <Link href="/cart" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold">
                Edit Bag
              </Link>
            </div>

            {/* Warning for items missing rental dates */}
            {checkoutType === 'rental' && incompletRentalItems.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1.5">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  {incompletRentalItems.length} rental item(s) in your bag need dates
                </p>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Every rental outfit requires a start and return date before it can be processed. Return to your shopping bag to pick dates.
                </p>
                <Link href="/cart" className="inline-block text-[11px] font-bold text-amber-900 underline">
                  Select Dates in Shopping Bag &rarr;
                </Link>
              </div>
            )}

            {/* Empty state when no rental items are ready */}
            {checkoutType === 'rental' && activeRentalItems.length === 0 && (
              <div className="py-8 text-center text-xs text-neutral-500 space-y-2">
                <p className="font-semibold text-neutral-800">No rental items ready for checkout</p>
                <p>Items in your cart require rental start and return dates before checking out.</p>
                <Link
                  href="/cart"
                  className="inline-block mt-2 px-4 py-2 rounded-full bg-neutral-900 text-white font-semibold text-xs"
                >
                  Go to Shopping Bag
                </Link>
              </div>
            )}

            {/* Multi-Item Rental Summary List */}
            {checkoutType === 'rental' && rentalCalculation && (
              <div className="space-y-4 pb-4 border-b border-neutral-200">
                {rentalCalculation.items.map((item, idx) => {
                  const cartItem = activeRentalItems[idx];
                  const imgUrl = cartItem?.product?.product_images?.[0]?.image_url || '/placeholder-dress.jpg';
                  return (
                    <div key={item.productId} className="flex gap-3 text-xs">
                      <div className="relative w-14 aspect-3/4 rounded-xl overflow-hidden bg-neutral-200 shrink-0">
                        <Image src={imgUrl} alt={item.title} fill className="object-cover object-top" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="font-bold text-neutral-900 line-clamp-1">{item.title}</h4>
                        <p className="text-neutral-500">
                          {item.rentalDays} Days ({formatDate(item.rentalStartDate)} → {formatDate(item.rentalEndDate)})
                        </p>
                        <div className="flex items-center justify-between text-neutral-700 pt-0.5">
                          <span>Rent: {formatCurrency(item.rentalAmount)}</span>
                          <span className="text-emerald-700 font-semibold">
                            Deposit: {formatCurrency(item.securityDeposit)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Multi-Item Buy Summary List */}
            {checkoutType === 'buy' && buyCalculation && (
              <div className="space-y-4 pb-4 border-b border-neutral-200">
                {buyCalculation.items.map((item, idx) => {
                  const cartItem = activeBuyItems[idx];
                  const imgUrl = cartItem?.product?.product_images?.[0]?.image_url || '/placeholder-dress.jpg';
                  return (
                    <div key={item.productId} className="flex gap-3 text-xs">
                      <div className="relative w-14 aspect-3/4 rounded-xl overflow-hidden bg-neutral-200 shrink-0">
                        <Image src={imgUrl} alt={item.title} fill className="object-cover object-top" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="font-bold text-neutral-900 line-clamp-1">{item.title}</h4>
                        <p className="text-neutral-500">
                          Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                        </p>
                        <div className="text-right font-bold text-neutral-900">
                          {formatCurrency(item.lineTotal)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pricing Breakdown */}
            <div className="space-y-2.5 text-xs text-neutral-600">
              {checkoutType === 'rental' && rentalCalculation && (
                <>
                  <div className="flex justify-between">
                    <span>Rental Subtotal</span>
                    <span className="font-semibold text-neutral-900">
                      {formatCurrency(rentalCalculation.rentalSubtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between text-emerald-800 bg-emerald-50/60 p-2 rounded-lg">
                    <span>Refundable Security Deposit (Total)</span>
                    <span className="font-bold">
                      {formatCurrency(rentalCalculation.depositTotal)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Sanitized Doorstep Delivery</span>
                    <span className="font-semibold text-neutral-900">
                      {formatCurrency(rentalCalculation.deliveryTotal)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Prepaid Return Logistics</span>
                    <span className="font-semibold text-neutral-900">
                      {formatCurrency(rentalCalculation.pickupReturnTotal)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Buyer Platform Service Fee</span>
                    <span className="font-semibold text-neutral-900">
                      {formatCurrency(rentalCalculation.buyerFeeTotal)}
                    </span>
                  </div>
                </>
              )}

              {checkoutType === 'buy' && buyCalculation && (
                <>
                  <div className="flex justify-between">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-neutral-900">
                      {formatCurrency(buyCalculation.subtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Standard Delivery</span>
                    <span className="font-semibold text-neutral-900">
                      {formatCurrency(buyCalculation.deliveryTotal)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Platform Service Fee</span>
                    <span className="font-semibold text-neutral-900">
                      {formatCurrency(buyCalculation.buyerFeeTotal)}
                    </span>
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-neutral-200 flex justify-between text-base font-bold text-neutral-950">
                <span>Total Payable Now</span>
                <span className="text-emerald-700">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              disabled={isProcessing || grandTotal <= 0}
              onClick={handleProceedToPayment}
              className="w-full py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing
                ? 'Securing Payment Session...'
                : `Pay ${formatCurrency(grandTotal)} via Cashfree (Prepaid)`}
            </button>

            <div className="text-[11px] text-neutral-400 text-center flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Cashfree 256-bit SSL Encrypted • Instant Verification
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
