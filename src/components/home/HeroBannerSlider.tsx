'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Banner } from '@/types/database';
import { resolveBannerHref } from '@/lib/bannerUtils';
import { ChevronLeft, ChevronRight, Sparkles, Store } from 'lucide-react';

interface HeroBannerSliderProps {
  banners: Banner[];
}

export function HeroBannerSlider({ banners }: HeroBannerSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const total = banners.length;

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Autoplay with prefers-reduced-motion check & pause on hover/focus
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    // Respect user's motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [total, isPaused, nextSlide]);

  // Swipe handling for touch devices
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Fallback when no hero banners exist
  if (!banners || banners.length === 0) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white pt-10 pb-16 sm:pt-16 sm:pb-24">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-500/10 blur-[140px] pointer-events-none rounded-full" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-orange-400 text-xs font-semibold uppercase tracking-wider mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Pune &amp; Bhopal Premier Fashion Rental Hub
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            Own the Moment. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-200 to-orange-200">
              Rent the Outfit.
            </span>
          </h1>
          <p className="text-neutral-300 text-sm sm:text-base mt-4 max-w-xl mx-auto leading-relaxed">
            Rent authentic bridal lehengas, royal sherwanis, and luxury designer couture at 10% of retail price. 100% sanitized, delivered to your door in Pune &amp; Bhopal.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-6">
            <Link
              href="/products?type=rent"
              className="px-6 py-3 rounded-full bg-orange-600 text-white font-bold text-sm hover:bg-orange-500 hover:shadow-lg hover:shadow-orange-600/25 transition-all transform hover:-translate-y-0.5"
            >
              Explore Rentals
            </Link>
            <Link
              href="/products?type=sale"
              className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium text-sm border border-white/20 backdrop-blur-sm transition-all"
            >
              Shop Pre-Loved
            </Link>
            <Link
              href="/become-a-seller"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300 px-3 py-2"
            >
              <Store className="w-4 h-4" />
              List Closet &amp; Earn →
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const currentBanner = banners[currentIndex];
  const targetHref = resolveBannerHref(currentBanner);
  const ctaLabel = currentBanner.cta_label || 'Explore Now';

  return (
    <section
      aria-label="Promotional Banners Carousel"
      className="relative w-full bg-neutral-950 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Fixed aspect ratio container: 16:9 on mobile (1280x720), 3.2:1 on desktop (1920x600) */}
      <div className="relative w-full aspect-[16/9] md:aspect-[3.2/1]">
        {banners.map((banner, index) => {
          const isActive = index === currentIndex;
          const href = resolveBannerHref(banner);

          return (
            <div
              key={banner.id}
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <Link
                href={href}
                tabIndex={isActive ? 0 : -1}
                className="block relative w-full h-full focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-500"
              >
                {/* Banner Media: Video or Photo */}
                {banner.media_type === 'video' || banner.video_url ? (
                  <>
                    {/* Mobile Art Direction Video (16:9, rendered < 768px) */}
                    <div className="block md:hidden relative w-full h-full overflow-hidden">
                      <video
                        src={banner.mobile_video_url || banner.video_url || undefined}
                        poster={banner.mobile_image_url || banner.image_url || undefined}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload={index === 0 ? 'auto' : 'metadata'}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>

                    {/* Desktop Art Direction Video (3.2:1, rendered >= 768px) */}
                    <div className="hidden md:block relative w-full h-full overflow-hidden">
                      <video
                        src={banner.video_url || undefined}
                        poster={banner.image_url || undefined}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload={index === 0 ? 'auto' : 'metadata'}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Mobile Art Direction Image (16:9, rendered < 768px) */}
                    <div className="block md:hidden relative w-full h-full">
                      <Image
                        src={banner.mobile_image_url || banner.image_url}
                        alt={banner.alt_text || banner.title || 'BlinkWear Promotional Banner'}
                        fill
                        priority={index === 0}
                        loading={index === 0 ? 'eager' : 'lazy'}
                        sizes="(max-width: 768px) 100vw, 1280px"
                        className="object-cover object-center"
                      />
                    </div>

                    {/* Desktop Art Direction Image (3.2:1, rendered >= 768px) */}
                    <div className="hidden md:block relative w-full h-full">
                      <Image
                        src={banner.image_url}
                        alt={banner.alt_text || banner.title || 'BlinkWear Promotional Banner'}
                        fill
                        priority={index === 0}
                        loading={index === 0 ? 'eager' : 'lazy'}
                        sizes="100vw"
                        className="object-cover object-center"
                      />
                    </div>
                  </>
                )}

                {/* Subtle dark gradient overlay for text readability */}
                {(banner.title || banner.subtitle) && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end">
                    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 text-white">
                      <div className="max-w-xl">
                        {banner.title && (
                          <h2 className="font-serif text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-md">
                            {banner.title}
                          </h2>
                        )}
                        {banner.subtitle && (
                          <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-neutral-200 line-clamp-2 drop-shadow-sm">
                            {banner.subtitle}
                          </p>
                        )}
                        <span className="inline-flex items-center gap-1.5 mt-3 sm:mt-4 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full bg-orange-600 text-white font-bold text-xs sm:text-sm hover:bg-orange-500 shadow-md">
                          {ctaLabel} →
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </Link>
            </div>
          );
        })}

        {/* Carousel Prev / Next Arrow Controls */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous banner slide"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next banner slide"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}

        {/* Dot Indicators */}
        {total > 1 && (
          <div
            role="tablist"
            aria-label="Slide indicators"
            className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-xs"
          >
            {banners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={idx === currentIndex}
                aria-label={`Go to slide ${idx + 1}`}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentIndex
                    ? 'w-6 sm:w-8 h-1.5 sm:h-2 bg-orange-500'
                    : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/60 hover:bg-white'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
