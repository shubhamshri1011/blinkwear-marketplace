import React, { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductsFilter } from '@/components/product/ProductsFilter';
import { JsonLd } from '@/components/seo/JsonLd';
import type { Category, ProductWithImages } from '@/types/database';
import { SlidersHorizontal, Home, ChevronRight } from 'lucide-react';

export const revalidate = 30;

export const metadata: Metadata = {
  title: 'All Designer Collections & Fashion Rentals',
  description:
    'Browse authentic designer bridal lehengas, groom sherwanis, bespoke tuxedos, and luxury gowns available for rent or purchase in Bhopal, Pune, and India on BlinkWear.in.',
  alternates: {
    canonical: 'https://blinkwear.in/products',
  },
  openGraph: {
    title: 'All Designer Collections & Fashion Rentals | BlinkWear.in',
    description:
      'Browse designer bridal lehengas, groom sherwanis, tuxedos, and gowns available for rent or purchase.',
    url: 'https://blinkwear.in/products',
    images: [{ url: '/icon.png', width: 512, height: 512, alt: 'BlinkWear Collections' }],
  },
};

interface ProductsPageProps {
  searchParams: Promise<{
    type?: string;
    category?: string;
    city?: string;
    size?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    q?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedParams = await searchParams;
  const supabase = await createClient();

  // Fetch categories for the filter sidebar
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const categories = (categoriesData || []) as Category[];

  // Fetch platform cities for city filter
  const { data: citiesData } = await supabase
    .from('platform_cities')
    .select('name')
    .eq('is_active', true);

  const availableCities = citiesData && citiesData.length > 0
    ? citiesData.map((c) => c.name)
    : ['Bhopal', 'Pune'];

  // Build query
  let query = supabase
    .from('products')
    .select(`
      *,
      product_images (*),
      category:categories!products_category_id_fkey (id, name, slug)
    `)
    .eq('status', 'active');

  // Filter by listing type
  if (resolvedParams.type === 'rent') {
    query = query.in('listing_type', ['rent', 'both']);
  } else if (resolvedParams.type === 'sale') {
    query = query.in('listing_type', ['sale', 'both']);
  }

  // Filter by category slug
  if (resolvedParams.category) {
    const selectedCat = categories.find((c) => c.slug === resolvedParams.category);
    if (selectedCat) {
      query = query.or(`category_id.eq.${selectedCat.id},subcategory_id.eq.${selectedCat.id}`);
    }
  }

  // Filter by city
  if (resolvedParams.city) {
    query = query.eq('city', resolvedParams.city);
  }

  // Filter by size
  if (resolvedParams.size) {
    query = query.ilike('size', `%${resolvedParams.size}%`);
  }

  // Filter by price
  if (resolvedParams.minPrice) {
    const minP = Number(resolvedParams.minPrice);
    if (!isNaN(minP)) {
      query = resolvedParams.type === 'rent'
        ? query.gte('rent_price_per_day', minP)
        : query.gte('sale_price', minP);
    }
  }

  if (resolvedParams.maxPrice) {
    const maxP = Number(resolvedParams.maxPrice);
    if (!isNaN(maxP)) {
      query = resolvedParams.type === 'rent'
        ? query.lte('rent_price_per_day', maxP)
        : query.lte('sale_price', maxP);
    }
  }

  // Filter by search query
  if (resolvedParams.q) {
    const sanitizedTerm = resolvedParams.q.trim().replace(/[,()\\"%]/g, '');
    if (sanitizedTerm) {
      query = query.or(`title.ilike.%${sanitizedTerm}%,description.ilike.%${sanitizedTerm}%,brand.ilike.%${sanitizedTerm}%`);
    }
  }

  // Sorting
  if (resolvedParams.sort === 'price_asc') {
    query = resolvedParams.type === 'rent'
      ? query.order('rent_price_per_day', { ascending: true, nullsFirst: false })
      : query.order('sale_price', { ascending: true, nullsFirst: false });
  } else if (resolvedParams.sort === 'price_desc') {
    query = resolvedParams.type === 'rent'
      ? query.order('rent_price_per_day', { ascending: false, nullsFirst: false })
      : query.order('sale_price', { ascending: false, nullsFirst: false });
  } else if (resolvedParams.sort === 'popular') {
    query = query.order('view_count', { ascending: false });
  } else {
    // Default newest
    query = query.order('created_at', { ascending: false });
  }

  const { data: productsData, error } = await query.limit(48);

  const products = (productsData || []) as unknown as ProductWithImages[];

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
        name: 'Collections',
        item: 'https://blinkwear.in/products',
      },
    ],
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'BlinkWear Designer Outfits',
    itemListElement: products.slice(0, 12).map((prod, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `https://blinkwear.in/products/${prod.id}`,
      name: prod.title,
    })),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <JsonLd data={[breadcrumbSchema, itemListSchema]} />

      {/* Crawlable Semantic Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-neutral-500 overflow-x-auto whitespace-nowrap scrollbar-none py-1">
        <Link href="/" className="hover:text-neutral-900 inline-flex items-center gap-1">
          <Home className="w-3.5 h-3.5" /> Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        <span className="font-semibold text-neutral-900" aria-current="page">
          Collections
        </span>
      </nav>

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-100 mb-8">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">
            {resolvedParams.q
              ? `Search Results for "${resolvedParams.q}"`
              : resolvedParams.type === 'rent'
              ? 'Designer Fashion for Rent'
              : resolvedParams.type === 'sale'
              ? 'Pre-Loved Designer Wardrobe'
              : 'All Designer Outfits'}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Showing {products.length} {products.length === 1 ? 'item' : 'items'} available with doorstep delivery
          </p>
        </div>
      </div>

      {/* Main Layout: Filter Sidebar + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Filter Sidebar */}
        <aside className="lg:col-span-1">
          <Suspense fallback={<div className="h-96 bg-neutral-50 rounded-2xl animate-pulse" />}>
            <ProductsFilter
              categories={categories}
              availableCities={availableCities}
            />
          </Suspense>
        </aside>

        {/* Products Grid */}
        <main className="lg:col-span-3">
          {products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < 4}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-neutral-50 rounded-3xl border border-neutral-100 p-8">
              <div className="w-16 h-16 mx-auto rounded-full bg-white shadow-xs border border-neutral-200 flex items-center justify-center text-neutral-400 mb-4">
                <SlidersHorizontal className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-lg text-neutral-900">No Outfits Found</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                We couldn&apos;t find any outfits matching your current filter criteria. Try clearing some filters or changing your city.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
