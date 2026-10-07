'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useCity } from '@/context/CityContext';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Address, CartItemWithProduct, PlatformSettings } from '@/types/database';
import { load } from '@cashfreepayments/cashfree-js';
import {
  ShieldCheck,
  CreditCard,
  Banknote,
  MapPin,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle,
  Truck,
  ArrowRight,
  Phone,
} from 'lucide-react';

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
  const [paymentMethod] = useState<'cashfree'>('cashfree');
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

  // Selected items to checkout
  let activeRentalItem: CartItemWithProduct | null = null;
  let activeBuyItems: CartItemWithProduct[] = [];

  if (checkoutType === 'rental') {
    if (cartItemId) {
      activeRentalItem = cartItems.find((i) => i.id === cartItemId) || null;
    } else {
      activeRentalItem = cartItems.find((i) => i.purchase_type === 'rent') || null;
    }
  } else {
    activeBuyItems = cartItems.filter((i) => i.purchase_type === 'buy');
  }

  // Calculate pricing breakdown
  let subtotal = 0;
  let depositTotal = 0;
  let deliveryTotal = platformSettings?.default_delivery_charge ?? 70;
  let pickupReturnTotal = platformSettings?.pickup_return_charge ?? 70;
  let buyerFeeTotal = 0;
  let grandTotal = 0;

  if (checkoutType === 'rental' && activeRentalItem) {
    const prod = activeRentalItem.product;
    const days = activeRentalItem.rental_days || 3;
    const daily = prod?.rent_price_per_day || 0;
    subtotal = daily * days;
    depositTotal = prod?.security_deposit || Math.round(subtotal * ((platformSettings?.default_security_deposit_percentage ?? 20) / 100));
    deliveryTotal = prod?.delivery_charge ?? (platformSettings?.default_delivery_charge ?? 70);
    pickupReturnTotal = platformSettings?.pickup_return_charge ?? 70;
    buyerFeeTotal = Math.round(subtotal * ((platformSettings?.buyer_platform_fee_percentage ?? 5) / 100));
    grandTotal = subtotal + depositTotal + deliveryTotal + pickupReturnTotal + buyerFeeTotal;
  } else if (checkoutType === 'buy' && activeBuyItems.length > 0) {
    subtotal = activeBuyItems.reduce((acc, item) => {
      const price = item.product?.discount_price || item.product?.sale_price || 0;
      return acc + price * item.quantity;
    }, 0);
    deliveryTotal = platformSettings?.default_delivery_charge ?? 70;
    pickupReturnTotal = 0;
    buyerFeeTotal = Math.round(subtotal * ((platformSettings?.buyer_platform_fee_percentage ?? 5) / 100));
    grandTotal = subtotal + deliveryTotal + buyerFeeTotal;
  }

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

  // Handle Complete Order / Payment
  const handleProceedToPayment = async () => {
    setErrorMessage(null);

    const cleanPhone = (contactPhone || selectedAddress?.phone || profile?.phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number for order notifications.');
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
      if (checkoutType === 'rental' && activeRentalItem) {
        // RENTAL FLOW (100% PREPAID)
        // Cashfree Online Payment
        const { data: cfOrder, error: fnErr } = await supabase.functions.invoke(
          'create-cashfree-rental-order',
          {
            body: {
              cart_item_id: activeRentalItem.id,
              product_id: activeRentalItem.product_id,
              rental_start_date: activeRentalItem.rental_start_date,
              rental_end_date: activeRentalItem.rental_end_date,
              selected_size: activeRentalItem.selected_size,
              selected_color: activeRentalItem.selected_color,
            },
          }
        );

        if (fnErr || !cfOrder) {
          throw new Error(fnErr?.message || cfOrder?.error || 'Unable to initiate Cashfree payment.');
        }

        // Initialize Cashfree SDK
        const cashfreeMode = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox';
        const cashfree = await load({ mode: cashfreeMode });

        if (!cashfree) {
          throw new Error('Failed to load Cashfree checkout gateway.');
        }

        // Launch Cashfree modal
        await cashfree.checkout({
          paymentSessionId: cfOrder.payment_session_id,
          redirectTarget: '_modal',
        });

        // Verify payment
        const { data: verifyRes, error: verifyErr } = await supabase.functions.invoke(
          'verify-cashfree-rental-payment',
          {
            body: {
              cashfree_order_id: cfOrder.cashfree_order_id,
            },
          }
        );

        if (verifyErr || !verifyRes?.success) {
          throw new Error(verifyErr?.message || verifyRes?.error || 'Payment verification pending.');
        }

        await refreshCart();
        router.push(`/checkout/success?type=rental&id=${verifyRes.booking_id}&method=cashfree`);
      } else {
        // BUY FLOW (100% PREPAID)
        // Cashfree Buy Order
        const { data: cfOrder, error: fnErr } = await supabase.functions.invoke(
          'create-cashfree-order',
          {
            body: {},
          }
        );

        if (fnErr || !cfOrder) {
          throw new Error(fnErr?.message || cfOrder?.error || 'Unable to initiate Cashfree payment.');
        }

        const cashfreeMode = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox';
        const cashfree = await load({ mode: cashfreeMode });

        if (!cashfree) {
          throw new Error('Failed to load Cashfree checkout gateway.');
        }

        await cashfree.checkout({
          paymentSessionId: cfOrder.payment_session_id,
          redirectTarget: '_modal',
        });

        // Verify buy order
        const { data: verifyRes, error: verifyErr } = await supabase.functions.invoke(
          'verify-cashfree-payment',
          {
            body: {
              cashfree_order_id: cfOrder.cashfree_order_id,
            },
          }
        );

        if (verifyErr || !verifyRes?.success) {
          throw new Error(verifyErr?.message || verifyRes?.error || 'Payment verification failed.');
        }

        await refreshCart();
        router.push(`/checkout/success?type=order&id=${verifyRes.order_id}&method=cashfree`);
      }
    } catch (err: unknown) {
      console.error('Checkout error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred during checkout.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="max-w-4xl mx-auto py-20 text-center animate-pulse">Loading checkout options...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="pb-6 border-b border-neutral-100 mb-8">
        <h1 className="font-serif text-3xl font-bold text-neutral-900">Secure Checkout</h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Fast and encrypted checkout powered by Cashfree Payments
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
              Required for SMS delivery updates and Cashfree verification.
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
                  <Plus className="w-3.5 h-3.5" /> Add New
                </button>
              )}
            </div>

            {/* List saved addresses */}
            {!isAddingAddress && addresses.length > 0 && (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all flex items-start justify-between ${
                      selectedAddressId === addr.id
                        ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900">{addr.full_name}</span>
                        <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-sm font-semibold uppercase text-[10px]">
                          {addr.label}
                        </span>
                      </div>
                      <p className="text-neutral-600 mt-1">
                        {addr.address_line1}
                        {addr.address_line2 ? `, ${addr.address_line2}` : ''}
                      </p>
                      <p className="text-neutral-600">
                        {addr.city}, {addr.state} — {addr.pincode}
                      </p>
                      <p className="text-neutral-500 mt-1 font-medium">Phone: {addr.phone}</p>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedAddressId === addr.id
                          ? 'border-emerald-600 bg-emerald-600'
                          : 'border-neutral-300'
                      }`}
                    >
                      {selectedAddressId === addr.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Address Form */}
            {isAddingAddress && (
              <form onSubmit={handleSaveAddress} className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-neutral-500 block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddress.full_name}
                      onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-neutral-500 block mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      required
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-500 block mb-1">
                    Street Address & House / Flat No.
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.address_line1}
                    onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-neutral-500 block mb-1">
                    Landmark / Area (Optional)
                  </label>
                  <input
                    type="text"
                    value={newAddress.address_line2}
                    onChange={(e) => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-neutral-500 block mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-neutral-500 block mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-neutral-500 block mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="py-2.5 px-6 rounded-xl bg-neutral-950 text-white font-bold text-xs"
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
                Payment Method
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Prepaid Only
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-emerald-600 bg-emerald-50/40 text-xs shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                  UPI / Cards
                </div>
                <div>
                  <span className="font-bold text-neutral-900 text-sm block">
                    Prepaid Online Payment (Instant Verification)
                  </span>
                  <span className="text-neutral-500 text-xs mt-0.5 block">
                    Instant bank confirmation via UPI (GPay, PhonePe, Paytm), Cards, Net Banking
                  </span>
                </div>
              </div>
              <div className="w-4 h-4 rounded-full border-2 border-emerald-600 bg-emerald-600 flex items-center justify-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              To guarantee security and timely doorstep logistics, all BlinkWear rentals and purchases require prepaid payment verification prior to garment dispatch.
            </p>
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order CTA */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-neutral-50 rounded-3xl p-6 border border-neutral-200 space-y-6">
            <h3 className="font-semibold text-sm text-neutral-900">
              {checkoutType === 'rental' ? 'Rental Booking Summary' : 'Purchase Order Summary'}
            </h3>

            {/* Item summary */}
            {checkoutType === 'rental' && activeRentalItem && (
              <div className="flex gap-4 pb-4 border-b border-neutral-200">
                <div className="relative w-16 aspect-3/4 rounded-xl overflow-hidden bg-neutral-200 shrink-0">
                  <Image
                    src={activeRentalItem.product?.product_images?.[0]?.image_url || '/placeholder-dress.jpg'}
                    alt="Product"
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-neutral-900 line-clamp-1">
                    {activeRentalItem.product?.title}
                  </h4>
                  <p className="text-neutral-500">
                    Rental Duration: {activeRentalItem.rental_days} Days
                  </p>
                  <p className="text-emerald-700 font-medium">
                    {formatDate(activeRentalItem.rental_start_date)} — {formatDate(activeRentalItem.rental_end_date)}
                  </p>
                </div>
              </div>
            )}

            {/* Pricing breakdown */}
            <div className="space-y-2 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>{checkoutType === 'rental' ? 'Rental Fee' : 'Items Subtotal'}</span>
                <span className="font-semibold text-neutral-900">{formatCurrency(subtotal)}</span>
              </div>

              {checkoutType === 'rental' && (
                <div className="flex justify-between text-emerald-800">
                  <span>Refundable Security Deposit</span>
                  <span className="font-bold">{formatCurrency(depositTotal)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Sanitized Doorstep Delivery</span>
                <span className="font-semibold text-neutral-900">{formatCurrency(deliveryTotal)}</span>
              </div>

              {pickupReturnTotal > 0 && (
                <div className="flex justify-between">
                  <span>Prepaid Reverse Pickup</span>
                  <span className="font-semibold text-neutral-900">{formatCurrency(pickupReturnTotal)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Buyer Platform Service Fee</span>
                <span className="font-semibold text-neutral-900">{formatCurrency(buyerFeeTotal)}</span>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-between text-base font-bold text-neutral-950">
                <span>Total Amount</span>
                <span className="text-emerald-700">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleProceedToPayment}
              className="w-full py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing
                ? 'Connecting to Payment Gateway...'
                : `Pay ${formatCurrency(grandTotal)} (Prepaid Online)`}
            </button>

            <div className="text-[11px] text-neutral-400 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              256-bit SSL encrypted • Instant bank reconciliation
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
