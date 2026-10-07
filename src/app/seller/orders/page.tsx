'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { OrderItem } from '@/types/database';
import { Package, ArrowLeft } from 'lucide-react';

export default function SellerOrdersPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrderItems = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setItems(data as OrderItem[]);
      }
    } catch (err) {
      console.error('Error fetching seller orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderItems();
  }, [user]);

  const handleAdvance = async (itemId: string, nextStatus: string) => {
    try {
      const { error } = await supabase.rpc('advance_order_item_status', {
        p_order_item_id: itemId,
        p_new_status: nextStatus,
      });

      if (error) throw error;
      await fetchOrderItems();
    } catch (err) {
      alert('Error updating status: ' + (err as Error).message);
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
        <h1 className="font-serif text-3xl font-bold text-neutral-900">Incoming Buy Orders</h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Fulfill pre-loved wardrobe purchase orders
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-28 bg-neutral-50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-neutral-50 rounded-3xl border border-neutral-100 p-8">
          <Package className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
          <h3 className="font-semibold text-base text-neutral-900">No Purchase Orders Yet</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            When buyers purchase your pre-loved outfits, their order items will appear here for shipping.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full">
                  Status: {item.item_status}
                </span>
                <h4 className="font-bold text-neutral-900 text-sm mt-1">{item.product_title}</h4>
                <p className="text-xs text-neutral-500">
                  Qty: {item.quantity} • Unit Price: {formatCurrency(item.unit_price)} • Ordered: {formatDate(item.created_at)}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-bold text-neutral-950 text-base">
                  {formatCurrency(item.line_total)}
                </span>

                {item.item_status === 'pending' && (
                  <button
                    onClick={() => handleAdvance(item.id, 'accepted')}
                    className="py-2 px-4 rounded-full bg-emerald-600 text-white font-bold text-xs"
                  >
                    Accept Order
                  </button>
                )}

                {item.item_status === 'accepted' && (
                  <button
                    onClick={() => handleAdvance(item.id, 'preparing')}
                    className="py-2 px-4 rounded-full bg-neutral-950 text-white font-bold text-xs"
                  >
                    Mark Packed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
