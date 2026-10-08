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
  Clock,
  CheckCircle,
  Truck,
  RotateCcw,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';

export default function RentalsPage() {
  const { user } = useAuth();
  const [rentals, setRentals] = useState<RentalBookingWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    async function fetchRentals() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('rental_bookings')
          .select(`
            *,
            product:products (
              id, seller_id, category_id, subcategory_id, title, description, brand,
              size, color, condition, listing_type, sale_price, discount_price,
              rent_price_per_day, security_deposit, delivery_charge, city, status,
              view_count, stock_quantity, min_rental_days, max_rental_days, search_tags,
              video_url, featured, featured_sort_order, locked_until, created_at, updated_at,
              product_images (*)
            )
          `)
          .eq('buyer_id', user!.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setRentals(data as unknown as RentalBookingWithDetails[]);
        }
      } catch (err) {
        console.error('Error fetching rentals:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRentals();
  }, [user, supabase]);

  if (!user && !isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold text-neutral-900">Sign In to Track Your Rentals</h2>
        <Link
          href="/login?redirect=/rentals"
          className="inline-block mt-4 px-8 py-3 rounded-full bg-neutral-950 text-white font-bold text-xs"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return { label: 'Delivered • Enjoy Your Event', color: 'bg-emerald-100 text-emerald-800' };
      case 'out_for_delivery':
        return { label: 'Out for Delivery Today', color: 'bg-blue-100 text-blue-800' };
      case 'preparing':
      case 'ready_for_pickup':
        return { label: 'Sanitizing & Preparing', color: 'bg-amber-100 text-amber-800' };
      case 'return_initiated':
        return { label: 'Return Scheduled', color: 'bg-purple-100 text-purple-800' };
      case 'returned':
      case 'completed':
        return { label: 'Returned & Completed', color: 'bg-neutral-100 text-neutral-800' };
      case 'cancelled':
        return { label: 'Booking Cancelled', color: 'bg-rose-100 text-rose-800' };
      default:
        return { label: 'Booking Confirmed', color: 'bg-emerald-50 text-emerald-700' };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="pb-6 border-b border-neutral-100 mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-neutral-900">My Rental Bookings</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Track sanitation status, delivery timelines, and return pickup schedules
          </p>
        </div>
        <Link
          href="/products?type=rent"
          className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full hover:bg-emerald-100 transition-colors"
        >
          Browse Rentals →
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-44 bg-neutral-50 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : rentals.length === 0 ? (
        <div className="text-center py-20 bg-neutral-50 rounded-3xl border border-neutral-100 p-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-white shadow-xs border border-neutral-200 flex items-center justify-center text-neutral-400 mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="font-semibold text-lg text-neutral-900">No Active Rentals</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            You don&apos;t have any rental bookings yet. Explore our wedding and gala collections to reserve an outfit.
          </p>
          <Link
            href="/products?type=rent"
            className="inline-block mt-6 px-8 py-3 rounded-full bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-colors shadow-md"
          >
            Explore Designer Rentals
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {rentals.map((booking) => {
            const product = booking.product;
            const images = product?.product_images || [];
            const imgUrl = images[0]?.image_url || '/placeholder-dress.jpg';
            const badge = getStatusBadge(booking.fulfillment_status || booking.status);

            return (
              <div
                key={booking.id}
                className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-2xs hover:shadow-md transition-shadow grid grid-cols-1 md:grid-cols-12 gap-6 items-center"
              >
                {/* Image */}
                <div className="md:col-span-2 relative aspect-3/4 rounded-2xl overflow-hidden bg-neutral-100">
                  <Image
                    src={imgUrl}
                    alt={product?.title || 'Rental Item'}
                    fill
                    className="object-cover object-top"
                  />
                </div>

                {/* Info */}
                <div className="md:col-span-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      #{booking.id.slice(0, 8)}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-neutral-900 text-base">
                    {product?.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-neutral-600">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {formatDate(booking.rental_start_date)} — {formatDate(booking.rental_end_date)} ({booking.rental_days} days)
                    </span>
                  </div>

                  {booking.selected_size && (
                    <span className="inline-block text-[11px] bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-md font-medium">
                      Size: {booking.selected_size}
                    </span>
                  )}
                </div>

                {/* Amount breakdown */}
                <div className="md:col-span-3 text-right space-y-1 text-xs">
                  <div>
                    <span className="text-neutral-400">Total Charged: </span>
                    <span className="font-bold text-neutral-950 text-base">
                      {formatCurrency(booking.total_charged)}
                    </span>
                  </div>
                  <div className="text-emerald-700 text-[11px]">
                    Deposit: {formatCurrency(booking.security_deposit)}{' '}
                    <span className="capitalize font-medium">({booking.deposit_refund_status.replace('_', ' ')})</span>
                  </div>
                  <div className="text-neutral-400 text-[10px]">
                    Payment: <span className="uppercase font-semibold text-neutral-700">{booking.payment_method}</span>
                  </div>
                </div>

                {/* Details link */}
                <div className="md:col-span-2 flex justify-end">
                  <Link
                    href={`/rentals/${booking.id}`}
                    className="py-2.5 px-5 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    View Details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
