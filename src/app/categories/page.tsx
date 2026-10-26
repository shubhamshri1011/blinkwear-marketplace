import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { createCatalogClient } from '@/lib/supabase/catalog';
import { JsonLd } from '@/components/seo/JsonLd';
import type { Category } from '@/types/database';
import {
  Sparkles,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Tag,
  Layers,
  ChevronRight,
  Flame,
} from 'lucide-react';

export const revalidate = 60; // ISR revalidation

export const metadata: Metadata = {
  title: 'Explore Fashion Categories — Rent Lehenga, Sherwani, Dresses | BlinkWear Pune & Bhopal',
  description:
    'Browse all designer fashion rental and resale categories on BlinkWear.in. Rent bridal lehengas, groom sherwanis, party gowns, and festive sarees in Pune and Bhopal. 100% sanitized, doorstep delivery & free return pickup.',
  keywords: [
    'categories fashion rental',
    'rental lehenga Bhopal',
    'rental lehenga Pune',
    'sherwani on rent Bhopal',
    'sherwani on rent Pune',
    'designer dress rental',
    'saree on rent Bhopal',
    'wedding outfit rental categories',
    'BlinkWear categories',
    'lehenga rent near me',
  ],
  alternates: {
    canonical: 'https://blinkwear.in/categories',
  },
  openGraph: {
    title: 'Explore Fashion Categories — Rent Lehenga, Sherwani, Dresses | BlinkWear',
    description:
      'Browse all fashion rental categories on BlinkWear in Pune and Bhopal. Rent bridal lehengas, sherwanis, gowns & sarees at a fraction of retail price.',
    url: 'https://blinkwear.in/categories',
    images: [{ url: '/icon.png', width: 512, height: 512, alt: 'BlinkWear Fashion Categories' }],
  },
};

// Rich curated imagery and descriptions for each category
const CATEGORY_META: Record<
  string,
  {
    image: string;
    description: string;
    badge?: string;
    popularTags: string[];
  }
