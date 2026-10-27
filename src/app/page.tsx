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

  // 2. Fetch active buyer banners safely (with multi-format video/photo & placement support)
  let banners: Banner[] = [];
  try {
    let { data: rawBanners, error: bError } = await supabase
      .from('banners')
      .select('id, title, subtitle, cta_label, image_url, mobile_image_url, media_type, video_url, mobile_video_url, placement, alt_text, panel, target_type, target_value, display_order, is_active, start_date, end_date, created_at, updated_at')
      .eq('panel', 'buyer')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    // Fallback to baseline columns if extended columns (placement, video_url) are not yet migrated
    if (bError) {
      const fallback = await supabase
        .from('banners')
        .select('id, title, subtitle, cta_label, image_url, panel, target_type, target_value, display_order, is_active, start_date, end_date, created_at, updated_at')
        .eq('panel', 'buyer')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      rawBanners = fallback.data as any;
      bError = fallback.error;
    }

    if (!bError && rawBanners) {
      const nowMs = Date.now();
      banners = (rawBanners as Banner[]).filter((b) => {
        if (b.start_date && new Date(b.start_date).getTime() > nowMs) return false;
        if (b.end_date && new Date(b.end_date).getTime() < nowMs) return false;
        return true;
      });
    }
  } catch (err) {
    console.error('Error fetching banners:', err);
    banners = [];
  }

  // 3. Fetch active categories for strip & grid (safe existing columns)
  let categories: Category[] = [];
  try {
    const { data: rawCategories, error: cError } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id, icon_url, sort_order, is_active, created_at')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (!cError && rawCategories) {
      // Prioritize top customer-facing rental categories for the strip:
      // Lehengas, Sarees, Dresses, Ethnic Wear, Western Wear, Men, Kids, Accessories, Footwear
      const prioritySlugs = [
        'lehengas',
        'sarees',
        'dresses',
        'ethnic-wear',
        'western-wear',
        'men',
        'kids',
        'accessories',
        'footwear',
        'kurta',
      ];
      const rawList = rawCategories as Category[];
      categories = rawList.slice().sort((a, b) => {
        const idxA = prioritySlugs.indexOf(a.slug);
        const idxB = prioritySlugs.indexOf(b.slug);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.sort_order - b.sort_order;
      });
    }
  } catch (err) {
    console.error('Error fetching categories:', err);
    categories = [];
  }

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
    geo: [
      {
        '@type': 'GeoCoordinates',
        latitude: 18.5204,
        longitude: 73.8567,
      },
      {
        '@type': 'GeoCoordinates',
        latitude: 23.2599,
        longitude: 77.4126,
      },
    ],
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

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://www.blinkwear.in/#website',
    name: 'BlinkWear',
    url: 'https://blinkwear.in',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://blinkwear.in/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const aeoFaqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Can I rent designer bridal lehengas and sherwanis in Pune and Bhopal?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! BlinkWear provides verified fashion rentals in Pune and Bhopal. You can rent authentic designer bridal lehengas, groom sherwanis, tuxedos, gowns, and ethnic party wear with doorstep delivery and reverse pickup.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are rented garments sanitized and clean on BlinkWear?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Every outfit on BlinkWear undergoes a 100% multi-stage sanitization, professional dry cleaning, and strict quality verification before being delivered in sealed garment packaging.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does delivery, return, and security deposit work on BlinkWear?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'BlinkWear delivers your outfit right to your doorstep before your event date. Once your rental duration concludes, a free return pickup is scheduled. Your security deposit is promptly refunded back to your source payment method following return inspection.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which areas in Pune and Bhopal does BlinkWear service?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'In Pune, BlinkWear delivers across Kothrud, Baner, Wakad, Hinjewadi, Viman Nagar, Koregaon Park, Aundh, Kalyani Nagar, Hadapsar, and Pimpri-Chinchwad. In Bhopal, service covers MP Nagar, Arera Colony, Kolar Road, Shahpura, TT Nagar, Hoshangabad Road, and surrounding neighborhoods.',
        },
      },
    ],
  };

  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={localBusinessSchema} />
      <JsonLd data={websiteSchema} />
      <JsonLd data={aeoFaqSchema} />

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
