'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Banner } from '@/types/database';
import { resolveBannerHref } from '@/lib/bannerUtils';

interface MidTilesBannerProps {
  banners: Banner[];
}

export function MidTilesBanner({ banners }: MidTilesBannerProps) {
  if (!banners || banners.length === 0) return null;

  return (
    <section aria-label="Featured Promotions" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6 sm:my-8">
      <div className={`grid gap-3 sm:gap-4 ${
        banners.length === 1
          ? 'grid-cols-1'
          : banners.length === 2
          ? 'grid-cols-1 sm:grid-cols-2'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      }`}>
        {banners.map((banner) => {
          const href = resolveBannerHref(banner);
          return (
            <Link
              key={banner.id}
              href={href}
              className="group relative block aspect-[2/1] sm:aspect-[2.4/1] rounded-2xl overflow-hidden border border-neutral-200/80 bg-neutral-900 shadow-2xs hover:shadow-md transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              {banner.media_type === 'video' || banner.video_url ? (
                <video
                  src={banner.video_url || undefined}
                  poster={banner.image_url || undefined}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <Image
                  src={banner.image_url}
                  alt={banner.alt_text || banner.title || 'Promotional Tile'}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-end p-4 sm:p-5 text-white">
                {banner.title && (
                  <h3 className="font-serif text-base sm:text-lg font-bold leading-tight drop-shadow-sm">
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
