'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Category, HomepageBlock } from '@/types/database';
import { Sparkles, ArrowRight } from 'lucide-react';

interface CategoryTilesBlockProps {
  block: HomepageBlock;
  categories: Category[];
}

export function CategoryTilesBlock({ block, categories }: CategoryTilesBlockProps) {
  if (!categories || categories.length === 0) return null;

  // Filter active categories
  const activeCategories = categories
    .filter((c) => c.is_active && c.show_in_strip !== false)
    .slice(0, block.item_limit || 6);

  if (activeCategories.length === 0) return null;

  return (
    <section aria-label={block.title} className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6 sm:my-8">
      <div className="flex items-end justify-between border-b border-neutral-100 pb-3">
        <div>
          <h2 className="font-serif text-lg sm:text-2xl font-bold text-neutral-950 tracking-tight">
            {block.title}
          </h2>
          {block.subtitle && (
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">{block.subtitle}</p>
          )}
        </div>
        {block.view_all_href && (
          <Link
            href={block.view_all_href}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 hover:underline"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {activeCategories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="group block relative rounded-2xl border border-neutral-200/80 bg-white p-3 hover:shadow-md hover:border-neutral-300 transition-all text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <div className="relative aspect-square w-full rounded-xl bg-neutral-50 overflow-hidden mb-2">
              {cat.icon_url ? (
                <Image
                  src={cat.icon_url}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-neutral-400 group-hover:text-orange-500 transition-colors" />
                </div>
              )}
            </div>
            <h3 className="text-xs sm:text-sm font-semibold text-neutral-900 group-hover:text-orange-600 transition-colors truncate">
              {cat.name}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
