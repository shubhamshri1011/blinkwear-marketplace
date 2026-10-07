'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { RentalBookingWithDetails } from '@/types/database';
import {
  Calendar,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  Truck,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  MapPin,
} from 'lucide-react';

interface RentalDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function RentalDetailPage({ params }: RentalDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [booking, setBooking] = useState<RentalBookingWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    async function fetchBooking() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('rental_bookings')
          .select(`
            *,
            product:products (
              *,
              product_images (*)
            )
          `)
          .eq('id', id)
          .eq('buyer_id', user!.id)
          .single();

        if (!error && data) {
          setBooking(data as unknown as RentalBookingWithDetails);
        }
      } catch (err) {
        console.error('Error fetching booking details:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBooking();
  }, [id, user, supabase]);

  const handleInitiateReturn = async () => {
    if (!booking) return;
    setIsUpdating(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const { data, error } = await supabase.rpc('advance_rental_fulfillment_status', {
        p_booking_id: booking.id,
        p_new_status: 'return_initiated',
      });

      if (error) throw error;

      setActionMessage('Return pickup requested! Pack the outfit in the provided garment bag.');
      setBooking((prev) => prev ? { ...prev, fulfillment_status: 'return_initiated' } : null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to request return');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking || !confirm('Are you sure you want to cancel this booking?')) return;
    setIsUpdating(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const { data, error } = await supabase.rpc('cancel_rental_booking', {
        p_booking_id: booking.id,
        p_reason: 'Buyer cancelled prior to dispatch',
      });

      if (error) throw error;

      setActionMessage('Rental booking successfully cancelled.');
      setBooking((prev) => prev ? { ...prev, fulfillment_status: 'cancelled', status: 'cancelled' } : null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Cancellation failed');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <div className="max-w-4xl mx-auto py-20 text-center animate-pulse">Loading rental details...</div>;
  }

  if (!booking) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <h2 className="text-xl font-bold text-neutral-900">Booking Not Found</h2>
        <Link href="/rentals" className="inline-block mt-4 text-xs font-bold text-emerald-600 underline">
          Back to My Rentals
        </Link>
      </div>
    );
  }

  const currentStatus = booking.fulfillment_status || booking.status;

  const timelineSteps = [
    { id: 'pending', label: 'Booking Placed', desc: 'Order verified & recorded' },
    { id: 'accepted', label: 'Confirmed by Atelier', desc: 'Garment reserved' },
    { id: 'preparing', label: 'Dry Cleaning & UV Sanitization', desc: 'Hospital-grade care' },
    { id: 'out_for_delivery', label: 'Out for Delivery', desc: 'On its way to you' },
    { id: 'delivered', label: 'Delivered', desc: 'Enjoy your celebration' },
    { id: 'return_initiated', label: 'Return Scheduled', desc: 'Courier pickup dispatched' },
    { id: 'completed', label: 'Completed & Deposit Refunded', desc: 'Return inspected' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'pending': return 0;
      case 'accepted': return 1;
      case 'preparing':
      case 'ready_for_pickup':
      case 'picked_up': return 2;
      case 'out_for_delivery': return 3;
      case 'delivered': return 4;
      case 'return_initiated':
      case 'returned': return 5;
      case 'completed': return 6;
      default: return 0;
    }
  };

  const currentStepIdx = getStepIndex(currentStatus);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top back navigation */}
      <Link
        href="/rentals"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to All Rentals
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
            Booking #{booking.id.slice(0, 8)}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 mt-1">
            Rental Details & Live Tracking
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Booked on {formatDate(booking.created_at)} • Payment via {booking.payment_method.toUpperCase()}
          </p>
        </div>

        {/* Action button: Initiate Return */}
        {currentStatus === 'delivered' && (
          <button
            onClick={handleInitiateReturn}
            disabled={isUpdating}
            className="py-2.5 px-6 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {isUpdating ? 'Scheduling...' : 'Schedule Return Pickup'}
          </button>
        )}

        {/* Action button: Cancel */}
        {(currentStatus === 'pending' || currentStatus === 'accepted') && (
          <button
            onClick={handleCancelBooking}
            disabled={isUpdating}
            className="py-2.5 px-6 rounded-full border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors"
          >
            {isUpdating ? 'Cancelling...' : 'Cancel Booking'}
          </button>
        )}
      </div>

      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Visual Fulfillment Tracker */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-2xs space-y-6">
        <h3 className="font-semibold text-sm text-neutral-900">Fulfillment Status Timeline</h3>

        <div className="relative pl-6 sm:pl-0 sm:grid sm:grid-cols-7 gap-2">
          {timelineSteps.map((step, idx) => {
            const isCompleted = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;

            return (
              <div key={step.id} className="relative mb-6 sm:mb-0 sm:text-center group">
                {/* Step circle */}
                <div
                  className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-sm'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-100 text-neutral-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>

                <div className="sm:mt-3">
                  <h4 className={`text-xs font-bold ${isCompleted ? 'text-neutral-900' : 'text-neutral-400'}`}>
                    {step.label}
                  </h4>
                  <p className="text-[10px] text-neutral-500 mt-0.5 hidden sm:block">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Item & Financial Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Outfit Card */}
        <div className="md:col-span-7 bg-white rounded-3xl p-6 border border-neutral-200 shadow-2xs space-y-4">
          <h3 className="font-semibold text-sm text-neutral-900">Reserved Outfit</h3>

          <div className="flex gap-4 items-start">
            <div className="relative w-24 aspect-3/4 rounded-2xl overflow-hidden bg-neutral-100 shrink-0">
              <Image
                src={booking.product?.product_images?.[0]?.image_url || '/placeholder-dress.jpg'}
                alt={booking.product?.title || 'Outfit'}
                fill
                className="object-cover object-top"
              />
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="font-bold uppercase tracking-wider text-emerald-700">
                {booking.product?.brand || 'Designer'}
              </span>
              <h4 className="font-serif font-bold text-neutral-900 text-base">
                {booking.product?.title}
              </h4>
              <p className="text-neutral-600">
                Size: <strong className="text-neutral-900">{booking.selected_size || 'Standard'}</strong>
              </p>
              <div className="flex items-center gap-1.5 text-emerald-800 font-medium pt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {formatDate(booking.rental_start_date)} to {formatDate(booking.rental_end_date)} ({booking.rental_days} days)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing & Deposit Status Card */}
        <div className="md:col-span-5 bg-neutral-50 rounded-3xl p-6 border border-neutral-200 space-y-4">
          <h3 className="font-semibold text-sm text-neutral-900">Financial Summary</h3>

          <div className="space-y-2 text-xs text-neutral-600">
            <div className="flex justify-between">
              <span>Rental Fee ({booking.rental_days} days)</span>
              <span className="font-semibold text-neutral-900">{formatCurrency(booking.rental_amount)}</span>
            </div>
            <div className="flex justify-between text-emerald-800">
              <span>Refundable Security Deposit</span>
              <span className="font-bold">{formatCurrency(booking.security_deposit)}</span>
            </div>
            <div className="flex justify-between">
              <span>Deposit Refund Status</span>
              <span className="font-semibold capitalize text-neutral-900">
                {booking.deposit_refund_status.replace('_', ' ')}
              </span>
            </div>
            <div className="pt-2 border-t border-neutral-200 flex justify-between font-bold text-sm text-neutral-950">
              <span>Total Charged</span>
              <span className="text-emerald-700">{formatCurrency(booking.total_charged)}</span>
            </div>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-neutral-200 text-[11px] text-neutral-500 space-y-1">
            <span className="font-bold text-neutral-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Deposit Guarantee
            </span>
            <p>
              Deposits are refunded to your original payment method automatically within 24-48 hours of return quality inspection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
