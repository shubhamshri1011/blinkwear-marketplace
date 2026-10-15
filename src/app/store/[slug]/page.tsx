import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SellerStoreView } from '@/components/store/SellerStoreView';
import { JsonLd } from '@/components/seo/JsonLd';
import type { ProductWithImages, SellerPublicProfile } from '@/types/database';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = slug.toLowerCase().trim();

  const supabase = await createClient();

  let store: SellerPublicProfile | null = null;
  try {
    const { data: rpcData } = await supabase.rpc('get_store_by_slug', {
      p_slug: cleanSlug,
    });
    if (rpcData && rpcData.length > 0) {
      store = rpcData[0];
    }
  } catch {
    // Fallback query on view
    const { data: viewData } = await supabase
      .from('seller_public_profiles')
      .select('id, store_name, store_slug, store_description, logo_url, banner_url, city, is_verified')
      .ilike('store_slug', cleanSlug)
      .maybeSingle();
    store = viewData;
  }

  if (!store) {
    return {
      title: 'Boutique Not Found',
      description: 'The requested seller boutique could not be found on BlinkWear.',
    };
  }

  const title = `${store.store_name} — Designer Wardrobe & Rental Boutique`;
  const description =
    store.store_description ||
    `Rent and buy luxury bridal lehengas, sherwanis, and gowns from ${store.store_name} in ${store.city || 'India'} on BlinkWear.`;
  const canonicalUrl = `https://${cleanSlug}.blinkwear.in`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: `${store.store_name} on BlinkWear`,
      images: store.banner_url
        ? [{ url: store.banner_url, width: 1200, height: 630, alt: store.store_name }]
        : [{ url: 'https://blinkwear.in/icon.png', width: 512, height: 512, alt: store.store_name }],
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: store.banner_url ? [store.banner_url] : ['https://blinkwear.in/icon.png'],
    },
  };
}

export default async function SellerStorePage({ params }: PageProps) {
  const { slug } = await params;
  const cleanSlug = slug.toLowerCase().trim();

  const supabase = await createClient();

  // 1. Fetch public store profile (safe, column-restricted, active + verified only)
  let store: SellerPublicProfile | null = null;
  try {
    const { data: rpcData } = await supabase.rpc('get_store_by_slug', {
      p_slug: cleanSlug,
    });
    if (rpcData && rpcData.length > 0) {
      store = rpcData[0];
    }
  } catch (err) {
    console.error('[SellerStorePage] RPC error, falling back to view:', err);
  }

  if (!store) {
    const { data: viewData, error: viewErr } = await supabase
      .from('seller_public_profiles')
      .select('id, store_name, store_slug, store_description, logo_url, banner_url, city, is_verified')
      .ilike('store_slug', cleanSlug)
      .maybeSingle();

    if (viewErr || !viewData) {
      notFound();
    }
    store = viewData;
  }

  // 2. Fetch approved active products for this seller (Strictly no select('*'))
  const { data: productsData, error: prodErr } = await supabase
    .from('products')
    .select(`
      id,
      seller_id,
      category_id,
      subcategory_id,
      title,
      description,
      brand,
      size,
      color,
      condition,
      listing_type,
      sale_price,
      discount_price,
      stock_quantity,
      rent_price_per_day,
      security_deposit,
      delivery_charge,
      city,
      status,
      view_count,
      featured,
      created_at,
      updated_at,
      product_images (id, image_url, sort_order),
      category:categories (id, name, slug)
    `)
    .eq('seller_id', store.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (prodErr) {
    console.error('[SellerStorePage] Failed to fetch seller products:', prodErr);
  }

  const products = (productsData || []) as unknown as ProductWithImages[];

  // 3. Schema.org Structured Data
  const storeSchema = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: store.store_name,
    description: store.store_description || `${store.store_name} on BlinkWear`,
    url: `https://${cleanSlug}.blinkwear.in`,
    logo: store.logo_url || 'https://blinkwear.in/icon.png',
    image: store.banner_url || store.logo_url || 'https://blinkwear.in/icon.png',
    address: {
      '@type': 'PostalAddress',
      addressLocality: store.city || 'India',
      addressCountry: 'IN',
    },
  };

  return (
    <>
      <JsonLd data={storeSchema} />
      <SellerStoreView store={store} products={products} />
    </>
  );
}
