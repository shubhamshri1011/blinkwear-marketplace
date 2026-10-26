'use client';

import React from 'react';
import Link from 'next/link';
import { Store, ArrowRight, Sparkles } from 'lucide-react';
import type { HomepageBlock } from '@/types/database';

interface SellerCtaBlockProps {
  block: HomepageBlock;
}

export function SellerCtaBlock({ block }: SellerCtaBlockProps) {
  const targetHref = block.view_all_href || '/become-a-seller';

  return (
    <section aria-label="Monetize Your Closet" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8 sm:my-12">
      <div className="relative rounded-3xl bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 text-white p-6 sm:p-10 lg:p-12 overflow-hidden border border-neutral-800 shadow-xl">
        {/* Ambient accent glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-orange-500/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-60 h-60 bg-emerald-500/10 blur-[90px] pointer-events-none rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              For Wardrobe Owners &amp; Boutiques in Pune &amp; Bhopal
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {block.title || 'List Your Designer Closet'}
            </h2>
            <p className="text-neutral-300 text-xs sm:text-sm md:text-base mt-2 leading-relaxed">
              {block.subtitle || 'Rent or sell your authentic designer lehengas, royal sherwanis & gowns with zero upfront fees. We manage sanitization, doorstep pickup & delivery.'}
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Link
              href={targetHref}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-600/20 transition-all transform hover:-translate-y-0.5 text-center"
            >
              <Store className="w-4 h-4" />
              Start Monetizing
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
