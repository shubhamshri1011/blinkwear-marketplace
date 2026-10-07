import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/product/ProductCard';
import { HeroBannerSlider } from '@/components/home/HeroBannerSlider';
import { DynamicSectionRenderer } from '@/components/home/DynamicSectionRenderer';
import type { Banner, Category, HomepageSectionWithProducts, ProductWithImages } from '@/types/database';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CalendarCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Tag,
  Star,
  Store,
  Layers,
} from 'lucide-react';

export const revalidate = 60; // ISR revalidation every 60 seconds

async function getHomepageData() {
  const supabase = await createClient();

  // 1. Fetch active buyer banners
  const { data: banners } = await supabase
    .from('banners')
    .select('*')
    .eq('panel', 'buyer')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  // 2. Fetch active root categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .is('parent_id', null)
    .order('sort_order', { ascending: true })
    .limit(8);

  // 3. Fetch active homepage sections
  const { data: sections } = await supabase
    .from('homepage_sections')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  const sectionsWithProducts: HomepageSectionWithProducts[] = [];

  if (sections && sections.length > 0) {
    for (const section of sections) {
      let products: ProductWithImages[] = [];

      if (section.filter_rule === 'curated' || section.filter_rule === 'curated_or_auto') {
        const { data: curProds } = await supabase
          .from('homepage_section_products')
          .select(`
            product_id,
            display_order,
            product:products (
              *,
              product_images (*)
            )
          `)
          .eq('section_id', section.id)
          .order('display_order', { ascending: true })
          .limit(section.item_limit || 8);

        if (curProds && curProds.length > 0) {
          products = curProds
            .map((item) => item.product)
            .filter((p): p is ProductWithImages => p !== null && p.status === 'active');
        }
      }

      // Dynamic rule or fallback if curated list is empty
      if (products.length === 0) {
        let query = supabase
          .from('products')
          .select(`
            *,
            product_images (*)
          `)
          .eq('status', 'active');

        if (section.filter_rule === 'trending_rentals') {
          query = query.in('listing_type', ['rent', 'both']).order('view_count', { ascending: false });
        } else if (section.filter_rule === 'new_arrivals') {
          query = query.order('created_at', { ascending: false });
        } else if (section.filter_rule === 'featured') {
          query = query.eq('featured', true).order('featured_sort_order', { ascending: true });
        } else if (section.filter_rule === 'popular_buys') {
          query = query.in('listing_type', ['sale', 'both']).order('view_count', { ascending: false });
        } else {
          query = query.order('created_at', { ascending: false });
        }

        const { data: fallbackProds } = await query.limit(section.item_limit || 8);
        if (fallbackProds) {
          products = fallbackProds as unknown as ProductWithImages[];
        }
      }

      sectionsWithProducts.push({
        ...section,
        products,
      });
    }
  }

  // Fallback: If no sections are configured in admin yet, fetch featured & recent products
  let fallbackFeatured: ProductWithImages[] = [];
  if (sectionsWithProducts.length === 0) {
    const { data: prods } = await supabase
      .from('products')
      .select(`
        *,
        product_images (*)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(8);

    if (prods) {
      fallbackFeatured = prods as unknown as ProductWithImages[];
    }
  }

  return {
    banners: (banners || []) as Banner[],
    categories: (categories || []) as Category[],
    sections: sectionsWithProducts,
    fallbackFeatured,
  };
}

export default async function HomePage() {
  const { banners, categories, sections, fallbackFeatured } = await getHomepageData();

  return (
    <div className="flex flex-col gap-12 sm:gap-20 pb-20">
      {/* 1. Admin Hero Banner Slider */}
      <HeroBannerSlider banners={banners} />

      {/* 2. "How BlinkWear Rental Works" - High Trust 3 Steps */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-12 relative z-20">
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-neutral-100">
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Hassle-Free Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 mt-2">
              How Fashion Rental Works
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Zero cleaning stress. Zero wardrobe clutter. 3 seamless steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-xs">
                <CalendarCheck className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded-full mb-1">
                Step 01
              </span>
              <h3 className="text-base font-bold text-neutral-900">Select & Reserve</h3>
              <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                Choose your event date and rental duration (3, 5, or 7+ days). Check live calendar availability and book with secure payment.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-xs">
                <Sparkles className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded-full mb-1">
                Step 02
              </span>
              <h3 className="text-base font-bold text-neutral-900">Receive & Flaunt</h3>
              <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                Delivered 24-48 hours before your event. Pristine, custom-pressed, sanitized, and ready for you to shine in your photographs.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-xs">
                <RotateCcw className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded-full mb-1">
                Step 03
              </span>
              <h3 className="text-base font-bold text-neutral-900">Doorstep Pickup & Refund</h3>
              <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                No dry cleaning needed! Pack it into the prepaid garment bag. Our partner collects it, and your security deposit is promptly refunded.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Admin-Managed Categories Grid */}
      {categories && categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block mb-1 border border-emerald-100">
                Explore The Wardrobe
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
                Shop By Category
              </h2>
            </div>
            <Link
              href="/products"
              className="text-xs sm:text-sm font-semibold text-neutral-900 hover:text-emerald-600 flex items-center gap-1 group"
            >
              Browse All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((cat, idx) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="group relative rounded-3xl overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 text-white border border-neutral-800 shadow-md hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Decorative subtle ambient backdrop */}
                <div
                  className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 ${
                    idx % 3 === 0
                      ? 'bg-emerald-500/20 group-hover:bg-emerald-500/30'
                      : idx % 3 === 1
                      ? 'bg-amber-500/20 group-hover:bg-amber-500/30'
                      : 'bg-purple-500/20 group-hover:bg-purple-500/30'
                  }`}
                />

                <div className="relative z-10 flex flex-col justify-between h-28 sm:h-32">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                      Collection
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-emerald-500 group-hover:text-neutral-950 flex items-center justify-center transition-all duration-300">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-serif text-lg sm:text-xl font-bold group-hover:text-emerald-300 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Explore designer rentals & pre-loved →
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 4. Dynamic Admin-Configured Homepage Sections */}
      {sections.map((section) => (
        <DynamicSectionRenderer key={section.id} section={section} />
      ))}

      {/* Fallback Section if Admin Has Not Created Any Homepage Sections Yet */}
      {sections.length === 0 && fallbackFeatured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block mb-1 border border-emerald-100">
                Curated Listings
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
                Trending Designer Outfits
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                Hand-picked bridal lehengas, sherwanis, and event couture available for rent.
              </p>
            </div>

            <Link
              href="/products"
              className="text-xs sm:text-sm font-semibold text-neutral-900 hover:text-emerald-600 flex items-center gap-1 group"
            >
              View All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {fallbackFeatured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 5. Seller Onboarding Invitation Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 text-white p-8 sm:p-14 border border-neutral-800 shadow-2xl">
          <div className="max-w-xl space-y-4 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
              <Store className="w-3.5 h-3.5" />
              BlinkWear Partner Program
            </span>

            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
              Turn Your Designer Closet Into Monthly Income
            </h2>

            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
              Have bridal lehengas or designer sherwanis sitting in your closet after one wear? List with BlinkWear and earn up to ₹35,000 every month. We handle dry-cleaning, insured delivery, and reverse pickups.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/become-a-seller"
                className="px-6 py-3 rounded-full bg-emerald-500 text-neutral-950 font-bold text-sm hover:bg-emerald-400 transition-all shadow-md"
              >
                Apply as Seller
              </Link>
              <Link
                href="/seller-terms"
                className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium text-sm border border-white/20 transition-all"
              >
                Learn How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Hygiene & Sanitization Guarantee Section */}
      <section className="bg-neutral-50 py-16 border-y border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-3 py-1 rounded-full">
              Our Safety Pledge
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 mt-2">
              Hospital-Grade Hygiene on Every Garment
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-2 leading-relaxed">
              Every designer garment undergoes our 7-step inspection and sanitation cycle before being sealed in an airtight, moisture-proof garment bag.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm mb-3">
                01
              </div>
              <h4 className="font-semibold text-neutral-900 text-sm">Fabric-Safe Dry Cleaning</h4>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                Eco-friendly, solvent-free sanitization specially formulated for delicate zardozi, silk, and embroidery.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm mb-3">
                02
              </div>
              <h4 className="font-semibold text-neutral-900 text-sm">UV-C Light Sterilization</h4>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                99.9% elimination of bacteria and micro-contaminants using medical grade UV chambers.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm mb-3">
                03
              </div>
              <h4 className="font-semibold text-neutral-900 text-sm">Steam Press & Finish</h4>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                Precision high-temperature vertical steam pressing ensuring zero creases and crisp draping.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm mb-3">
                04
              </div>
              <h4 className="font-semibold text-neutral-900 text-sm">Tamper-Evident Bag</h4>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                Shipped sealed with a security tag and return label so you receive an untouched, runway-ready garment.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
