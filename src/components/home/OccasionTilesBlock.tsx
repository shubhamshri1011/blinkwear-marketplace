'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { HomepageBlock } from '@/types/database';
import { ArrowRight, Sparkles } from 'lucide-react';

interface OccasionTilesBlockProps {
  block: HomepageBlock;
}

export function OccasionTilesBlock({ block }: OccasionTilesBlockProps) {
  const tiles = block.custom_tiles;
  if (!tiles || tiles.length === 0) return null;

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

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {tiles.map((tile, idx) => (
          <Link
            key={idx}
            href={tile.href || '/products'}
            className="group relative block aspect-[4/5] rounded-2xl overflow-hidden border border-neutral-200/80 bg-neutral-900 shadow-2xs hover:shadow-lg transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            {tile.image_url ? (
              <Image
                src={tile.image_url}
                alt={tile.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950">
                <Sparkles className="w-8 h-8 text-orange-400 opacity-60" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-4 text-white">
              <h3 className="font-serif text-sm sm:text-base font-bold leading-tight drop-shadow-sm">
                {tile.title}
              </h3>
              {tile.subtitle && (
                <p className="text-[11px] sm:text-xs text-neutral-200 mt-0.5 line-clamp-1">
                  {tile.subtitle}
                </p>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-400 group-hover:text-orange-300 mt-2">
                Explore Outfits →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
