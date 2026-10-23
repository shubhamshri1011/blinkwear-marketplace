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

// Only safe, explicitly-allow-listed columns for public store lookup
const SAFE_PUBLIC_PROFILE_COLUMNS = [
  'id',
  'store_name',
  'store_slug',
  'store_description',
  'tagline',
  'city',
  'logo_url',
  'banner_url',
  'accent_palette',
  'whatsapp_number',
  'instagram_handle',
  'store_hours',
  'speciality_tags',
  'show_about',
  'show_how_it_works',
  'show_reviews',
  'show_contact',
  'diwali_theme',
  'is_verified',
  'created_at',
].join(', ');

async function fetchStore(slug: string): Promise<SellerPublicProfile | null> {
  const supabase = await createClient();

  // Try RPC first (most restrictive — never leaks sensitive columns)
  try {
    const { data: rpcData } = await supabase.rpc('get_store_by_slug', { p_slug: slug });
    if (rpcData && rpcData.length > 0) {
      return (rpcData[0] as unknown as SellerPublicProfile);
    }
  } catch (err) {
    console.error('[SellerStorePage] RPC error, falling back to view:', err);
  }

  // Fallback: explicit column select on the public view (never select(*))
  const { data, error } = await supabase
    .from('seller_public_profiles')
    .select(SAFE_PUBLIC_PROFILE_COLUMNS)
    .ilike('store_slug', slug)
    .maybeSingle();

  if (error) {
    console.error('[SellerStorePage] View fallback error:', error.message);
    return null;
  }
  return (data as unknown as SellerPublicProfile) || null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await fetchStore(slug.toLowerCase().trim());

  if (!store) {
    return {
      title: 'Boutique Not Found | BlinkWear',
      description: 'The boutique you are looking for could not be found on BlinkWear.',
    };
  }

  const title = `${store.store_name} — Designer Ethnic & Bridal Wear | Rent & Buy`;
  const description =
    store.tagline
      ? `${store.tagline}. ${store.store_description || `Rent and buy designer bridal outfits from ${store.store_name} on BlinkWear.`}`
      : store.store_description ||
        `Rent and buy designer bridal outfits from ${store.store_name}${store.city ? ` in ${store.city}` : ''} on BlinkWear.`;
  const canonicalUrl = `https://${store.store_slug}.blinkwear.in`;
  const ogImage = store.banner_url || store.logo_url || 'https://blinkwear.in/icon.png';

  const keywords = [
    store.store_name,
    `${store.store_name} lehenga`,
    `${store.store_name} rental`,
    store.city ? `${store.city} bridal wear` : 'bridal wear',
    ...(store.speciality_tags || []),
    'bridal lehenga on rent',
    'ethnic wear rental',
    'BlinkWear boutique',
  ];

  return {
    title,
    description,
    keywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: `${store.store_name} on BlinkWear`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: store.store_name }],
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function SellerStorePage({ params }: PageProps) {
  const { slug } = await params;
  const cleanSlug = slug.toLowerCase().trim();

  const store = await fetchStore(cleanSlug);

  if (!store) {
    notFound();
  }

  const supabase = await createClient();

  // Fetch ONLY approved, active products — explicit column list, no select('*')
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
    .order('created_at', { ascending: false })
    .limit(200);

  if (prodErr) {
    console.error('[SellerStorePage] Failed to fetch seller products:', prodErr.message);
  }

  const products = (productsData || []) as unknown as ProductWithImages[];

  // Rich Schema.org LocalBusiness / ClothingStore
  const storeSchema = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: store.store_name,
    description: store.store_description || `${store.store_name} on BlinkWear`,
    url: `https://${cleanSlug}.blinkwear.in`,
    logo: store.logo_url || 'https://blinkwear.in/icon.png',
    image: store.banner_url || store.logo_url || 'https://blinkwear.in/icon.png',
    priceRange: '₹₹ - ₹₹₹',
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cashfree, UPI, Net Banking, Credit Card',
    ...(store.show_contact && store.whatsapp_number
      ? { telephone: store.whatsapp_number }
      : {}),
    address: {
      '@type': 'PostalAddress',
      addressLocality: store.city || 'India',
      addressCountry: 'IN',
    },
    ...(store.store_hours ? { openingHours: store.store_hours } : {}),
    ...(store.instagram_handle
      ? { sameAs: [`https://instagram.com/${store.instagram_handle}`] }
      : {}),
  };

  return (
    <>
      <JsonLd data={storeSchema} />
      <SellerStoreView store={store} products={products} />
    </>
  );
}
