import React from 'react';
import type { Metadata } from 'next';
import { createCatalogClient } from '@/lib/supabase/catalog';
import { getSiteThemeSettings } from '@/lib/theme';
import { HomeFeedClient, type BlockWithProducts } from '@/components/home/HomeFeedClient';
import { JsonLd } from '@/components/seo/JsonLd';
import type {
  Banner,
  Category,
  HomepageBlock,
  HomepageSectionWithProducts,
  ProductWithImages,
} from '@/types/database';

export const revalidate = 60; // ISR revalidation every 60 seconds

export const metadata: Metadata = {
  title: 'Rent Lehenga, Sherwani & Designer Wear in Pune & Bhopal | BlinkWear.in',
  description:
    'BlinkWear — Clean, fast-delivery fashion rental & resale platform in Pune and Bhopal. Rent bridal lehengas, groom sherwanis, tuxedos & luxury gowns. 100% sanitized, doorstep delivery & free return pickup.',
  keywords: [
    'rental lehenga Bhopal',
    'rental lehenga Pune',
    'lehenga on rent',
    'lehenga rent near me',
    'BlinkWear',
    'Blink Wear',
    'blinkwear.in',
    'bridal lehenga rental',
    'sherwani on rent Bhopal',
    'sherwani on rent Pune',
    'designer dress rental Bhopal',
    'designer dress rental Pune',
    'fashion rental Pune',
    'fashion rental Bhopal',
    'wedding outfit rental',
    'ethnic wear rental',
  ],
  alternates: {
    canonical: 'https://blinkwear.in',
  },
  openGraph: {
    title: 'Rent Lehenga, Sherwani & Designer Wear in Pune & Bhopal | BlinkWear.in',
    description:
      'Clean, fast-delivery fashion rental marketplace in Pune & Bhopal. Rent bridal lehengas, sherwanis, tuxedos & gowns. 100% sanitized, doorstep delivery.',
    url: 'https://blinkwear.in',
    images: [{ url: '/icon.png', width: 512, height: 512, alt: 'BlinkWear — Rent Lehenga Sherwani Pune Bhopal' }],
  },
};

// Strict public product columns: zero select('*')
const PUBLIC_PRODUCT_SELECT = `
  id,
  title,
  brand,
  size,
  color,
  condition,
  listing_type,
  sale_price,
  discount_price,
  rent_price_per_day,
  security_deposit,
  delivery_charge,
  city,
  status,
  view_count,
  stock_quantity,
  featured,
  featured_sort_order,
  created_at,
  product_images (
    id,
    image_url,
    sort_order
  )
`;

async function getHomepageData() {
  const supabase = createCatalogClient();
  if (!supabase) {
    return {
      themeSettings: await getSiteThemeSettings(),
      banners: [],
      categories: [],
      blocks: [],
      fallbackSections: [],
      fallbackFeatured: [],
    };
  }

  const now = new Date().toISOString();

  // 1. Fetch site theme settings
  const themeSettings = await getSiteThemeSettings();

  // 2. Fetch active buyer banners using CANONICAL columns only (start_date, end_date, cta_label)
  const { data: rawBanners } = await supabase
    .from('banners')
    .select('id, title, subtitle, cta_label, image_url, mobile_image_url, alt_text, placement, panel, target_type, target_value, display_order, is_active, start_date, end_date, created_at, updated_at')
    .eq('panel', 'buyer')
    .eq('is_active', true)
    .or(`start_date.is.null,start_date.lte.${now}`)
    .or(`end_date.is.null,end_date.gte.${now}`)
    .order('display_order', { ascending: true });

  const banners = (rawBanners || []) as Banner[];

  // 3. Fetch active root categories for strip & grid
  const { data: rawCategories } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id, icon_url, sort_order, is_active, show_in_strip, created_at')
    .eq('is_active', true)
    .is('parent_id', null)
    .order('sort_order', { ascending: true });

  const categories = (rawCategories || []) as Category[];

  // 4. Try fetching modern homepage_blocks (Phase 42 engine)
  let blocksWithData: BlockWithProducts[] = [];
  try {
    const { data: rawBlocks, error: blocksError } = await supabase
      .from('homepage_blocks')
      .select('id, block_type, title, subtitle, view_all_href, source_type, source_rule, category_id, curated_product_ids, banner_ids, custom_tiles, item_limit, city_filter, sort_order, is_active, start_at, end_at, created_at, updated_at')
      .eq('is_active', true)
      .or(`start_at.is.null,start_at.lte.${now}`)
      .or(`end_at.is.null,end_at.gte.${now}`)
      .order('sort_order', { ascending: true });

    if (!blocksError && rawBlocks && rawBlocks.length > 0) {
      for (const block of rawBlocks as HomepageBlock[]) {
        if (block.block_type === 'product_row') {
          let products: ProductWithImages[] = [];

          if (block.source_type === 'curated' && block.curated_product_ids?.length > 0) {
            const { data: curProds } = await supabase
              .from('products')
              .select(PUBLIC_PRODUCT_SELECT)
              .in('id', block.curated_product_ids)
              .eq('status', 'active')
              .limit(block.item_limit || 10);

            if (curProds) {
              products = curProds as unknown as ProductWithImages[];
            }
          } else if (block.source_type === 'category' && block.category_id) {
            const { data: catProds } = await supabase
              .from('products')
              .select(PUBLIC_PRODUCT_SELECT)
              .eq('category_id', block.category_id)
              .eq('status', 'active')
              .order('created_at', { ascending: false })
              .limit(block.item_limit || 10);

            if (catProds) {
              products = catProds as unknown as ProductWithImages[];
            }
          } else {
            // Rule-based query
            let query = supabase
              .from('products')
              .select(PUBLIC_PRODUCT_SELECT)
              .eq('status', 'active');

            if (block.source_rule === 'trending_rentals') {
              query = query
                .in('listing_type', ['rent', 'both'])
                .order('view_count', { ascending: false })
                .order('created_at', { ascending: false });
            } else if (block.source_rule === 'popular_buys') {
              query = query
                .in('listing_type', ['sale', 'both'])
                .order('view_count', { ascending: false })
                .order('created_at', { ascending: false });
            } else if (block.source_rule === 'featured') {
              query = query
                .eq('featured', true)
                .order('featured_sort_order', { ascending: true })
                .order('created_at', { ascending: false });
            } else {
              // 'newest'
              query = query.order('created_at', { ascending: false });
            }

            const { data: ruleProds } = await query.limit(block.item_limit || 10);
            if (ruleProds) {
              products = ruleProds as unknown as ProductWithImages[];
            }
          }

          blocksWithData.push({
            ...block,
            products,
          });
        } else {
          blocksWithData.push({ ...block });
        }
      }
    }
  } catch {
    blocksWithData = [];
  }

  // 5. Fallback for pre-Phase 42 or empty blocks
  const fallbackSections: HomepageSectionWithProducts[] = [];
  let fallbackFeatured: ProductWithImages[] = [];

  if (blocksWithData.length === 0) {
    try {
      const { data: rawSections } = await supabase
        .from('homepage_sections')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (rawSections && rawSections.length > 0) {
        for (const section of rawSections) {
          const { data: prods } = await supabase
            .from('products')
            .select(PUBLIC_PRODUCT_SELECT)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(section.item_limit || 8);

          fallbackSections.push({
            ...section,
            products: (prods || []) as unknown as ProductWithImages[],
          });
        }
      } else {
        const { data: prods } = await supabase
          .from('products')
          .select(PUBLIC_PRODUCT_SELECT)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(8);

        fallbackFeatured = (prods || []) as unknown as ProductWithImages[];
      }
    } catch {
      fallbackFeatured = [];
    }
  }

  return {
    themeSettings,
    banners,
    categories,
    blocks: blocksWithData,
    fallbackSections,
    fallbackFeatured,
  };
}

