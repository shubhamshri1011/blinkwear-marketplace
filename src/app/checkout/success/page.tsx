import React, { Suspense } from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  Calendar,
  Sparkles,
  Truck,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface SuccessPageProps {
  searchParams: Promise<{
    type?: string;
    id?: string;
    method?: string;
  }>;
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const resolvedParams = await searchParams;
  const isRental = resolvedParams.type === 'rental';
  const orderId = resolvedParams.id || 'BW-CONFIRMED';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
      {/* Success Badge */}
      <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100">
        <CheckCircle className="w-10 h-10" />
      </div>

      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
        {isRental ? 'Rental Booking Confirmed' : 'Purchase Order Confirmed'}
      </span>

      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900 mt-3">
        Thank You for Your Order!
      </h1>

      <p className="text-xs sm:text-sm text-neutral-500 mt-2 max-w-md mx-auto">
        Your booking has been received and verified. Reference ID:{' '}
        <span className="font-mono font-bold text-neutral-800">{orderId}</span>
      </p>

      {/* Progress Cards */}
      <div className="mt-10 bg-neutral-50 rounded-3xl p-6 sm:p-8 border border-neutral-200 text-left space-y-6">
        <h3 className="font-semibold text-sm text-neutral-900">What Happens Next?</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
              1
            </div>
            <h4 className="font-bold text-xs text-neutral-900">Hospital-Grade Sanitization</h4>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Our atelier team dry cleans, steam-presses, and UV-sanitizes your outfit.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
              2
            </div>
            <h4 className="font-bold text-xs text-neutral-900">Doorstep Delivery</h4>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Delivered safely in an airtight protective garment bag before your event.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
              3
            </div>
            <h4 className="font-bold text-xs text-neutral-900">
              {isRental ? 'Reverse Pickup & Deposit Refund' : 'Delivered to Keep'}
            </h4>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              {isRental
                ? 'Our courier collects from your doorstep on your return date. 100% deposit refunded.'
                : 'Enjoy your designer purchase with our authenticity guarantee.'}
            </p>
          </div>
        </div>
      </div>

      {/* Action links */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        {isRental ? (
          <Link
            href="/rentals"
            className="px-8 py-3.5 rounded-full bg-neutral-950 text-white font-bold text-xs hover:bg-neutral-800 transition-colors shadow-md"
          >
            Track My Rental Booking
          </Link>
        ) : (
          <Link
            href="/orders"
            className="px-8 py-3.5 rounded-full bg-neutral-950 text-white font-bold text-xs hover:bg-neutral-800 transition-colors shadow-md"
          >
            View My Orders
          </Link>
        )}

        <Link
          href="/products"
          className="px-8 py-3.5 rounded-full border border-neutral-300 text-neutral-800 font-bold text-xs hover:bg-neutral-50 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
