import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Sparkles, ShieldCheck, Heart, Truck, RotateCcw } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us — Sustainable Luxury Fashion Rental',
  description:
    'Learn about BlinkWear.in, India\'s premier fashion rental ecosystem. Discover how we make runway-grade bridal and celebratory couture accessible and sustainable.',
  alternates: {
    canonical: 'https://blinkwear.in/about',
  },
  openGraph: {
    title: 'About Us | BlinkWear.in',
    description:
      'Learn about BlinkWear.in, India\'s premier fashion rental ecosystem. Discover how we make runway-grade bridal and celebratory couture accessible.',
    url: 'https://blinkwear.in/about',
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
          The Story of BlinkWear
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-neutral-900 tracking-tight">
          Democratizing Luxury Fashion for India&apos;s Celebrations
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
          Why spend ₹80,000 on an outfit worn for four hours when you can rent runway-grade couture for ₹3,000?
        </p>
      </div>

      <div className="bg-neutral-50 rounded-3xl p-8 sm:p-12 border border-neutral-200 text-xs sm:text-sm text-neutral-700 leading-relaxed space-y-6">
        <p>
          Founded with a passion for celebration and sustainable style, <strong>BlinkWear.in</strong> is India&apos;s premier fashion rental and luxury resale ecosystem. From intimate mehendi ceremonies and lavish sangeets to black-tie galas and corporate awards, we believe every individual deserves to feel magnificent without the burden of excessive wardrobe clutter or single-use consumer debt.
        </p>
        <p>
          We curate authentic designer lehengas, royal sherwanis, bespoke tuxedos, and red-carpet gowns from leading ateliers and verified high-end personal wardrobes across Bhopal, Pune, and India. Every item undergoes rigorous fabric-safe hospital dry cleaning, multi-point craftsmanship inspection, and medical-grade UV sterilization before arriving sealed at your doorstep.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs">
          <Sparkles className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
          <h3 className="font-bold text-base text-neutral-900">Zero Dry-Cleaning Hassle</h3>
          <p className="text-xs text-neutral-500 mt-1">We take care of all sanitization and post-event garment care.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs">
          <Truck className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
          <h3 className="font-bold text-base text-neutral-900">Doorstep Try & Return</h3>
          <p className="text-xs text-neutral-500 mt-1">Seamless delivery 48 hours prior and scheduled reverse pickup.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs">
          <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
          <h3 className="font-bold text-base text-neutral-900">100% Authentic Apparel</h3>
          <p className="text-xs text-neutral-500 mt-1">Inspected for designer hallmarks, pristine stitching, and fabric integrity.</p>
        </div>
      </div>
    </div>
  );
}
