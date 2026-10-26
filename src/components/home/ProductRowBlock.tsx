'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import type { HomepageBlock, ProductWithImages } from '@/types/database';
import { ProductCard } from '@/components/product/ProductCard';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';

interface ProductRowBlockProps {
  block: HomepageBlock;
  products: ProductWithImages[];
  selectedCity: string;
}

export function ProductRowBlock({ block, products, selectedCity }: ProductRowBlockProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const offset = direction === 'left' ? -320 : 320;
    scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  // If no products available for this city, display the "More styles arriving soon" card
  if (!products || products.length === 0) {
    return (
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6 sm:my-8">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h2 className="font-serif text-lg sm:text-2xl font-bold text-neutral-950 tracking-tight">
              {block.title}
            </h2>
            {block.subtitle && (
              <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">{block.subtitle}</p>
            )}
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/50 p-8 text-center">
          <Sparkles className="w-8 h-8 text-orange-400 mx-auto mb-2 opacity-80" />
          <p className="text-sm font-semibold text-neutral-800">
            More styles arriving soon in {selectedCity}
          </p>
          <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
            Our curators are onboarding new verified designer collections daily for doorstep delivery in {selectedCity}.
          </p>
          <Link
            href="/products?type=rent"
            className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold text-orange-600 hover:text-orange-700 underline underline-offset-4"
          >
            Explore all available collections →
          </Link>
        </div>
      </section>
    );
  }

  const viewAllLink = block.view_all_href || '/products';

  return (
    <section
      aria-label={block.title}
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6 sm:my-8"
    >
      {/* Section Header */}
      <div className="flex items-end justify-between border-b border-neutral-100 pb-3">
        <div>
          <h2 className="font-serif text-lg sm:text-2xl font-bold text-neutral-950 tracking-tight">
            {block.title}
          </h2>
          {block.subtitle && (
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">{block.subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {viewAllLink && (
            <Link
              href={viewAllLink}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 hover:underline shrink-0 mr-2"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          {/* Desktop Scroll Controls */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="p-1.5 rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="p-1.5 rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Product Rail: Dense horizontal scroll */}
      <div
        ref={scrollContainerRef}
        className="mt-4 flex gap-3 sm:gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory"
      >
        {products.map((product, idx) => (
          <div
            key={product.id}
            className="w-[160px] sm:w-[220px] md:w-[240px] shrink-0 snap-start"
          >
            <ProductCard product={product} priority={idx < 4} />
          </div>
        ))}
      </div>
    </section>
  );
}
