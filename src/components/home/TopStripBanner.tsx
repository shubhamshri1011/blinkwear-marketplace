'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Banner } from '@/types/database';
import { resolveBannerHref } from '@/lib/bannerUtils';

interface TopStripBannerProps {
  banners: Banner[];
}

export function TopStripBanner({ banners }: TopStripBannerProps) {
  if (!banners || banners.length === 0) return null;

  // Use the top active banner
  const banner = banners[0];
  const href = resolveBannerHref(banner);

  return (
    <div className="w-full bg-neutral-900 border-b border-neutral-800 overflow-hidden">
      <Link
        href={href}
        className="block relative w-full h-10 sm:h-12 group focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
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
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:opacity-90 transition-opacity"
          />
        ) : banner.image_url ? (
          <Image
            src={banner.image_url}
            alt={banner.alt_text || banner.title || 'Special Announcement'}
            fill
            sizes="100vw"
            className="object-cover object-center group-hover:opacity-90 transition-opacity"
          />
        ) : null}
        {(banner.title || banner.subtitle) && (
          <div className="absolute inset-0 bg-neutral-950/60 flex items-center justify-center px-4 text-center">
            <span className="text-xs sm:text-sm font-semibold text-white tracking-wide truncate">
              {banner.title}
              {banner.subtitle && (
                <span className="hidden sm:inline font-normal text-neutral-300 ml-2">
                  — {banner.subtitle}
                </span>
              )}
            </span>
            {banner.cta_label && (
              <span className="ml-3 text-[11px] font-bold text-orange-400 group-hover:underline shrink-0">
                {banner.cta_label} →
              </span>
            )}
          </div>
        )}
      </Link>
    </div>
  );
}
