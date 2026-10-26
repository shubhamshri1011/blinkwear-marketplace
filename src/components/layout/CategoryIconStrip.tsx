'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Category } from '@/types/database';
import { Sparkles, LayoutGrid } from 'lucide-react';

interface CategoryIconStripProps {
  categories: Category[];
}

export function CategoryIconStrip({ categories }: CategoryIconStripProps) {
  if (!categories || categories.length === 0) {
    return null;
  }

  // Filter categories that are active and have show_in_strip !== false
  const stripCategories = categories.filter(
    (c) => c.is_active && c.show_in_strip !== false
  );

  if (stripCategories.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-white border-b border-neutral-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 sm:gap-7 overflow-x-auto py-2.5 scrollbar-none text-center">
          {stripCategories.map((cat) => {
            const catHref =
              (cat as unknown as { href?: string }).href ||
              (cat.slug === 'all' ? '/products' : `/category/${cat.slug}`);

            return (
              <Link
                key={cat.id}
                href={catHref}
                className="flex flex-col items-center shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-lg p-1 transition-transform hover:-translate-y-0.5"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-neutral-50 border border-neutral-200/80 flex items-center justify-center overflow-hidden transition-all duration-200 group-hover:border-orange-500 group-hover:shadow-sm">
                  {cat.icon_url ? (
                    <Image
                      src={cat.icon_url}
                      alt={cat.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      sizes="56px"
                    />
                  ) : (
                    <Sparkles className="w-5 h-5 text-neutral-400 group-hover:text-orange-500 transition-colors" />
                  )}
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-neutral-700 mt-1.5 group-hover:text-neutral-950 transition-colors whitespace-nowrap">
                  {cat.name}
                </span>
              </Link>
            );
          })}

          <Link
            href="/categories"
            className="flex flex-col items-center shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-lg p-1 transition-transform hover:-translate-y-0.5"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-orange-50 border border-orange-200/80 flex items-center justify-center overflow-hidden transition-all duration-200 group-hover:border-orange-500 group-hover:bg-orange-100 group-hover:shadow-sm">
              <LayoutGrid className="w-5 h-5 text-orange-600 transition-colors" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-orange-700 mt-1.5 group-hover:text-orange-900 transition-colors whitespace-nowrap">
              All Categories
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
