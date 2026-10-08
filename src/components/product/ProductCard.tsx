'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, MapPin, Sparkles } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { formatCurrency } from '@/lib/utils';
import type { ProductWithImages } from '@/types/database';

interface ProductCardProps {
  product: ProductWithImages;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  if (!product || !product.id) return null;
  const wishlisted = isInWishlist(product.id);

  const images = product.product_images && product.product_images.length > 0
    ? product.product_images.sort((a, b) => a.sort_order - b.sort_order)
    : [];

  const mainImageUrl = images[0]?.image_url || '/placeholder-dress.jpg';
  const secondaryImageUrl = images[1]?.image_url || mainImageUrl;

  const isRental = product.listing_type === 'rent' || product.listing_type === 'both';
  const isSale = product.listing_type === 'sale' || product.listing_type === 'both';

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(product.id);
  };

  const [imgSrc, setImgSrc] = React.useState(mainImageUrl);

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-neutral-100 overflow-hidden hover:shadow-xl hover:border-neutral-200 transition-all duration-300">
      {/* Image Container with 3:4 Aspect Ratio */}
      <Link href={`/products/${product.id}`} className="relative aspect-3/4 w-full bg-neutral-100 overflow-hidden block">
        <Image
          src={imgSrc}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
          priority={priority}
          onError={() => setImgSrc('/placeholder-dress.jpg')}
        />

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlistClick}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-200 z-10 ${
            wishlisted
              ? 'bg-rose-50 text-rose-600 shadow-md'
              : 'bg-white/80 text-neutral-600 hover:bg-white hover:text-neutral-900 shadow-xs'
          }`}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-rose-600' : ''}`} />
        </button>

        {/* Badges on top left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.featured && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-xs">
              <Sparkles className="w-3 h-3" /> Featured
            </span>
          )}

          {isRental && (
            <span className="inline-block text-[10px] font-bold tracking-wider uppercase bg-neutral-900/90 text-emerald-400 px-2 py-0.5 rounded-full backdrop-blur-xs">
              For Rent
            </span>
          )}

          {isSale && !isRental && (
            <span className="inline-block text-[10px] font-bold tracking-wider uppercase bg-neutral-900/90 text-white px-2 py-0.5 rounded-full backdrop-blur-xs">
              Buy Now
            </span>
          )}
        </div>

        {/* City tag on bottom right */}
        {product.city && (
          <div className="absolute bottom-3 right-3 z-10 bg-neutral-950/70 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-400" />
            {product.city}
          </div>
        )}

        {/* Quick view size chips on bottom hover */}
        {product.size && (
          <div className="absolute bottom-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="text-[10px] font-semibold bg-white/90 backdrop-blur-xs text-neutral-800 px-2 py-0.5 rounded-md shadow-xs">
              Size: {product.size}
            </span>
          </div>
        )}
      </Link>

      {/* Details info */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between gap-2 min-w-0">
        <div>
          {/* Brand or Category */}
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1 gap-1">
            <span className="font-semibold uppercase tracking-wider truncate">
              {product.brand || product.category?.name || 'Designer'}
            </span>
            {product.condition && (
              <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-sm capitalize shrink-0">
                {product.condition.replace('_', ' ')}
              </span>
            )}
          </div>

          {/* Title */}
          <Link href={`/products/${product.id}`} className="group-hover:text-emerald-700 transition-colors block">
            <h3 className="font-medium text-neutral-900 text-xs sm:text-sm line-clamp-1 leading-snug">
              {product.title}
            </h3>
          </Link>
        </div>

        {/* Pricing area */}
        <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-baseline justify-between gap-1">
          {isRental && product.rent_price_per_day ? (
            <div className="min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="text-sm sm:text-base font-bold text-neutral-950">
                  {formatCurrency(product.rent_price_per_day)}
                </span>
                <span className="text-[10px] sm:text-[11px] text-neutral-500 font-medium">/ day</span>
              </div>
              {product.security_deposit ? (
                <p className="text-[10px] text-neutral-400 truncate max-w-full">
                  Deposit: {formatCurrency(product.security_deposit)}
                </p>
              ) : null}
            </div>
          ) : isSale && product.sale_price ? (
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-bold text-neutral-950">
                {formatCurrency(product.discount_price || product.sale_price)}
              </span>
              {product.discount_price && product.sale_price > product.discount_price && (
                <span className="text-xs text-neutral-400 line-through">
                  {formatCurrency(product.sale_price)}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs font-semibold text-neutral-600">Available on request</span>
          )}

          <Link
            href={`/products/${product.id}`}
            className="text-xs font-semibold text-neutral-900 group-hover:text-emerald-600 hover:underline transition-colors shrink-0"
          >
            {isRental ? 'Rent' : 'Buy'} →
          </Link>
        </div>
      </div>
    </div>
  );
}
