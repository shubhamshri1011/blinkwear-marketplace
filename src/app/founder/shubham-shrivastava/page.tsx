import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, Layers, TrendingUp, Store, Sparkles, Users } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Shubham Shrivastava — Founder of BlinkWear.in',
  description:
    'Meet Shubham Shrivastava, founder of BlinkWear.in, a fashion rental and resale marketplace making occasionwear more accessible.',
  alternates: {
    canonical: 'https://www.blinkwear.in/founder/shubham-shrivastava',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
    },
  },
  openGraph: {
    title: 'Shubham Shrivastava — Founder of BlinkWear.in',
    description:
      'Meet Shubham Shrivastava, founder of BlinkWear.in, a fashion rental and resale marketplace making occasionwear more accessible.',
    url: 'https://www.blinkwear.in/founder/shubham-shrivastava',
    siteName: 'BlinkWear.in',
    locale: 'en_IN',
    type: 'profile',
    images: [
      {
        url: 'https://www.blinkwear.in/icon.png',
        width: 512,
        height: 512,
        alt: 'Shubham Shrivastava — Founder, BlinkWear.in',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shubham Shrivastava — Founder of BlinkWear.in',
    description:
      'Meet Shubham Shrivastava, founder of BlinkWear.in, a fashion rental and resale marketplace making occasionwear more accessible.',
    images: ['https://www.blinkwear.in/icon.png'],
    site: '@blinkwear_in',
  },
};

const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': 'https://www.blinkwear.in/founder/shubham-shrivastava#person',
  name: 'Shubham Shrivastava',
  jobTitle: 'Founder',
  url: 'https://www.blinkwear.in/founder/shubham-shrivastava',
  worksFor: {
    '@type': 'Organization',
    '@id': 'https://www.blinkwear.in/#organization',
    name: 'BlinkWear.in',
    url: 'https://www.blinkwear.in',
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
    'BlinkWear.in is a fashion marketplace focused on renting, buying, and reselling fashion, particularly occasionwear and ethnic clothing. Its mission is to make fashion more accessible and create opportunities for clothing owners and sellers to earn from their collections.',
  founder: {
    '@type': 'Person',
    '@id': 'https://www.blinkwear.in/founder/shubham-shrivastava#person',
    name: 'Shubham Shrivastava',
    jobTitle: 'Founder',
    url: 'https://www.blinkwear.in/founder/shubham-shrivastava',
  },
  email: 'support@blinkwear.in',
  telephone: '+917722958818',
  areaServed: [
    { '@type': 'City', name: 'Bhopal' },
    { '@type': 'City', name: 'Pune' },
  ],
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://www.blinkwear.in',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Shubham Shrivastava — Founder',
      item: 'https://www.blinkwear.in/founder/shubham-shrivastava',
    },
  ],
};

const focusAreas = [
  {
    icon: Layers,
    title: 'Product Development',
    description:
      'Building the BlinkWear platform with a focus on seamless rental and resale experiences for buyers, sellers, and clothing owners.',
  },
  {
    icon: Store,
    title: 'Seller Onboarding',
    description:
      'Enabling clothing owners and independent sellers to list their occasionwear and reach more customers through a digital marketplace.',
  },
  {
    icon: TrendingUp,
    title: 'Marketplace Technology',
    description:
      'Developing the technology infrastructure to power a scalable fashion commerce platform built for India\'s celebrations.',
  },
  {
    icon: Users,
    title: 'Customer Experience',
    description:
      'Ensuring every step — from browsing to doorstep delivery and pickup — is simple, trusted, and delightful for every customer.',
  },
];