> = {
  lehengas: {
    image:
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
    description:
      'Designer bridal lehengas, sangeet outfits, and festive cholis crafted by premier couturiers. Available for 3 to 7 days rental in Pune and Bhopal.',
    badge: 'Most Popular',
    popularTags: ['Bridal Lehengas', 'Sangeet Outfits', 'Pastel Lehengas', 'Velvet Heavy Work'],
  },
  sarees: {
    image:
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    description:
      'Handwoven Banarasi silk, Kanjivaram heirlooms, pre-draped cocktail sarees, and modern organza drapes for weddings and receptions.',
    badge: 'Festive Favorite',
    popularTags: ['Banarasi Silk', 'Pre-Draped Sarees', 'Cocktail Organza', 'Sequin Georgette'],
  },
  dresses: {
    image:
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80',
    description:
      'Glamorous evening gowns, red carpet maxis, reception dresses, and chic western party wear tailored for unforgettable moments.',
    badge: 'Red Carpet',
    popularTags: ['Ball Gowns', 'Cocktail Dresses', 'Reception Gowns', 'Bodycon Silks'],
  },
  'ethnic-wear': {
    image:
      'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80',
    description:
      'Traditional Anarkalis, sharara sets, indo-western jackets, and festive kurta ensembles curated for family functions and festive pujas.',
    popularTags: ['Anarkali Suits', 'Sharara Sets', 'Indo-Western Co-ords', 'Kurtas'],
  },
  men: {
    image:
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
    description:
      'Royal groom sherwanis, Bandhgalas, Jodhpuris, tuxedos, and tailored festive kurtas for weddings, receptions, and sangeet nights.',
    badge: 'Groom & Groomsmen',
    popularTags: ['Groom Sherwani', 'Tuxedos & Suits', 'Jodhpuri Bandhgala', 'Kurta Pajama Sets'],
  },
  women: {
    image:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    description:
      'Full women’s collection spanning luxury ethnic, bridal couture, western evening wear, fusion wear, and accessories.',
    popularTags: ['Lehengas', 'Sarees', 'Gowns', 'Shararas'],
  },
  kurta: {
    image:
      'https://images.unsplash.com/photo-1622122201714-7710ca5470de?auto=format&fit=crop&w=800&q=80',
    description:
      'Lightweight festive kurtas, embroidered silk kurtas, and asymmetrical designer styles for mehendi, haldi, and pujas.',
    popularTags: ['Silk Kurtas', 'Haldi Specials', 'Mehendi Wear', 'Pathani Sets'],
  },
  'western-wear': {
    image:
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
    description:
      'Contemporary silhouettes, chic co-ord sets, jumpsuits, blazers, and party tops for sundowners, birthdays, and high-fashion outings.',
    popularTags: ['Party Jumpsuits', 'Designer Blazers', 'Co-ord Sets', 'Slip Dresses'],
  },
  kids: {
    image:
      'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=800&q=80',
    description:
      'Adorable miniature lehengas, cute sherwanis, and festive dresses for kids. Made from soft, skin-safe sanitized fabrics.',
    popularTags: ['Kids Lehengas', 'Boys Sherwani', 'Festive Frocks', 'Dhoti Kurta'],
  },
  accessories: {
    image:
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80',
    description:
      'Bridal jewelry sets, Kundan necklaces, Maang Tikkas, statement clutches, and embellished belts to complete your look.',
    popularTags: ['Kundan Sets', 'Bridal Chokers', 'Embellished Clutches', 'Potlis'],
  },
  earings: {
    image:
      'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80',
    description:
      'Chandbalis, Jhumkas, Polki studs, and contemporary drop earrings designed to dazzle at weddings and festive galas.',
    popularTags: ['Kundan Jhumkas', 'Chandbali', 'Polki Earrings', 'Statement Drops'],
  },
  footwear: {
    image:
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80',
    description:
      'Embroidered juttis, embellished mojaris, wedding heels, and ethnic footwear matching bridal and festive couture.',
    popularTags: ['Bridal Juttis', 'Mojaris', 'Block Heels', 'Kolhapuris'],
  },
  belts: {
    image:
      'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=800&q=80',
    description:
      'Embroidered kamarbandhs, designer waist belts, and leather accessories to accentuate sarees, gowns, and lehengas.',
    popularTags: ['Kamarbandh', 'Embroidered Belts', 'Gown Belts'],
  },
  sleeper: {
    image:
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80',
    description: 'Comfortable ethnic slip-ons and casual footwear for pre-wedding functions.',
    popularTags: ['Slip-ons', 'Ethnic Slides'],
  },
};

async function getCategoriesData() {
  const supabase = createCatalogClient();
  if (!supabase) {
    return { categories: [], countsMap: {} };
  }

  // 1. Fetch all active categories
  const { data: rawCats } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id, icon_url, sort_order, is_active, created_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const categories = (rawCats || []) as Category[];

  // 2. Fetch live product counts grouped by category
  const countsMap: Record<string, number> = {};
  try {
    const { data: prods } = await supabase
      .from('products')
      .select('category_id')
      .eq('status', 'active');

    if (prods) {
      prods.forEach((p) => {
        if (p.category_id) {
          countsMap[p.category_id] = (countsMap[p.category_id] || 0) + 1;
        }
      });
    }
  } catch {
    // fallback gracefully
  }

  return { categories, countsMap };
}

