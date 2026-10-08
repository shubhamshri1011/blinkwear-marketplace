'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Banner } from '@/types/database';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, Store } from 'lucide-react';

interface HeroBannerSliderProps {
  banners: Banner[];
}

export function HeroBannerSlider({ banners }: HeroBannerSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const total = banners.length;

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (total <= 1 || isPaused) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [total, isPaused, nextSlide]);

  const getTargetHref = (banner: Banner) => {
    if (!banner.target_type || banner.target_type === 'none') {
      return '/products?type=rent';
    }
    if (banner.target_type === 'product' && banner.target_value) {
      return `/products/${banner.target_value}`;
    }
    if ((banner.target_type === 'category' || banner.target_type === 'subcategory') && banner.target_value) {
      return `/category/${banner.target_value}`;
    }
    if (banner.target_type === 'url' && banner.target_value) {
      return banner.target_value;
    }
    return '/products?type=rent';
  };

  // Fallback when no banners configured in admin
  if (!banners || banners.length === 0) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[140px] pointer-events-none rounded-full" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            India&apos;s Premier Fashion Rental Hub
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            Own the Moment. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-amber-200">
              Rent the Outfit.
            </span>
          </h1>
          <p className="text-neutral-300 text-base sm:text-lg mt-6 leading-relaxed">
            Access bespoke bridal lehengas, sherwanis, and luxury red-carpet couture at 10% of retail price. Delivered sanitized to your door in Bhopal & Pune.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-8">
            <Link
              href="/products?type=rent"
              className="px-8 py-3.5 rounded-full bg-emerald-500 text-neutral-950 font-bold text-sm hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5"
            >
              Explore Rentals
            </Link>
            <Link
              href="/products?type=sale"
              className="px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium text-sm border border-white/20 backdrop-blur-sm transition-all"
            >
              Shop Pre-Loved
            </Link>
            <Link
              href="/become-a-seller"
              className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 px-4 py-3"
            >
              <Store className="w-4 h-4" />
              List Closet & Earn →
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const currentBanner = banners[currentIndex];
  const targetHref = getTargetHref(currentBanner);

  return (
    <section
      className="relative overflow-hidden bg-neutral-950 text-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative w-full min-h-[460px] sm:min-h-[540px] lg:min-h-[600px] flex items-center">
        {/* Banner Images Crossfade */}
        {banners.map((b, idx) => (
          <div
            key={b.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <Image
              src={b.image_url}
              alt={b.title || 'BlinkWear Fashion Banner'}
              fill
              priority={idx === 0}
              loading={idx === 0 ? 'eager' : 'lazy'}
              className="object-cover object-center"
            />
            {/* Dark luxury gradient overlays for readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/40" />
          </div>
        ))}

        {/* Banner Text Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full py-16 sm:py-24">
          <div className="max-w-xl space-y-4 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-md text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Featured Curator Collection
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              {currentBanner.title}
            </h1>

            {currentBanner.subtitle && (
              <p className="text-neutral-200 text-sm sm:text-lg leading-relaxed line-clamp-3">
                {currentBanner.subtitle}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href={targetHref}
                className="px-8 py-3.5 rounded-full bg-emerald-500 text-neutral-950 font-bold text-sm hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 inline-flex items-center gap-2"
              >
                {currentBanner.cta_label || 'Explore Collection'}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/become-a-seller"
                className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium text-sm border border-white/20 backdrop-blur-sm transition-all"
              >
                List Closet & Earn
              </Link>
            </div>
          </div>
        </div>

        {/* Slide Controls if multiple banners */}
        {total > 1 && (
          <>
            <button
              onClick={prevSlide}
              aria-label="Previous slide"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center transition-all backdrop-blur-xs"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next slide"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center transition-all backdrop-blur-xs"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-10 sm:bottom-14 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex ? 'w-8 bg-emerald-400' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
