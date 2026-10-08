'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import type { ProductWithImages } from '@/types/database';
import { Plus, Edit, Package, Eye, ArrowLeft, Trash2 } from 'lucide-react';

export default function SellerProductsPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSellerProducts = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, seller_id, category_id, subcategory_id, title, description, brand,
          size, color, condition, listing_type, sale_price, discount_price,
          rent_price_per_day, security_deposit, delivery_charge, city, status,
          view_count, stock_quantity, min_rental_days, max_rental_days, search_tags,
          video_url, featured, featured_sort_order, locked_until, created_at, updated_at,
          product_images (id, image_url, sort_order)
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProducts(data as unknown as ProductWithImages[]);
      }
    } catch (err) {
      console.error('Error fetching seller products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerProducts();
  }, [user]);

  const handleToggleStatus = async (productId: string, currentStatus: string) => {
    // Only allow toggling between active and inactive — moderation statuses are admin-only
    if (!['active', 'inactive'].includes(currentStatus)) return;
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await supabase.from('products').update({ status: newStatus }).eq('id', productId);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: newStatus as any } : p))
      );
    } catch (err) {
      console.error('Error toggling product status:', err);
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
        <div>
          <h1 className="font-serif text-3xl font-bold text-neutral-900">Wardrobe Listings</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Manage your outfits, rental prices, deposits, and active availability
          </p>
        </div>

        <Link
          href="/seller/products/new"
          className="py-2.5 px-6 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" /> List New Outfit
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 bg-neutral-50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-neutral-50 rounded-3xl border border-neutral-100 p-8">
          <Package className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
          <h3 className="font-semibold text-base text-neutral-900">No Listings Yet</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            You haven&apos;t listed any outfits yet. Start earning by adding your bridal wear or party couture.
          </p>
          <Link
            href="/seller/products/new"
            className="inline-block mt-4 py-2.5 px-6 rounded-full bg-emerald-600 text-white font-bold text-xs"
          >
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => {
            const imgUrl = product.product_images?.[0]?.image_url || '/placeholder-dress.jpg';
            return (
              <div
                key={product.id}
                className="bg-white rounded-3xl p-5 border border-neutral-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-16 aspect-3/4 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                    <Image
                      src={imgUrl}
                      alt={product.title}
                      fill
                      className="object-cover object-top"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          product.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : product.status === 'pending_approval'
                            ? 'bg-amber-100 text-amber-800'
                            : product.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {product.status === 'pending_approval' ? 'Pending Review' : product.status}
                      </span>
                      <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                        Type: {product.listing_type}
                      </span>
                    </div>

                    <h4 className="font-semibold text-neutral-900 text-sm">{product.title}</h4>

                    <div className="flex items-center gap-3 text-xs text-neutral-500">
                      {product.rent_price_per_day && (
                        <span>Rent: {formatCurrency(product.rent_price_per_day)}/day</span>
                      )}
                      {product.sale_price && (
                        <span>Buy: {formatCurrency(product.sale_price)}</span>
                      )}
                      <span>City: {product.city}</span>
                    </div>

                    {product.status === 'pending_approval' && (
                      <p className="text-[10px] text-amber-700 mt-0.5">
                        Awaiting admin approval before it appears to buyers.
                      </p>
                    )}
                    {product.status === 'rejected' && (product as any).rejection_reason && (
                      <p className="text-[10px] text-rose-700 mt-0.5">
                        Rejected: {(product as any).rejection_reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                  <Link
                    href={`/seller/products/${product.id}/edit`}
                    className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
                    aria-label="Edit listing"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>

                  <Link
                    href={`/products/${product.id}`}
                    target="_blank"
                    className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
                    aria-label="View public page"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>

                  {['active', 'inactive'].includes(product.status) ? (
                    <button
                      onClick={() => handleToggleStatus(product.id, product.status)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border border-neutral-300 hover:bg-neutral-50 transition-colors"
                    >
                      {product.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  ) : (
                    <span className="text-[10px] font-semibold text-neutral-400 px-3 py-1.5">
                      {product.status === 'pending_approval' ? 'Under Review' : product.status === 'rejected' ? 'Rejected' : product.status}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
