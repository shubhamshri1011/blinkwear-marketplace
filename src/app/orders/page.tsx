'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { OrderWithItems } from '@/types/database';
import {
  Package,
  ArrowRight,
  ShoppingBag,
  Clock,
  CheckCircle,
} from 'lucide-react';

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    async function fetchOrders() {
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
          .eq('buyer_id', user!.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setOrders(data as unknown as OrderWithItems[]);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, [user, supabase]);

  if (!user && !isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold text-neutral-900">Sign In to Track Your Orders</h2>
        <Link
          href="/login?redirect=/orders"
          className="inline-block mt-4 px-8 py-3 rounded-full bg-neutral-950 text-white font-bold text-xs"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="pb-6 border-b border-neutral-100 mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-neutral-900">My Purchase Orders</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Track status, delivery dispatches, and order receipts
          </p>
        </div>
        <Link
          href="/products?type=sale"
          className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-neutral-800 bg-neutral-100 px-4 py-2 rounded-full hover:bg-neutral-200 transition-colors"
        >
          Browse Pre-Loved →
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-40 bg-neutral-50 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-neutral-50 rounded-3xl border border-neutral-100 p-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-white shadow-xs border border-neutral-200 flex items-center justify-center text-neutral-400 mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="font-semibold text-lg text-neutral-900">No Orders Placed Yet</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            You haven&apos;t purchased any pre-loved designer outfits yet.
          </p>
          <Link
            href="/products?type=sale"
            className="inline-block mt-6 px-8 py-3 rounded-full bg-neutral-950 text-white font-bold text-xs hover:bg-neutral-800 transition-colors shadow-md"
          >
            Shop Pre-Loved Collection
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-2xs space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-100 text-xs">
                <div>
                  <span className="font-mono font-bold text-neutral-900">
                    Order #{order.id.slice(0, 8)}
                  </span>
                  <span className="text-neutral-400 ml-2">
                    Placed on {formatDate(order.created_at)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-neutral-500">
                    Payment: <strong className="uppercase text-neutral-900">{order.payment_method}</strong> ({order.payment_status})
                  </span>
                  <span className="font-bold text-neutral-950 text-sm">
                    {formatCurrency(order.order_total)}
                  </span>
                </div>
              </div>

              {/* Items in this order */}
              <div className="space-y-3">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-semibold text-neutral-900 text-sm">
                        {item.product_title}
                      </h4>
                      <p className="text-neutral-500">
                        Qty: {item.quantity} {item.selected_size ? `• Size: ${item.selected_size}` : ''}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-neutral-900">
                        {formatCurrency(item.line_total)}
                      </span>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                        {item.item_status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end">
                <Link
                  href={`/orders/${order.id}`}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  View Order Details <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
