'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { RentalBookingWithDetails } from '@/types/database';
import {
  Calendar,
  CheckCircle,
  Truck,
  RotateCcw,
  Clock,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';

export default function SellerRentalsPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [rentals, setRentals] = useState<RentalBookingWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRentals = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('rental_bookings')
        .select(`
          *,
          product:products (
            *,
            product_images (*)
          ),
          buyer:profiles!rental_bookings_buyer_id_fkey (id, full_name, phone)
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRentals(data as unknown as RentalBookingWithDetails[]);
      }
    } catch (err) {
      console.error('Error fetching seller rentals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
  }, [user]);

  const handleAdvanceStatus = async (bookingId: string, nextStatus: string) => {
    setActionLoading(bookingId);
    try {
      const { error } = await supabase.rpc('advance_rental_fulfillment_status', {
        p_booking_id: bookingId,
        p_new_status: nextStatus,
      });

      if (error) throw error;
      await fetchRentals();
    } catch (err) {
      console.error('Error advancing rental status:', err);
      alert('Could not update status: ' + (err as Error).message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <Link
        href="/seller/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="pb-6 border-b border-neutral-100">
        <h1 className="font-serif text-3xl font-bold text-neutral-900">Incoming Rental Bookings</h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Review buyer rental dates, confirm bookings, and manage garment sanitization handovers
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-40 bg-neutral-50 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : rentals.length === 0 ? (
        <div className="text-center py-20 bg-neutral-50 rounded-3xl border border-neutral-100 p-8">
          <Calendar className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
          <h3 className="font-semibold text-base text-neutral-900">No Rental Requests</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            When buyers book your outfits for celebrations, requests will appear here for fulfillment.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {rentals.map((booking) => {
            const product = booking.product;
            const status = booking.fulfillment_status || booking.status;
            const imgUrl = product?.product_images?.[0]?.image_url || '/placeholder-dress.jpg';

            return (
              <div
                key={booking.id}
                className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-2xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 text-xs">
                  <div>
                    <span className="font-mono font-bold text-neutral-900">
                      Booking #{booking.id.slice(0, 8)}
                    </span>
                    <span className="text-neutral-400 ml-2">
                      Received {formatDate(booking.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full">
                      Status: {status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-2 relative aspect-3/4 rounded-2xl overflow-hidden bg-neutral-100">
                    <Image src={imgUrl} alt="Product" fill className="object-cover object-top" />
                  </div>

                  <div className="md:col-span-5 space-y-1.5 text-xs">
                    <h4 className="font-bold text-neutral-900 text-sm">{product?.title}</h4>
                    <p className="text-neutral-600">
                      Buyer:{' '}
                      <strong>{booking.buyer?.full_name || 'Customer'}</strong> ({booking.buyer?.phone || 'No phone'})
                    </p>
                    <p className="text-emerald-700 font-medium flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(booking.rental_start_date)} — {formatDate(booking.rental_end_date)} ({booking.rental_days} days)
                    </p>
                    {booking.selected_size && (
                      <span className="inline-block bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-md font-semibold">
                        Size: {booking.selected_size}
                      </span>
                    )}
                  </div>

                  <div className="md:col-span-3 text-right space-y-1 text-xs">
                    <div>
                      <span className="text-neutral-400">Rental Value: </span>
                      <span className="font-bold text-neutral-950 text-sm">
                        {formatCurrency(booking.rental_amount)}
                      </span>
                    </div>
                    <div className="text-emerald-700 text-[11px]">
                      Security Deposit: {formatCurrency(booking.security_deposit)}
                    </div>
                  </div>

                  {/* Actions to advance status */}
                  <div className="md:col-span-2 flex flex-col gap-2">
                    {status === 'pending' && (
                      <button
                        onClick={() => handleAdvanceStatus(booking.id, 'accepted')}
                        disabled={actionLoading === booking.id}
                        className="w-full py-2 px-3 rounded-full bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500"
                      >
                        Accept Booking
                      </button>
                    )}

                    {status === 'accepted' && (
                      <button
                        onClick={() => handleAdvanceStatus(booking.id, 'preparing')}
                        disabled={actionLoading === booking.id}
                        className="w-full py-2 px-3 rounded-full bg-neutral-950 text-white font-bold text-xs hover:bg-neutral-800"
                      >
                        Mark Sanitizing
                      </button>
                    )}

                    {status === 'preparing' && (
                      <button
                        onClick={() => handleAdvanceStatus(booking.id, 'ready_for_pickup')}
                        disabled={actionLoading === booking.id}
                        className="w-full py-2 px-3 rounded-full bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500"
                      >
                        Ready for Pickup
                      </button>
                    )}

                    {status === 'return_initiated' && (
                      <button
                        onClick={() => handleAdvanceStatus(booking.id, 'returned')}
                        disabled={actionLoading === booking.id}
                        className="w-full py-2 px-3 rounded-full bg-neutral-950 text-white font-bold text-xs"
                      >
                        Confirm Return Received
                      </button>
                    )}

                    {status === 'returned' && (
                      <button
                        onClick={() => handleAdvanceStatus(booking.id, 'completed')}
                        disabled={actionLoading === booking.id}
                        className="w-full py-2 px-3 rounded-full bg-emerald-700 text-white font-bold text-xs"
                      >
                        Inspection Passed (Complete)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