export default async function CategoriesPage() {
  const { categories, countsMap } = await getCategoriesData();

  // Primary categories to highlight prominently
  const prioritySlugs = [
    'lehengas',
    'sarees',
    'dresses',
    'ethnic-wear',
    'men',
    'kurta',
    'western-wear',
    'kids',
    'accessories',
    'earings',
    'footwear',
  ];

  // Organize root vs subcategories
  const subcategoryMap: Record<string, Category[]> = {};
  categories.forEach((cat) => {
    if (cat.parent_id) {
      subcategoryMap[cat.parent_id] = subcategoryMap[cat.parent_id] || [];
      subcategoryMap[cat.parent_id].push(cat);
    }
  });

  // Sort categories with prioritized order
  const sortedCategories = categories
    .filter((c) => !c.parent_id || prioritySlugs.includes(c.slug))
    .sort((a, b) => {
      const idxA = prioritySlugs.indexOf(a.slug);
      const idxB = prioritySlugs.indexOf(b.slug);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.sort_order - b.sort_order;
    });

  // SEO Schemas
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://blinkwear.in',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Categories',
        item: 'https://blinkwear.in/categories',
      },
    ],
  };

  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Fashion Rental & Resale Categories — BlinkWear Pune & Bhopal',
    description:
      'Explore categories for bridal lehengas, sherwanis, party gowns, sarees, and designer festive fashion available for rent in Pune & Bhopal.',
    url: 'https://blinkwear.in/categories',
    hasPart: sortedCategories.map((c) => ({
      '@type': 'ProductGroup',
      name: c.name,
      url: `https://blinkwear.in/category/${c.slug}`,
      description: CATEGORY_META[c.slug]?.description || `Rent ${c.name} in Pune and Bhopal`,
    })),
  };

  const aeoCategoryFaqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What fashion categories can I rent on BlinkWear in Pune and Bhopal?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'On BlinkWear, you can rent bridal and party lehengas, groom sherwanis, tuxedos, designer festive sarees (Banarasi, Kanjivaram, Organza), evening gowns, western dresses, and matching jewelry with doorstep delivery across Pune and Bhopal.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I choose between renting and buying a category on BlinkWear?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Every category on BlinkWear offers both Rent and Buy options. Renting is ideal for weddings, sangeet, receptions, and festivals (rent for 3 to 7 days at 10% of retail price). Buying is available for pre-loved designer pieces you wish to own permanently.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are rental categories delivered to my doorstep in Bhopal and Pune?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! BlinkWear provides doorstep delivery and free reverse return pickup across all serviced pin codes in Pune and Bhopal. Every garment arrives 100% sanitized and dry-cleaned.',
        },
      },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={collectionPageSchema} />
      <JsonLd data={aeoCategoryFaqSchema} />

      <main className="min-h-screen bg-neutral-50/60 pb-20">
        {/* Breadcrumb Header */}
        <div className="bg-white border-b border-neutral-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav className="flex items-center text-xs text-neutral-500 gap-1.5">
              <Link href="/" className="hover:text-neutral-900 transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3 h-3 text-neutral-400" />
              <span className="font-semibold text-neutral-900">Categories</span>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white py-12 sm:py-16">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-orange-500/10 blur-[130px] rounded-full pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-orange-400 text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Curated Designer Fashion • Pune &amp; Bhopal
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Explore All Categories
            </h1>
            <p className="mt-3 text-neutral-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Rent iconic bridal lehengas, royal sherwanis, glamorous gowns &amp; festive sarees at
              a fraction of retail price. 100% sanitized, delivered to your door in Pune &amp; Bhopal.
            </p>

            {/* Quick Guarantees Strip */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-medium text-neutral-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Sanitized Garments</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-400" />
                <span>Doorstep Delivery &amp; Pickup</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Deposit Refunded Post-Inspection</span>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Grid Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
          {/* Quick Filters Bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200/80 p-3 sm:p-4 mb-8 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider mr-2 hidden sm:inline">
                Quick Jump:
              </span>
              <a
                href="#lehengas"
                className="px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-orange-50 hover:text-orange-700 text-xs font-semibold text-neutral-700 transition-colors whitespace-nowrap"
              >
                Lehengas
              </a>
              <a
                href="#sarees"
                className="px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-orange-50 hover:text-orange-700 text-xs font-semibold text-neutral-700 transition-colors whitespace-nowrap"
              >
                Sarees
              </a>
              <a
                href="#dresses"
                className="px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-orange-50 hover:text-orange-700 text-xs font-semibold text-neutral-700 transition-colors whitespace-nowrap"
              >
                Gowns &amp; Dresses
              </a>
              <a
                href="#men"
                className="px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-orange-50 hover:text-orange-700 text-xs font-semibold text-neutral-700 transition-colors whitespace-nowrap"
              >
                Men&apos;s Sherwani
              </a>
              <a
                href="#ethnic-wear"
                className="px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-orange-50 hover:text-orange-700 text-xs font-semibold text-neutral-700 transition-colors whitespace-nowrap"
              >
                Ethnic Wear
              </a>
              <a
                href="#accessories"
                className="px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-orange-50 hover:text-orange-700 text-xs font-semibold text-neutral-700 transition-colors whitespace-nowrap"
              >
                Jewelry &amp; Accessories
              </a>
            </div>

            <Link
              href="/products?type=rent"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-500 shadow-sm transition-all"
            >
              <Flame className="w-3.5 h-3.5" />
              All Trending Rentals →
            </Link>
          </div>

          {/* Category Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCategories.map((category) => {
              const meta = CATEGORY_META[category.slug] || {
                image:
                  'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80',
                description: `Explore premium ${category.name} available for rent and sale in Pune & Bhopal. 100% verified authentic fashion.`,
                popularTags: ['Rent Online', 'Pune', 'Bhopal', 'Verified Quality'],
              };

              const subcategories = subcategoryMap[category.id] || [];
              const productCount = countsMap[category.id] || 0;

              return (
                <div
                  id={category.slug}
                  key={category.id}
                  className="group bg-white rounded-2xl overflow-hidden border border-neutral-200/80 shadow-xs hover:shadow-xl hover:border-orange-300 transition-all duration-300 flex flex-col"
                >
                  {/* Category Image Header */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={meta.image}
                      alt={`${category.name} on Rent in Bhopal & Pune`}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      {meta.badge ? (
                        <span className="px-2.5 py-1 rounded-full bg-orange-600/90 backdrop-blur-md text-white text-[11px] font-bold shadow-xs">
                          {meta.badge}
                        </span>
                      ) : (
                        <span />
                      )}
                      {productCount > 0 && (
                        <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold">
                          {productCount} {productCount === 1 ? 'Outfit' : 'Outfits'}
                        </span>
                      )}
                    </div>

                    {/* Bottom Title on Image */}
                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <h2 className="font-serif text-2xl font-bold tracking-tight drop-shadow-sm">
                        {category.name}
                      </h2>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed mb-4">
                        {meta.description}
                      </p>

                      {/* Subcategory Pills or Popular Tags */}
                      {subcategories.length > 0 ? (
                        <div className="mb-4">
                          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                            Subcategories:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {subcategories.map((sub) => (
                              <Link
                                key={sub.id}
                                href={`/category/${sub.slug}`}
                                className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-orange-100 hover:text-orange-800 text-xs font-medium text-neutral-700 transition-colors"
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : meta.popularTags?.length > 0 ? (
                        <div className="mb-4">
                          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                            Popular Looks:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {meta.popularTags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-md bg-neutral-100 text-[11px] font-medium text-neutral-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Action Links */}
                    <div className="pt-4 border-t border-neutral-100 grid grid-cols-2 gap-2">
                      <Link
                        href={`/category/${category.slug}?type=rent`}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all text-center"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        Rent {category.name}
                      </Link>
                      <Link
                        href={`/category/${category.slug}`}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs transition-colors text-center"
                      >
                        Explore All
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Curated Occasion Collections Block */}
          <section className="mt-16 bg-white rounded-3xl p-6 sm:p-10 border border-neutral-200/80 shadow-xs">
            <div className="max-w-2xl">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                Event-Ready Fashion
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-neutral-900 mt-1">
                Shop by Wedding &amp; Celebration Occasion
              </h2>
              <p className="text-neutral-600 text-sm mt-2">
                Curated outfits handpicked for every ceremony. Looking your absolute best has never
                been this effortless.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
              <Link
                href="/category/lehengas?type=rent"
                className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-neutral-900 flex flex-col justify-end p-4 text-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80"
                  alt="Wedding Day Outfits"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="relative z-10">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-orange-400">
                    Grand Occasion
                  </span>
                  <h3 className="font-serif font-bold text-base sm:text-lg">Bridal &amp; Wedding</h3>
                  <span className="text-xs text-neutral-300 mt-1 inline-flex items-center gap-1 group-hover:text-white">
                    Explore Outfits →
                  </span>
                </div>
              </Link>

              <Link
                href="/category/lehengas?type=rent"
                className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-neutral-900 flex flex-col justify-end p-4 text-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80"
                  alt="Sangeet & Cocktail Night"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="relative z-10">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-orange-400">
                    Party Night
                  </span>
                  <h3 className="font-serif font-bold text-base sm:text-lg">Sangeet &amp; Cocktail</h3>
                  <span className="text-xs text-neutral-300 mt-1 inline-flex items-center gap-1 group-hover:text-white">
                    Explore Outfits →
                  </span>
                </div>
              </Link>

              <Link
                href="/category/kurta?type=rent"
                className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-neutral-900 flex flex-col justify-end p-4 text-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1622122201714-7710ca5470de?auto=format&fit=crop&w=600&q=80"
                  alt="Haldi & Mehendi Ensembles"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="relative z-10">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-orange-400">
                    Day Ceremonies
                  </span>
                  <h3 className="font-serif font-bold text-base sm:text-lg">Haldi &amp; Mehendi</h3>
                  <span className="text-xs text-neutral-300 mt-1 inline-flex items-center gap-1 group-hover:text-white">
                    Explore Outfits →
                  </span>
                </div>
              </Link>

              <Link
                href="/category/dresses?type=rent"
                className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-neutral-900 flex flex-col justify-end p-4 text-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80"
                  alt="Reception Gowns"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="relative z-10">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-orange-400">
                    Evening Glam
                  </span>
                  <h3 className="font-serif font-bold text-base sm:text-lg">Reception &amp; Gala</h3>
                  <span className="text-xs text-neutral-300 mt-1 inline-flex items-center gap-1 group-hover:text-white">
                    Explore Outfits →
                  </span>
                </div>
              </Link>
            </div>
          </section>

          {/* AEO / FAQ Accordion Block */}
          <section className="mt-16 bg-white rounded-3xl p-6 sm:p-10 border border-neutral-200/80 shadow-xs">
            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Common Questions
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-neutral-900 mt-1">
                Frequently Asked Questions
              </h2>
              <p className="text-neutral-500 text-xs sm:text-sm mt-1">
                Everything you need to know about renting designer categories on BlinkWear
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-100">
                <h3 className="font-bold text-sm text-neutral-900 mb-2">
                  Can I rent wedding lehengas &amp; sherwanis in Pune &amp; Bhopal?
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Yes! BlinkWear provides on-demand fashion rental in Pune and Bhopal. You can rent
                  authentic bridal lehengas, groom sherwanis, tuxedos, and gowns with doorstep
                  delivery and free return pickup.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-100">
                <h3 className="font-bold text-sm text-neutral-900 mb-2">
                  Are rented clothes sanitized and clean?
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  100% yes. Every garment goes through a rigorous multi-stage sanitization,
                  professional dry cleaning, and quality check before being sealed and dispatched.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-100">
                <h3 className="font-bold text-sm text-neutral-900 mb-2">
                  How does the security deposit work?
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  A refundable security deposit is held during the rental duration. Once the outfit
                  is collected by our delivery partner and passes standard quality inspection, the
                  deposit is refunded back to your original payment method.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-100">
                <h3 className="font-bold text-sm text-neutral-900 mb-2">
                  How long can I keep the rented outfit?
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Standard rental periods are 3 days or 7 days, giving you ample time to try it on
                  before your event and return it stress-free afterwards.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