export default async function HomePage() {
  const {
    themeSettings,
    banners,
    categories,
    blocks,
    fallbackSections,
    fallbackFeatured,
  } = await getHomepageData();

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://www.blinkwear.in/#organization',
    name: 'BlinkWear',
    alternateName: ['Blink Wear', 'BlinkWear.in'],
    url: 'https://blinkwear.in',
    logo: {
      '@type': 'ImageObject',
      url: themeSettings.logo_url || 'https://blinkwear.in/icon.png',
      width: 512,
      height: 512,
    },
    description:
      'Pune and Bhopal premier fashion rental marketplace for designer bridal lehengas, groom sherwanis, tuxedos, and luxury gowns. 100% sanitized, doorstep delivery, free return pickup.',
    founder: {
      '@type': 'Person',
      '@id': 'https://www.blinkwear.in/founder/shubham-shrivastava#person',
      name: 'Shubham Shrivastava',
      jobTitle: 'Founder',
      url: 'https://www.blinkwear.in/founder/shubham-shrivastava',
    },
    email: 'support@blinkwear.in',
    telephone: '+917722958818',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Naveen Villa Sindhi Colony Bypass Road',
      addressLocality: 'Bina',
      addressRegion: 'Madhya Pradesh',
      postalCode: '470113',
      addressCountry: 'IN',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+917722958818',
        contactType: 'customer service',
        availableLanguage: ['English', 'Hindi'],
        hoursAvailable: 'Mo-Sa 10:00-20:00',
      },
      {
        '@type': 'ContactPoint',
        email: 'support@blinkwear.in',
        contactType: 'customer service',
      },
    ],
    sameAs: ['https://www.instagram.com/blinkwear.in'],
  };

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: 'BlinkWear — Fashion Platform Pune & Bhopal',
    alternateName: 'BlinkWear.in',
    url: 'https://blinkwear.in',
    logo: themeSettings.logo_url || 'https://blinkwear.in/icon.png',
    image: 'https://blinkwear.in/icon.png',
    description:
      'Rent designer bridal lehengas, groom sherwanis, tuxedos & luxury gowns in Pune and Bhopal. 100% sanitized, doorstep delivery & free return pickup.',
    telephone: '+917722958818',
    email: 'support@blinkwear.in',
    priceRange: '₹₹',
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash, UPI, Credit Card, Debit Card, Net Banking',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Pune & Bhopal',
      addressRegion: 'Maharashtra & Madhya Pradesh',
      addressCountry: 'IN',
    },
    areaServed: [
      {
        '@type': 'City',
        name: 'Pune',
        containedInPlace: { '@type': 'AdministrativeArea', name: 'Maharashtra' },
      },
      {
        '@type': 'City',
        name: 'Bhopal',
        containedInPlace: { '@type': 'AdministrativeArea', name: 'Madhya Pradesh' },
      },
    ],
  };

  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={localBusinessSchema} />

      <HomeFeedClient
        themeSettings={themeSettings}
        banners={banners}
        categories={categories}
        blocks={blocks}
        fallbackSections={fallbackSections}
        fallbackFeatured={fallbackFeatured}
      />
    </>
  );
}
