'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { OrderWithItems } from '@/types/database';
import {
  Package,
  CheckCircle,
  Truck,
  ArrowLeft,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    async function fetchOrder() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              product:products (
                *,
                product_images (*)
              )
            )
          `)
          .eq('id', id)
          .eq('buyer_id', user!.id)
          .single();

        if (!error && data) {
          setOrder(data as unknown as OrderWithItems);
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrder();
  }, [id, user, supabase]);

  if (isLoading) {
    return <div className="max-w-4xl mx-auto py-20 text-center animate-pulse">Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <h2 className="text-xl font-bold text-neutral-900">Order Not Found</h2>
        <Link href="/orders" className="inline-block mt-4 text-xs font-bold text-emerald-600 underline">
          Back to My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to All Orders
      </Link>

      <div className="pb-6 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-800 bg-neutral-100 px-2.5 py-0.5 rounded-full">
            Order #{order.id.slice(0, 8)}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 mt-1">
            Order Receipt & Tracking
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Placed on {formatDate(order.created_at)} • Payment via {order.payment_method.toUpperCase()} ({order.payment_status})
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-neutral-400">Total Paid</span>
          <p className="text-2xl font-extrabold text-neutral-950">
            {formatCurrency(order.order_total)}
          </p>
        </div>
      </div>

      {/* Items List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-2xs space-y-6">
        <h3 className="font-semibold text-sm text-neutral-900">Purchased Items</h3>

        <div className="space-y-6 divide-y divide-neutral-100">
          {order.order_items?.map((item) => (
            <div key={item.id} className="pt-6 first:pt-0 flex gap-4 items-start">
              <div className="relative w-20 aspect-3/4 rounded-2xl overflow-hidden bg-neutral-100 shrink-0">
                <Image
                  src={item.product?.product_images?.[0]?.image_url || '/placeholder-dress.jpg'}
                  alt={item.product_title}
                  fill
                  className="object-cover object-top"
                />
              </div>

              <div className="space-y-1 flex-1 text-xs">
                <h4 className="font-bold text-neutral-900 text-sm">{item.product_title}</h4>
                <p className="text-neutral-500">
                  Quantity: {item.quantity} {item.selected_size ? `• Size: ${item.selected_size}` : ''}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full">
                    Status: {item.item_status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="text-right text-xs">
                <span className="font-bold text-neutral-950 text-sm">
                  {formatCurrency(item.line_total)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