export default function FounderPage() {
  return (
    <div className="flex flex-col gap-0 pb-20">
      <JsonLd data={[personSchema, organizationSchema, breadcrumbSchema]} />

      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-2"
      >
        <ol className="flex items-center gap-2 text-xs text-neutral-500">
          <li>
            <Link href="/" className="hover:text-emerald-600 transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true" className="text-neutral-300">
            /
          </li>
          <li className="text-neutral-700 font-medium" aria-current="page">
            Shubham Shrivastava — Founder
          </li>
        </ol>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        <div className="bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 rounded-3xl p-8 sm:p-14 border border-neutral-800 shadow-2xl relative overflow-hidden">
          {/* Decorative ambient backdrop */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-emerald-400/5 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-8">
            {/* Avatar placeholder */}
            <div
              aria-label="Shubham Shrivastava, Founder of BlinkWear.in"
              className="shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-700/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400"
            >
              <Sparkles className="w-10 h-10 sm:w-14 sm:h-14 opacity-60" aria-hidden="true" />
            </div>

            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
                Founder
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                Shubham Shrivastava
              </h1>
              <p className="text-emerald-400 font-semibold text-base sm:text-lg">
                Founder, BlinkWear.in
              </p>
              <p className="text-neutral-400 text-sm sm:text-base leading-relaxed max-w-xl">
                Building a technology-driven fashion marketplace to make premium occasionwear more
                accessible across India.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Shubham */}
      <section className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main bio */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                About Shubham Shrivastava
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 mt-3">
                Meet the Founder of BlinkWear.in
              </h2>
            </div>

            <div className="bg-neutral-50 rounded-2xl p-6 sm:p-8 border border-neutral-200 text-sm text-neutral-700 leading-relaxed space-y-4">
              <p>
                <strong>Shubham Shrivastava</strong> is the founder of{' '}
                <Link href="/" className="text-emerald-700 font-semibold hover:underline">
                  BlinkWear.in
                </Link>
                , a fashion rental and resale marketplace designed to make premium fashion more
                accessible and help people unlock value from clothing they already own.
              </p>
              <p>
                His vision is to build a technology-driven fashion marketplace where customers can
                rent or buy occasionwear while clothing owners and sellers can reach more customers
                through a digital platform.
              </p>
              <p>
                At BlinkWear, Shubham Shrivastava is focused on product development, marketplace
                technology, customer experience, seller onboarding, and building a scalable fashion
                commerce platform.
              </p>
            </div>
          </div>

          {/* Info card */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm space-y-4">
              <h3 className="font-semibold text-neutral-900 text-sm uppercase tracking-wider">
                Founder Profile
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-neutral-500 font-medium uppercase tracking-wide">
                    Name
                  </dt>
                  <dd className="text-neutral-900 font-semibold mt-0.5">Shubham Shrivastava</dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500 font-medium uppercase tracking-wide">
                    Role
                  </dt>
                  <dd className="text-neutral-900 mt-0.5">Founder</dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500 font-medium uppercase tracking-wide">
                    Company
                  </dt>
                  <dd className="mt-0.5">
                    <Link href="/" className="text-emerald-700 font-semibold hover:underline">
                      BlinkWear.in
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500 font-medium uppercase tracking-wide">
                    Markets
                  </dt>
                  <dd className="text-neutral-900 mt-0.5">Bhopal &amp; Pune</dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500 font-medium uppercase tracking-wide">
                    Website
                  </dt>
                  <dd className="mt-0.5">
                    <Link
                      href="https://www.blinkwear.in"
                      className="text-emerald-700 hover:underline break-all"
                    >
                      www.blinkwear.in
                    </Link>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Focus Areas */}
      <section className="bg-neutral-50 border-y border-neutral-200 py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
              What Shubham Builds
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 mt-3">
              Areas of Focus at BlinkWear
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {focusAreas.map((area) => (
              <div
                key={area.title}
                className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm flex gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <area.icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 text-sm">{area.title}</h3>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    {area.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About BlinkWear.in */}
      <section className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
              About the Company
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 mt-3">
              About BlinkWear.in
            </h2>
            <div className="text-sm text-neutral-700 leading-relaxed space-y-4">
              <p>
                <strong>BlinkWear.in</strong> is a fashion marketplace focused on renting, buying,
                and reselling fashion — particularly occasionwear and ethnic clothing. Founded by{' '}
                <strong>Shubham Shrivastava</strong>, its mission is to make fashion more accessible
                and create opportunities for clothing owners and sellers to earn from their
                collections.
              </p>
              <p>
                BlinkWear currently serves customers in <strong>Bhopal</strong> and{' '}
                <strong>Pune</strong>, helping people access premium bridal lehengas, sherwanis, and
                occasionwear without the burden of a one-time purchase.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors mt-2"
            >
              Explore BlinkWear.in
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-6 sm:p-8 space-y-5">
            <h3 className="font-semibold text-neutral-900 text-sm uppercase tracking-wider">
              Quick Facts
            </h3>
            <ul className="space-y-3 text-sm text-neutral-700">
              {[
                { label: 'Founder', value: 'Shubham Shrivastava' },
                { label: 'Company', value: 'BlinkWear.in' },
                { label: 'Category', value: 'Fashion Rental & Resale Marketplace' },
                { label: 'Focus', value: 'Occasionwear & Ethnic Clothing' },
                { label: 'Markets', value: 'Bhopal (Madhya Pradesh) & Pune (Maharashtra)' },
              ].map((item) => (
                <li key={item.label} className="flex gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <span>
                    <strong>{item.label}:</strong> {item.value}
                  </span>
                </li>
              ))}
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                <span>
                  <strong>Website:</strong>{' '}
                  <Link href="https://www.blinkwear.in" className="text-emerald-700 hover:underline">
                    www.blinkwear.in
                  </Link>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-4">
        <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 rounded-3xl p-8 sm:p-12 border border-neutral-800 text-center">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-3">
            Explore BlinkWear.in
          </h2>
          <p className="text-neutral-400 text-sm max-w-md mx-auto mb-6">
            Browse designer lehengas, sherwanis, and occasionwear available to rent or buy — built
            by Shubham Shrivastava&apos;s vision of accessible fashion.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/products"
              className="px-6 py-3 rounded-full bg-emerald-500 text-neutral-950 font-bold text-sm hover:bg-emerald-400 transition-all shadow-md inline-flex items-center gap-2 justify-center"
            >
              Browse Fashion
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/about"
              className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium text-sm border border-white/20 transition-all"
            >
              About BlinkWear
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
