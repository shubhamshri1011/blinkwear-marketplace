'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { ProductCard } from '@/components/product/ProductCard';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';

export default function WishlistPage() {
  const { user } = useAuth();
  const { wishlistItems, isLoading } = useWishlist();

  if (!user && !isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto text-rose-500 mb-4">
          <Heart className="w-8 h-8 fill-rose-500" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-neutral-900">Sign In to Save Your Wishlist</h2>
        <p className="text-sm text-neutral-500 mt-2 max-w-sm mx-auto">
          Save your favourite designer outfits and get notified when rental slots become available.
        </p>
        <Link
          href="/login?redirect=/wishlist"
          className="inline-block mt-6 px-8 py-3 rounded-full bg-neutral-950 text-white font-bold text-xs"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (wishlistItems.length === 0 && !isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400 mb-4">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-neutral-900">Your Wishlist is Empty</h2>
        <p className="text-sm text-neutral-500 mt-2 max-w-sm mx-auto">
          Tap the heart icon on any outfit while browsing to save it to your wishlist.
        </p>
        <Link
          href="/products"
          className="inline-block mt-6 px-8 py-3 rounded-full bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-colors shadow-md"
        >
          Browse Designer Outfits
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="pb-6 border-b border-neutral-100 mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-neutral-900">Saved Wishlist</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'outfit' : 'outfits'} saved for upcoming occasions
          </p>
        </div>
        <Link
          href="/products"
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
        >
          Explore More Outfits <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {wishlistItems.map((item) => (
          <ProductCard key={item.id} product={item.product} />
        ))}
      </div>
    </div>
  );
}
