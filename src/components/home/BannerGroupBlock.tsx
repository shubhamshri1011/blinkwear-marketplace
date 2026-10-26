'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Banner, HomepageBlock } from '@/types/database';
import { resolveBannerHref } from '@/lib/bannerUtils';
import { ArrowRight } from 'lucide-react';

interface BannerGroupBlockProps {
  block: HomepageBlock;
  banners: Banner[];
}

export function BannerGroupBlock({ block, banners }: BannerGroupBlockProps) {
  if (!banners || banners.length === 0) return null;

  // Filter banners either by block.banner_ids if specified or take up to item_limit
  const displayBanners = block.banner_ids && block.banner_ids.length > 0
    ? banners.filter((b) => block.banner_ids.includes(b.id))
    : banners.slice(0, block.item_limit || 3);

  if (displayBanners.length === 0) return null;

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

      <div className={`mt-4 grid gap-3 sm:gap-4 ${
        displayBanners.length === 1
          ? 'grid-cols-1'
          : displayBanners.length === 2
          ? 'grid-cols-1 sm:grid-cols-2'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      }`}>
        {displayBanners.map((banner) => {
          const href = resolveBannerHref(banner);
          return (
            <Link
              key={banner.id}
              href={href}
              className="group relative block aspect-[2/1] rounded-2xl overflow-hidden border border-neutral-200/80 bg-neutral-950 shadow-2xs hover:shadow-md transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <Image
                src={banner.image_url}
                alt={banner.alt_text || banner.title || 'Collection Banner'}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-end p-4 text-white">
                {banner.title && (
                  <h3 className="font-serif text-sm sm:text-base font-bold leading-tight drop-shadow-sm">
                    {banner.title}
                  </h3>
                )}
                {banner.subtitle && (
                  <p className="text-xs text-neutral-200 line-clamp-1 mt-0.5">
                    {banner.subtitle}
                  </p>
                )}
                {banner.cta_label && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-400 group-hover:text-orange-300 mt-2">
                    {banner.cta_label} →
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
