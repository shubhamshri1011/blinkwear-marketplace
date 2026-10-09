'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCity } from '@/context/CityContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate, calculateRentalDays, calculateRentalPricing } from '@/lib/utils';
import type { PlatformSettings, ProductWithImages, SellerStorefront } from '@/types/database';
import {
  Heart,
  MapPin,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  Calendar,
  AlertCircle,
  CheckCircle,
  Share2,
  Store,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface ProductDetailViewProps {
  product: ProductWithImages;
  sellerStorefront: SellerStorefront | null;
  platformSettings: PlatformSettings | null;
}

export function ProductDetailView({
  product,
  sellerStorefront,
  platformSettings,
}: ProductDetailViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedCity } = useCity();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const supabase = createClient();
  const wishlisted = isInWishlist(product.id);

  // Gallery
  const images = product.product_images && product.product_images.length > 0
    ? [...product.product_images].sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Mode: 'rent' or 'buy'
  const defaultMode = product.listing_type === 'sale' ? 'buy' : 'rent';
  const [activeMode, setActiveMode] = useState<'rent' | 'buy'>(defaultMode);

  // Size & Color selection
  const availableSizes = product.size ? product.size.split(',').map((s) => s.trim()) : ['Free Size'];
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] || 'Free Size');

  const availableColors = product.color ? product.color.split(',').map((c) => c.trim()) : [];
  const [selectedColor, setSelectedColor] = useState<string>(availableColors[0] || '');

  // Rental Dates
  const getInitialDates = () => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + 3); // 3 days in advance
    const end = new Date(start);
    end.setDate(start.getDate() + 3); // 4 days rental
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  const initialDates = getInitialDates();
  const [rentalStartDate, setRentalStartDate] = useState<string>(initialDates.start);
  const [rentalEndDate, setRentalEndDate] = useState<string>(initialDates.end);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isDateAvailable, setIsDateAvailable] = useState<boolean | null>(true);
  const [availabilityMessage, setAvailabilityMessage] = useState<string>('');

  // Cart / Action feedback
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Increment product view count silently on mount
  useEffect(() => {
    supabase.rpc('increment_product_views', { p_product_id: product.id }).then(() => {});
  }, [product.id, supabase]);

  // Check rental availability whenever dates change
  useEffect(() => {
    if (activeMode !== 'rent' || !rentalStartDate || !rentalEndDate) return;

    let isMounted = true;

    async function checkAvailability() {
      setIsCheckingAvailability(true);
      setActionError(null);

      try {
        const start = new Date(rentalStartDate);
        const end = new Date(rentalEndDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today) {
          if (isMounted) {
            setIsDateAvailable(false);
            setAvailabilityMessage('Start date cannot be in the past.');
            setIsCheckingAvailability(false);
          }
          return;
        }

        if (end < start) {
          if (isMounted) {
            setIsDateAvailable(false);
            setAvailabilityMessage('End date must be on or after start date.');
            setIsCheckingAvailability(false);
          }
          return;
        }

        const days = calculateRentalDays(rentalStartDate, rentalEndDate);
        if (product.min_rental_days && days < product.min_rental_days) {
          if (isMounted) {
            setIsDateAvailable(false);
            setAvailabilityMessage(`Minimum rental period is ${product.min_rental_days} days.`);
            setIsCheckingAvailability(false);
          }
          return;
        }

        if (product.max_rental_days && days > product.max_rental_days) {
          if (isMounted) {
            setIsDateAvailable(false);
            setAvailabilityMessage(`Maximum rental period is ${product.max_rental_days} days.`);
            setIsCheckingAvailability(false);
          }
          return;
        }

        const { data, error } = await supabase.rpc('check_rental_availability', {
          p_product_id: product.id,
          p_start_date: rentalStartDate,
          p_end_date: rentalEndDate,
        });

        if (isMounted) {
          if (error) {
            console.error('Availability check error:', error);
            setIsDateAvailable(true); // graceful fallback
            setAvailabilityMessage('');
          } else {
            setIsDateAvailable(data);
            setAvailabilityMessage(
              data
                ? 'Outfit is available for these dates!'
                : 'Already booked for these dates. Please choose different dates.'
            );
          }
          setIsCheckingAvailability(false);
        }
      } catch (err) {
        console.error('Error checking availability:', err);
        if (isMounted) {
          setIsDateAvailable(true);
          setIsCheckingAvailability(false);
        }
      }
    }

    checkAvailability();

    return () => {
      isMounted = false;
    };
  }, [rentalStartDate, rentalEndDate, activeMode, product, supabase]);

  // Pricing calculation
  const rentalDays = calculateRentalDays(rentalStartDate, rentalEndDate);
  const pricing = calculateRentalPricing({
    rentPricePerDay: product.rent_price_per_day || 0,
    days: rentalDays,
    securityDeposit: product.security_deposit,
    deliveryCharge: product.delivery_charge ?? platformSettings?.default_delivery_charge ?? 70,
    pickupReturnCharge: platformSettings?.pickup_return_charge ?? 70,
    buyerPlatformFeePct: platformSettings?.buyer_platform_fee_percentage ?? 5,
    defaultSecurityDepositPct: platformSettings?.default_security_deposit_percentage ?? 20,
  });

  // City compatibility check
  const isCityMismatch = Boolean(
    activeMode === 'rent' &&
    product.city &&
    selectedCity &&
    product.city.toLowerCase() !== selectedCity.toLowerCase()
  );

  const handleAddToCart = async (instantCheckout = false) => {
    setActionError(null);

    if (!user) {
      router.push(`/login?redirect=/products/${product.id}`);
      return;
    }

    if (isCityMismatch) {
      setActionError(`This rental is only available in ${product.city}.`);
      return;
    }

    if (activeMode === 'rent' && !isDateAvailable) {
      setActionError(availabilityMessage || 'Selected dates are unavailable.');
      return;
    }

    setIsSubmitting(true);

    const res = await addToCart({
      productId: product.id,
      product,
      purchaseType: activeMode,
      quantity: 1,
      selectedSize,
      selectedColor: selectedColor || null,
      rentalStartDate: activeMode === 'rent' ? rentalStartDate : null,
      rentalEndDate: activeMode === 'rent' ? rentalEndDate : null,
      rentalDays: activeMode === 'rent' ? rentalDays : null,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setActionError(res.error || 'Failed to add item to bag.');
    } else {
      if (instantCheckout) {
        router.push('/checkout');
      } else {
        router.push('/cart');
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Check out ${product.title} on BlinkWear!`,
          url: window.location.href,
        });
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-neutral-400 mb-6 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-neutral-700 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-neutral-700 transition-colors">
          Collection
        </Link>
        {product.category && (
          <>
            <span>/</span>
            <Link
              href={`/category/${product.category.slug}`}
              className="hover:text-neutral-700 transition-colors"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-neutral-900 font-medium truncate max-w-[200px]">
          {product.title}
        </span>
      </nav>

      {/* Main 2-Column Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left: Gallery Column */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Large Image */}
          <div className="relative aspect-3/4 w-full rounded-3xl overflow-hidden bg-neutral-100 shadow-xs border border-neutral-100">
            <Image
              src={images[activeImageIndex]?.image_url || '/placeholder-dress.jpg'}
              alt={product.title}
              fill
              priority
              className="object-cover object-top transition-all duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target && !target.src.includes('placeholder-dress.jpg')) {
                  target.src = '/placeholder-dress.jpg';
                }
              }}
            />

            {/* Badges on Top */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              {product.featured && (
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider bg-amber-500 text-white px-3 py-1 rounded-full shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" /> Featured
                </span>
              )}
              {product.city && (
                <span className="inline-flex items-center gap-1 text-xs font-medium bg-neutral-950/80 backdrop-blur-md text-white px-3 py-1 rounded-full">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Hub: {product.city}
                </span>
              )}
            </div>

            {/* Wishlist & Share Buttons */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <button
                onClick={handleShare}
                aria-label="Share outfit"
                className="p-2.5 rounded-full bg-white/80 hover:bg-white text-neutral-700 hover:text-neutral-950 backdrop-blur-md shadow-xs transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleWishlist(product.id)}
                aria-label="Toggle wishlist"
                className={`p-2.5 rounded-full backdrop-blur-md shadow-xs transition-colors ${
                  wishlisted
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-white/80 hover:bg-white text-neutral-700 hover:text-neutral-950'
                }`}
              >
                <Heart className={`w-4 h-4 ${wishlisted ? 'fill-rose-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Thumbnails Row */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 aspect-3/4 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    activeImageIndex === idx
                      ? 'border-neutral-950 ring-2 ring-neutral-950/20'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img.image_url}
                    alt={`${product.title} - ${idx + 1}`}
                    fill
                    className="object-cover object-top"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Hygiene & Inspection Assurance Block */}
          <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200 mt-6 space-y-4">
            <h4 className="font-semibold text-sm text-neutral-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              BlinkWear Hygiene & Quality Promise
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-neutral-600">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Hospital-grade dry cleaned & UV sanitized prior to dispatch.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Delivered in tamper-proof garment bag with free return pickup.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <RotateCcw className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>100% security deposit refund guaranteed post-inspection.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Booking & Product Specifications Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Header Title Area */}
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
              <span className="font-bold uppercase tracking-wider text-emerald-700">
                {product.brand || 'BlinkWear Atelier'}
              </span>
              {product.condition && (
                <span className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-md font-medium capitalize">
                  Condition: {product.condition.replace('_', ' ')}
                </span>
              )}
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 leading-snug">
              {product.title}
            </h1>
          </div>

          {/* Rent vs Buy Mode Switch (if both available) */}
          {product.listing_type === 'both' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1.5 bg-neutral-100 rounded-2xl border border-neutral-200">
              <button
                type="button"
                onClick={() => setActiveMode('rent')}
                className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  activeMode === 'rent'
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <span>Rent for Event</span>
                <span className="text-[10px] sm:text-xs font-normal opacity-85">
                  (from {formatCurrency(product.rent_price_per_day)}/day)
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('buy')}
                className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
                  activeMode === 'buy'
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <span>Buy Pre-Loved</span>
                <span className="text-[10px] sm:text-xs font-normal opacity-85">
                  ({formatCurrency(product.discount_price || product.sale_price)})
                </span>
              </button>
            </div>
          )}

          {/* City Mismatch Warning */}
          {isCityMismatch && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-800">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-semibold">City Notice:</span> This item is in{' '}
                <strong className="underline">{product.city}</strong>, but your delivering city is{' '}
                <strong>{selectedCity}</strong>. Local fashion rentals must take place within the same city.
              </div>
            </div>
          )}

          {/* RENTAL MODE CONFIGURATION */}
          {activeMode === 'rent' && (
            <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-xs space-y-6">
              {/* Daily Rent Highlight */}
              <div className="flex items-baseline justify-between pb-4 border-b border-neutral-100">
                <div>
                  <span className="text-xs text-neutral-400 font-medium">Rental Rate</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-extrabold text-neutral-950">
                      {formatCurrency(product.rent_price_per_day)}
                    </span>
                    <span className="text-xs text-neutral-500 font-medium">/ day</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-neutral-400 font-medium">Security Deposit</span>
                  <p className="text-sm font-bold text-neutral-800 mt-0.5">
                    {formatCurrency(pricing.securityDeposit)}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-medium">100% Refundable</span>
                </div>
              </div>

              {/* Date Selection Area */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center justify-between">
                  <span>Select Event & Rental Dates</span>
                  <span className="text-emerald-600 font-medium lowercase">
                    ({rentalDays} days selected)
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-neutral-400 block mb-1">Delivery Date</span>
                    <input
                      type="date"
                      value={rentalStartDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setRentalStartDate(e.target.value)}
                      aria-label="Rental start date"
                      className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-neutral-900"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-neutral-400 block mb-1">Pickup Date</span>
                    <input
                      type="date"
                      value={rentalEndDate}
                      min={rentalStartDate}
                      onChange={(e) => setRentalEndDate(e.target.value)}
                      aria-label="Rental end date"
                      className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-neutral-900"
                    />
                  </div>
                </div>

                {/* Availability status badge */}
                <div className="flex items-center gap-2 pt-1 text-xs">
                  {isCheckingAvailability ? (
                    <span className="text-neutral-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 animate-spin" /> Checking date availability...
                    </span>
                  ) : isDateAvailable ? (
                    <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" /> Available for these dates
                    </span>
                  ) : (
                    <span className="text-rose-600 font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-500" /> {availabilityMessage}
                    </span>
                  )}
                </div>
              </div>

              {/* Sizes Selection */}
              {availableSizes.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
                    Available Size
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          selectedSize === s
                            ? 'border-neutral-950 bg-neutral-950 text-white shadow-xs'
                            : 'border-neutral-200 text-neutral-800 hover:border-neutral-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Breakdown Accordion */}
              <div className="bg-neutral-50 rounded-2xl p-4 space-y-2 text-xs text-neutral-600 border border-neutral-100">
                <span className="font-semibold text-neutral-900 block mb-1">
                  Estimated Rental Breakdown ({rentalDays} Days)
                </span>
                <div className="flex justify-between">
                  <span>Rental Fee ({formatCurrency(product.rent_price_per_day)} × {rentalDays} days)</span>
                  <span className="font-medium text-neutral-900">{formatCurrency(pricing.rentalAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Refundable Security Deposit</span>
                  <span className="font-semibold">{formatCurrency(pricing.securityDeposit)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sanitized Delivery & Reverse Pickup</span>
                  <span className="font-medium text-neutral-900">
                    {formatCurrency(pricing.deliveryCharge + pricing.pickupReturnCharge)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Buyer Platform Fee (5%)</span>
                  <span className="font-medium text-neutral-900">{formatCurrency(pricing.buyerPlatformFee)}</span>
                </div>
                <div className="pt-2 border-t border-neutral-200 flex justify-between font-bold text-sm text-neutral-950">
                  <span>Total Payable Now</span>
                  <span className="text-emerald-700">{formatCurrency(pricing.totalCharged)}</span>
                </div>
                <p className="text-[10px] text-neutral-400 mt-1">
                  * {formatCurrency(pricing.securityDeposit)} is refunded to your original payment method immediately following return inspection.
                </p>
              </div>

              {/* Action Error Notification */}
              {actionError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {actionError}
                </div>
              )}

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting || !isDateAvailable || isCityMismatch}
                  onClick={() => handleAddToCart(false)}
                  className="py-3.5 px-4 rounded-full border border-neutral-900 text-neutral-900 font-bold text-xs hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  Add to Bag
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || !isDateAvailable || isCityMismatch}
                  onClick={() => handleAddToCart(true)}
                  className="py-3.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Reserving...' : 'Rent Now'}
                </button>
              </div>
            </div>
          )}

          {/* BUY MODE CONFIGURATION */}
          {activeMode === 'buy' && (
            <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-xs space-y-6">
              <div className="flex items-baseline gap-3 pb-4 border-b border-neutral-100">
                <span className="text-3xl font-extrabold text-neutral-950">
                  {formatCurrency(product.discount_price || product.sale_price)}
                </span>
                {product.discount_price && product.sale_price && product.sale_price > product.discount_price && (
                  <span className="text-base text-neutral-400 line-through">
                    {formatCurrency(product.sale_price)}
                  </span>
                )}
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Verified Pre-Loved
                </span>
              </div>

              {/* Size selection */}
              {availableSizes.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
                    Select Size
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          selectedSize === s
                            ? 'border-neutral-950 bg-neutral-950 text-white shadow-xs'
                            : 'border-neutral-200 text-neutral-800 hover:border-neutral-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock status */}
              <div className="text-xs text-neutral-600">
                {product.stock_quantity > 0 ? (
                  <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> In stock — Ready for fast dispatch
                  </span>
                ) : (
                  <span className="text-rose-600 font-medium">Currently Sold Out</span>
                )}
              </div>

              {/* Action Error */}
              {actionError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {actionError}
                </div>
              )}

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting || product.stock_quantity <= 0}
                  onClick={() => handleAddToCart(false)}
                  className="py-3.5 px-4 rounded-full border border-neutral-900 text-neutral-900 font-bold text-xs hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  Add to Bag
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || product.stock_quantity <= 0}
                  onClick={() => handleAddToCart(true)}
                  className="py-3.5 px-4 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Buy Now'}
                </button>
              </div>
            </div>
          )}

          {/* Seller Storefront Info Card */}
          {sellerStorefront && (
            <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">
                  {sellerStorefront.store_name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h5 className="font-semibold text-xs text-neutral-900">
                      {sellerStorefront.store_name}
                    </h5>
                    {sellerStorefront.is_verified && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-sm">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    BlinkWear Seller • {sellerStorefront.city}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-neutral-400">Authenticity</span>
                <p className="text-xs font-bold text-neutral-800">100% Guaranteed</p>
              </div>
            </div>
          )}

          {/* Product Description & Details */}
          <div className="space-y-4 pt-4 border-t border-neutral-200">
            <h4 className="font-semibold text-sm text-neutral-900">Garment Description</h4>
            <div className="text-xs text-neutral-600 leading-relaxed space-y-2 whitespace-pre-line">
              {product.description || 'Exclusive luxury designer piece curated for weddings and festive galas.'}
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 gap-3 pt-3 text-xs">
              <div className="p-3 bg-neutral-50 rounded-xl">
                <span className="text-neutral-400 block">Brand / Designer</span>
                <span className="font-semibold text-neutral-900 mt-0.5 block">
                  {product.brand || 'BlinkWear Selected'}
                </span>
              </div>
              <div className="p-3 bg-neutral-50 rounded-xl">
                <span className="text-neutral-400 block">Condition</span>
                <span className="font-semibold text-neutral-900 mt-0.5 block capitalize">
                  {product.condition?.replace('_', ' ') || 'Pristine'}
                </span>
              </div>
              <div className="p-3 bg-neutral-50 rounded-xl">
                <span className="text-neutral-400 block">City Hub</span>
                <span className="font-semibold text-neutral-900 mt-0.5 block">
                  {product.city}
                </span>
              </div>
              <div className="p-3 bg-neutral-50 rounded-xl">
                <span className="text-neutral-400 block">Rental Limits</span>
                <span className="font-semibold text-neutral-900 mt-0.5 block">
                  {product.min_rental_days || 3} to {product.max_rental_days || 10} days
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
