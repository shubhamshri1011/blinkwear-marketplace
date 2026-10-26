'use client';

import React from 'react';
import { useCity } from '@/context/CityContext';
import type {
  Banner,
  Category,
  HomepageBlock,
  HomepageSectionWithProducts,
  ProductWithImages,
  SiteThemeSettings,
} from '@/types/database';
import { HeroBannerSlider } from './HeroBannerSlider';
import { TopStripBanner } from './TopStripBanner';
import { MidTilesBanner } from './MidTilesBanner';
import { ProductRowBlock } from './ProductRowBlock';
import { CategoryTilesBlock } from './CategoryTilesBlock';
import { OccasionTilesBlock } from './OccasionTilesBlock';
import { BannerGroupBlock } from './BannerGroupBlock';
import { TrustStripBlock } from './TrustStripBlock';
import { SellerCtaBlock } from './SellerCtaBlock';
import { DynamicSectionRenderer } from './DynamicSectionRenderer';

export type BlockWithProducts = HomepageBlock & {
  products?: ProductWithImages[];
};

interface HomeFeedClientProps {
  themeSettings: SiteThemeSettings;
  banners: Banner[];
  categories: Category[];
  blocks: BlockWithProducts[];
  fallbackSections: HomepageSectionWithProducts[];
  fallbackFeatured: ProductWithImages[];
}

export function HomeFeedClient({
  themeSettings,
  banners,
  categories,
  blocks,
  fallbackSections,
  fallbackFeatured,
}: HomeFeedClientProps) {
  const { selectedCity } = useCity();

  // Partition banners by placement
  const heroBanners = banners.filter(
    (b) => b.placement === 'hero_carousel' || !b.placement
  );
  const topStripBanners = banners.filter((b) => b.placement === 'top_strip');
  const midTilesBanners = banners.filter((b) => b.placement === 'mid_tiles');

  const hasModernBlocks = blocks && blocks.length > 0;
  const hasTrustStripInBlocks = hasModernBlocks && blocks.some((b) => b.block_type === 'trust_strip');

  return (
    <div className="w-full pb-16 md:pb-12">
      {/* 1. Optional Top Strip Banner */}
      {topStripBanners.length > 0 && <TopStripBanner banners={topStripBanners} />}

      {/* 2. Hero Carousel */}
      <HeroBannerSlider banners={heroBanners} />

      {/* 3. Mid Tiles Banners (if any exist) */}
      {midTilesBanners.length > 0 && <MidTilesBanner banners={midTilesBanners} />}

      {/* 4. Homepage Blocks Engine */}
      {hasModernBlocks ? (
        blocks.map((block) => {
          // Check city targeting: skip if not 'all' and not matching visitor city
          if (
            block.city_filter &&
            block.city_filter !== 'all' &&
            block.city_filter.trim().toLowerCase() !== selectedCity.trim().toLowerCase()
          ) {
            return null;
          }

          switch (block.block_type) {
            case 'product_row': {
              const allProds = block.products || [];
              const cityProds = allProds.filter(
                (p) =>
                  !p.city ||
                  p.city.trim().toLowerCase() === selectedCity.trim().toLowerCase() ||
                  p.city.trim().toLowerCase() === 'both'
              );
              return (
                <ProductRowBlock
                  key={block.id}
                  block={block}
                  products={cityProds}
                  selectedCity={selectedCity}
                />
              );
            }
            case 'category_tiles':
              return (
                <CategoryTilesBlock
                  key={block.id}
                  block={block}
                  categories={categories}
                />
              );
            case 'occasion_tiles':
              return <OccasionTilesBlock key={block.id} block={block} />;
            case 'banner_group':
              return (
                <BannerGroupBlock
                  key={block.id}
                  block={block}
                  banners={banners}
                />
              );
            case 'trust_strip':
              return (
                <TrustStripBlock
                  key={block.id}
                  badges={themeSettings.trust_badges}
                  title={block.title}
                  subtitle={block.subtitle}
                />
              );
            case 'seller_cta':
              return <SellerCtaBlock key={block.id} block={block} />;
            default:
              return null;
          }
        })
      ) : (
        /* Fallback: If homepage_blocks table is empty or missing (pre-phase42), use legacy layout */
        <div className="mt-8 space-y-12">
          {fallbackSections && fallbackSections.length > 0 ? (
            fallbackSections.map((section) => (
              <DynamicSectionRenderer
                key={section.id}
                section={section}
              />
            ))
          ) : fallbackFeatured && fallbackFeatured.length > 0 ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="font-serif text-2xl font-bold text-neutral-950 mb-4">
                Trending Designer Wear in {selectedCity}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {fallbackFeatured.map((prod) => (
                  <ProductRowBlock
                    key={prod.id}
                    block={{
                      id: 'fallback-featured',
                      block_type: 'product_row',
                      title: 'Trending Outfits',
                      subtitle: null,
                      view_all_href: '/products?type=rent',
                      source_type: 'rule',
                      source_rule: 'trending_rentals',
                      category_id: null,
                      curated_product_ids: [],
                      banner_ids: [],
                      item_limit: 8,
                      city_filter: 'all',
                      sort_order: 1,
                      is_active: true,
                      start_at: null,
                      end_at: null,
                      created_at: '',
                      updated_at: '',
                    }}
                    products={fallbackFeatured}
                    selectedCity={selectedCity}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* 5. Verified Trust Strip (if not already included as an active block) */}
      {!hasTrustStripInBlocks && (
        <TrustStripBlock
          badges={themeSettings.trust_badges}
          title="Why BlinkWear"
          subtitle="Pune &amp; Bhopal's Trusted Luxury Fashion Rental &amp; Resale Platform"
        />
      )}
    </div>
  );
}
