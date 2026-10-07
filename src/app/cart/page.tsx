'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ShoppingBag,
  Trash2,
  Calendar,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  MapPin,
} from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cartItems, removeFromCart, updateQuantity, isLoading } = useCart();

  if (!user && !isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400 mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-neutral-900">Your Bag is Empty</h2>
        <p className="text-sm text-neutral-500 mt-2 max-w-sm mx-auto">
          Please sign in to view items in your bag and reserve designer outfits.
        </p>
        <Link
          href="/login?redirect=/cart"
          className="inline-block mt-6 px-8 py-3 rounded-full bg-neutral-950 text-white font-bold text-xs"
        >
          Sign In to View Bag
        </Link>
      </div>
    );
  }

  const rentalItems = cartItems.filter((i) => i.purchase_type === 'rent');
  const buyItems = cartItems.filter((i) => i.purchase_type === 'buy');

  if (cartItems.length === 0 && !isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400 mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-neutral-900">Your Bag is Empty</h2>
        <p className="text-sm text-neutral-500 mt-2 max-w-sm mx-auto">
          Explore our collection of designer bridal wear, sherwanis, and luxury gowns for rent.
        </p>
        <Link
          href="/products"
          className="inline-block mt-6 px-8 py-3 rounded-full bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-colors shadow-md"
        >
          Explore Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="pb-6 border-b border-neutral-100 mb-8">
        <h1 className="font-serif text-3xl font-bold text-neutral-900">Shopping Bag</h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Review your selected rentals and purchases before proceeding to secure Cashfree checkout.
        </p>
      </div>

      <div className="space-y-12">
        {/* RENTAL ITEMS SECTION */}
        {rentalItems.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                Rental Outfits ({rentalItems.length})
              </span>
              <span className="text-xs text-neutral-400">
                • Hospital-grade dry cleaned & doorstep return included
              </span>
            </div>

            <div className="space-y-4">
              {rentalItems.map((item) => {
                const product = item.product;
                const images = product?.product_images || [];
                const imgUrl = images[0]?.image_url || '/placeholder-dress.jpg';
                const days = item.rental_days || 3;
                const dailyRate = product?.rent_price_per_day || 0;
                const rentalAmount = dailyRate * days;
                const deposit = product?.security_deposit || Math.round(rentalAmount * 0.2);

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-2xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center"
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

                    {/* Details */}
                    <div className="md:col-span-5 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        {product?.brand || 'Designer Rental'}
                      </span>
                      <Link
                        href={`/products/${item.product_id}`}
                        className="block font-serif font-bold text-neutral-900 text-base hover:text-emerald-700 transition-colors"
                      >
                        {product?.title}
                      </Link>

                      <div className="flex flex-wrap gap-2 text-xs text-neutral-500 pt-1">
                        {item.selected_size && (
                          <span className="bg-neutral-100 px-2 py-0.5 rounded-md font-medium text-neutral-700">
                            Size: {item.selected_size}
                          </span>
                        )}
                        {product?.city && (
                          <span className="bg-neutral-100 px-2 py-0.5 rounded-md font-medium text-neutral-700 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-600" /> {product.city}
                          </span>
                        )}
                      </div>

                      {/* Rental Dates Notice */}
                      {item.rental_start_date && item.rental_end_date && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 mt-2">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            {formatDate(item.rental_start_date)} — {formatDate(item.rental_end_date)} ({days} days)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Pricing breakdown */}
                    <div className="md:col-span-3 text-right space-y-1 text-xs">
                      <div>
                        <span className="text-neutral-400">Rental Rate: </span>
                        <span className="font-bold text-neutral-950 text-sm">
                          {formatCurrency(rentalAmount)}
                        </span>
                        <span className="text-[10px] text-neutral-400 block">
                          ({formatCurrency(dailyRate)}/day × {days} days)
                        </span>
                      </div>
                      <div className="text-emerald-700 text-[11px]">
                        Deposit: {formatCurrency(deposit)} (100% Refundable)
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-2 flex flex-col items-end gap-3">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-neutral-400 hover:text-rose-600 p-2 rounded-full hover:bg-neutral-50 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => router.push(`/checkout?cart_item_id=${item.id}&type=rental`)}
                        className="w-full py-2.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1"
                      >
                        Checkout Rental <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BUY ITEMS SECTION */}
        {buyItems.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider bg-neutral-900 text-white px-3 py-1 rounded-full">
                Pre-Loved Outfits to Purchase ({buyItems.length})
              </span>

              <button
                onClick={() => router.push('/checkout?type=buy')}
                className="py-2.5 px-6 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
              >
                Checkout All Purchases <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {buyItems.map((item) => {
                const product = item.product;
                const images = product?.product_images || [];
                const imgUrl = images[0]?.image_url || '/placeholder-dress.jpg';
                const unitPrice = product?.discount_price || product?.sale_price || 0;
                const total = unitPrice * item.quantity;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-2xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center"
                  >
                    <div className="md:col-span-2 relative aspect-3/4 rounded-2xl overflow-hidden bg-neutral-100">
                      <Image
                        src={imgUrl}
                        alt={product?.title || 'Purchase Item'}
                        fill
                        className="object-cover object-top"
                      />
                    </div>

                    <div className="md:col-span-5 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        {product?.brand || 'Designer Pre-Loved'}
                      </span>
                      <Link
                        href={`/products/${item.product_id}`}
                        className="block font-serif font-bold text-neutral-900 text-base hover:text-emerald-700 transition-colors"
                      >
                        {product?.title}
                      </Link>

                      <div className="flex flex-wrap gap-2 text-xs text-neutral-500 pt-1">
                        {item.selected_size && (
                          <span className="bg-neutral-100 px-2 py-0.5 rounded-md font-medium text-neutral-700">
                            Size: {item.selected_size}
                          </span>
                        )}
                        <span className="bg-neutral-100 px-2 py-0.5 rounded-md font-medium text-neutral-700 capitalize">
                          Condition: {product?.condition?.replace('_', ' ') || 'Pristine'}
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-3 flex items-center justify-end gap-4">
                      {/* Quantity controls */}
                      <div className="flex items-center border border-neutral-200 rounded-full px-3 py-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="text-neutral-500 hover:text-neutral-900 text-sm px-1.5 font-bold"
                        >
                          -
                        </button>
                        <span className="px-3 text-xs font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="text-neutral-500 hover:text-neutral-900 text-sm px-1.5 font-bold"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-neutral-950 text-base">
                          {formatCurrency(total)}
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-2 flex items-center justify-end">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-neutral-400 hover:text-rose-600 p-2 rounded-full hover:bg-neutral-50 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
