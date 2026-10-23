import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Sparkles, ShieldCheck, Truck, ArrowRight } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'About Us — BlinkWear.in | Founder Shubham Shrivastava',
  description:
    "Learn about BlinkWear.in, founded by Shubham Shrivastava — a fashion rental and resale marketplace making premium occasionwear accessible in Bhopal and Pune.",
  alternates: {
    canonical: 'https://blinkwear.in/about',
  },
  openGraph: {
    title: 'About Us | BlinkWear.in — Founded by Shubham Shrivastava',
    description:
      "Learn about BlinkWear.in, founded by Shubham Shrivastava — a fashion rental and resale marketplace making premium occasionwear accessible.",
    url: 'https://blinkwear.in/about',
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://www.blinkwear.in/#organization',
  name: 'BlinkWear.in',
  alternateName: ['BlinkWear', 'Blink Wear'],
  url: 'https://www.blinkwear.in',
  logo: {
    '@type': 'ImageObject',
    url: 'https://www.blinkwear.in/icon.png',
    width: 512,
    height: 512,
  },
  description:
    'BlinkWear.in is a fashion marketplace focused on renting, buying, and reselling fashion, particularly occasionwear and ethnic clothing.',
  founder: {
    '@type': 'Person',
    '@id': 'https://www.blinkwear.in/founder/shubham-shrivastava#person',
    name: 'Shubham Shrivastava',
    jobTitle: 'Founder',
    url: 'https://www.blinkwear.in/founder/shubham-shrivastava',
  },
  email: 'support@blinkwear.in',
  telephone: '+917722958818',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      <JsonLd data={organizationSchema} />

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
          <strong>BlinkWear.in</strong> is a fashion rental and resale marketplace founded by{' '}
          <Link href="/founder/shubham-shrivastava" className="text-emerald-700 font-semibold hover:underline">
            Shubham Shrivastava
          </Link>
          . Designed for India&apos;s celebrations, BlinkWear makes premium occasionwear accessible
          while helping clothing owners unlock value from their wardrobes.
        </p>
        <p>
          We curate authentic designer lehengas, royal sherwanis, bespoke tuxedos, and red-carpet gowns
          from leading ateliers and verified high-end personal wardrobes across Bhopal, Pune, and India.
          Every item undergoes rigorous fabric-safe hospital dry cleaning, multi-point craftsmanship
          inspection, and medical-grade UV sterilization before arriving sealed at your doorstep.
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
          <h3 className="font-bold text-base text-neutral-900">Doorstep Try &amp; Return</h3>
          <p className="text-xs text-neutral-500 mt-1">Seamless delivery 48 hours prior and scheduled reverse pickup.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs">
          <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
          <h3 className="font-bold text-base text-neutral-900">100% Authentic Apparel</h3>
          <p className="text-xs text-neutral-500 mt-1">Inspected for designer hallmarks, pristine stitching, and fabric integrity.</p>
        </div>
      </div>

      {/* Meet Our Founder */}
      <div className="bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 rounded-3xl p-8 sm:p-12 border border-neutral-800 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-8">
          <div className="shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-700/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-9 h-9 opacity-60" aria-hidden="true" />
          </div>
          <div className="flex-1 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
              Meet Our Founder
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-2">
              Shubham Shrivastava
            </h2>
            <p className="text-emerald-400 text-sm font-semibold">Founder, BlinkWear.in</p>
            <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed max-w-xl">
              Shubham Shrivastava founded BlinkWear.in with a vision to build a technology-driven
              fashion marketplace where customers can rent or buy occasionwear while clothing owners
              can reach more customers through a digital platform.
            </p>
            <Link
              href="/founder/shubham-shrivastava"
              className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 rounded-full bg-emerald-500 text-neutral-950 font-bold text-xs sm:text-sm hover:bg-emerald-400 transition-all"
            >
              Read Founder Profile
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
