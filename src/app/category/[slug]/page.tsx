import React, { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductsFilter } from '@/components/product/ProductsFilter';
import { JsonLd } from '@/components/seo/JsonLd';
import type { Category, ProductWithImages } from '@/types/database';
import { Sparkles, SlidersHorizontal, ChevronRight, Home } from 'lucide-react';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    type?: string;
    city?: string;
    size?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from('categories')
    .select('name, slug')
    .eq('slug', slug)
    .single();

  if (!category) {
    return {
      title: 'Category Not Found | BlinkWear',
    };
  }

  const title = `${category.name} Rental & Designer Wear`;
  const description = `Rent authentic designer ${category.name.toLowerCase()} in Bhopal, Pune, and across India on BlinkWear.in. 100% sanitized, doorstep delivery & reverse pickup.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://blinkwear.in/category/${slug}`,
    },
    openGraph: {
      title: `${category.name} Rental | BlinkWear.in`,
      description,
      url: `https://blinkwear.in/category/${slug}`,
      type: 'website',
      images: [{ url: '/icon.png', width: 512, height: 512, alt: `${category.name} Rental` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} Rental | BlinkWear.in`,
      description,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const resolvedParams = await searchParams;
  const supabase = await createClient();

  // Fetch target category
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!category) {
    // If not found in DB directly, let's check subcategories or handle gracefully
    notFound();
  }

  // Fetch all active categories for filter
  const { data: allCategories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  // Fetch available cities
  const { data: citiesData } = await supabase
    .from('platform_cities')
    .select('name')
    .eq('is_active', true);

  const availableCities = citiesData && citiesData.length > 0
    ? citiesData.map((c) => c.name)
    : ['Bhopal', 'Pune'];

  // Fetch subcategories of this category
  const subcategories = (allCategories || []).filter((c) => c.parent_id === category.id);
  const targetCategoryIds = [category.id, ...subcategories.map((s) => s.id)];

  // Query products
  let query = supabase
    .from('products')
    .select(`
      id, seller_id, category_id, subcategory_id, title, description, brand,
      size, color, condition, listing_type, sale_price, discount_price,
      rent_price_per_day, security_deposit, delivery_charge, city, status,
      view_count, stock_quantity, min_rental_days, max_rental_days,
      search_tags, video_url, featured, created_at, updated_at,
      product_images (*),
      category:categories!products_category_id_fkey (id, name, slug)
    `)
    .eq('status', 'active')
    .in('category_id', targetCategoryIds);

  if (resolvedParams.type === 'rent') {
    query = query.in('listing_type', ['rent', 'both']);
  } else if (resolvedParams.type === 'sale') {
    query = query.in('listing_type', ['sale', 'both']);
  }

  if (resolvedParams.city) {
    query = query.eq('city', resolvedParams.city);
  }

  if (resolvedParams.size) {
    query = query.ilike('size', `%${resolvedParams.size}%`);
  }

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
    query = query.order('created_at', { ascending: false });
  }

  const { data: productsData } = await query.limit(48);
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
      {
        '@type': 'ListItem',
        position: 3,
        name: category.name,
        item: `https://blinkwear.in/category/${category.slug}`,
      },
    ],
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${category.name} Outfits for Rent & Sale`,
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
        <Link href="/products" className="hover:text-neutral-900">
          Collections
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        <span className="font-semibold text-neutral-900" aria-current="page">
          {category.name}
        </span>
      </nav>

      {/* Category Header */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-950 text-white rounded-3xl p-6 sm:p-12 mb-8 sm:mb-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Curated Designer Collection
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white">
            {category.name}
          </h1>
          <p className="text-neutral-300 text-xs sm:text-sm mt-3 leading-relaxed">
            Browse our hand-selected {category.name.toLowerCase()} available for rent or purchase. Delivered freshly sanitized with doorstep return.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <aside className="lg:col-span-1">
          <Suspense fallback={<div className="h-96 bg-neutral-50 rounded-2xl animate-pulse" />}>
            <ProductsFilter
              categories={(allCategories || []) as Category[]}
              availableCities={availableCities}
            />
          </Suspense>
        </aside>

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
              <h3 className="font-semibold text-lg text-neutral-900">No Outfits Found in {category.name}</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                Try selecting a different filter or check back soon as sellers add new listings daily!
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
