import React, { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductsFilter } from '@/components/product/ProductsFilter';
import type { Category, ProductWithImages } from '@/types/database';
import { Search, SlidersHorizontal } from 'lucide-react';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    category?: string;
    city?: string;
    size?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export const revalidate = 0; // Live search results

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedParams = await searchParams;
  const queryTerm = resolvedParams.q || '';
  const supabase = await createClient();

  // Fetch categories
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const categories = (categoriesData || []) as Category[];

  // Fetch available cities
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

  if (queryTerm.trim()) {
    const term = queryTerm.trim();
    query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%,brand.ilike.%${term}%,search_tags.cs.{"${term}"}`);
  }

  if (resolvedParams.type === 'rent') {
    query = query.in('listing_type', ['rent', 'both']);
  } else if (resolvedParams.type === 'sale') {
    query = query.in('listing_type', ['sale', 'both']);
  }

  if (resolvedParams.category) {
    const selectedCat = categories.find((c) => c.slug === resolvedParams.category);
    if (selectedCat) {
      query = query.or(`category_id.eq.${selectedCat.id},subcategory_id.eq.${selectedCat.id}`);
    }
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Search Header */}
      <div className="pb-6 border-b border-neutral-100 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900">
              {queryTerm ? `Results for “${queryTerm}”` : 'Search Luxury Wardrobe'}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
              Found {products.length} {products.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <aside className="lg:col-span-1">
          <Suspense fallback={<div className="h-96 bg-neutral-50 rounded-2xl animate-pulse" />}>
            <ProductsFilter
              categories={categories}
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
              <h3 className="font-semibold text-lg text-neutral-900">No Outfits Found</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                We couldn&apos;t find any outfits matching &ldquo;{queryTerm}&rdquo;. Try checking spelling or searching broader terms like &ldquo;Lehenga&rdquo; or &ldquo;Sherwani&rdquo;.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
