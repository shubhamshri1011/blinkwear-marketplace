'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/product/ProductCard';
import type { HomepageSectionWithProducts } from '@/types/database';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface DynamicSectionRendererProps {
  section: HomepageSectionWithProducts;
}

export function DynamicSectionRenderer({ section }: DynamicSectionRendererProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const offset = direction === 'left' ? -360 : 360;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const { title, subtitle, badge_text, section_type, products } = section;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          {badge_text && (
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block mb-1 border border-emerald-100">
              {badge_text}
            </span>
          )}
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {section_type === 'horizontal_scroll' && products.length > 3 && (
            <div className="hidden sm:flex items-center gap-1.5 mr-2">
              <button
                onClick={() => scroll('left')}
                aria-label="Scroll previous"
                className="w-8 h-8 rounded-full border border-neutral-200 hover:bg-neutral-100 text-neutral-700 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                aria-label="Scroll next"
                className="w-8 h-8 rounded-full border border-neutral-200 hover:bg-neutral-100 text-neutral-700 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <Link
            href="/products"
            className="text-xs sm:text-sm font-semibold text-neutral-900 hover:text-emerald-600 flex items-center gap-1 group whitespace-nowrap"
          >
            View More
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Render based on section_type */}
      {products.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
          <p className="text-sm text-neutral-500">Products are being added to this collection.</p>
        </div>
      ) : section_type === 'horizontal_scroll' ? (
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 scroll-smooth snap-x snap-mandatory scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="w-[240px] sm:w-[280px] shrink-0 snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ) : section_type === 'grid_2x2' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : section_type === 'featured_showcase' && products.length >= 3 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5">
            <ProductCard product={products[0]} priority />
          </div>
          <div className="lg:col-span-7 grid grid-cols-2 gap-4 sm:gap-6">
            {products.slice(1, 5).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
