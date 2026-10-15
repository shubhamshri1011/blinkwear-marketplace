'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle,
  MapPin,
  Share2,
  Copy,
  ExternalLink,
  Search,
  SlidersHorizontal,
  Package,
  Calendar,
  ShoppingBag,
  ArrowRight,
  ChevronDown,
  Check,
  Tag,
  Clock,
} from 'lucide-react';
import type { ProductWithImages, SellerPublicProfile } from '@/types/database';
import { formatCurrency } from '@/lib/utils';
import { getStoreUrl } from '@/lib/store';

interface SellerStoreViewProps {
  store: SellerPublicProfile;
  products: ProductWithImages[];
}

type TabType = 'all' | 'rent' | 'buy';
type SortType = 'newest' | 'price_low' | 'price_high';

export function SellerStoreView({ store, products }: SellerStoreViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [copiedLink, setCopiedLink] = useState(false);

  const storeSlug = store.store_slug || 'boutique';
  const storeUrl = getStoreUrl(storeSlug);

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(storeUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch (err) {
      console.error('Failed to copy store link:', err);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${store.store_name} on BlinkWear`,
          text: store.store_description || `Explore designer outfits for rent and purchase from ${store.store_name} on BlinkWear.`,
          url: storeUrl,
        });
      } catch {
        // User cancelled or share failed, fallback to copy
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  // Derive unique categories present in this seller's wardrobe
  const categories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; slug: string }>();
    products.forEach((p) => {
      if (p.category && p.category.name) {
        map.set(p.category.slug || p.category.name, {
          id: p.category.id,
          name: p.category.name,
          slug: p.category.slug || p.category.name,
        });
      }
    });
    return Array.from(map.values());
  }, [products]);

  // Counts for tabs
  const rentalCount = useMemo(
    () => products.filter((p) => p.listing_type === 'rent' || p.listing_type === 'both').length,
    [products]
  );
  const buyCount = useMemo(
    () => products.filter((p) => p.listing_type === 'sale' || p.listing_type === 'both').length,
    [products]
  );

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Tab filter
        if (activeTab === 'rent' && p.listing_type !== 'rent' && p.listing_type !== 'both') {
          return false;
        }
        if (activeTab === 'buy' && p.listing_type !== 'sale' && p.listing_type !== 'both') {
          return false;
        }

        // Category filter
        if (selectedCategory !== 'all') {
          const catSlug = p.category?.slug || p.category?.name;
          if (catSlug !== selectedCategory) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchBrand = (p.brand || '').toLowerCase().includes(q);
          const matchDesc = (p.description || '').toLowerCase().includes(q);
          const matchColor = (p.color || '').toLowerCase().includes(q);
          if (!matchTitle && !matchBrand && !matchDesc && !matchColor) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_low') {
          const priceA = a.rent_price_per_day || a.sale_price || 0;
          const priceB = b.rent_price_per_day || b.sale_price || 0;
          return priceA - priceB;
        }
        if (sortBy === 'price_high') {
          const priceA = a.rent_price_per_day || a.sale_price || 0;
          const priceB = b.rent_price_per_day || b.sale_price || 0;
          return priceB - priceA;
        }
        // Default newest
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [products, activeTab, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-neutral-50/50 pb-20">
      {/* Mini-Store Subdomain Top Announcement */}
      <div className="bg-emerald-950 text-emerald-200 px-4 py-2 text-xs border-b border-emerald-900/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-medium text-emerald-300">
              Official Boutique Mini-Store of{' '}
              <strong className="text-white font-bold">{store.store_name}</strong>
            </span>
            <span className="text-emerald-500 hidden sm:inline">•</span>
            <span className="hidden sm:inline text-emerald-400/90">
              Powered by BlinkWear Fashion Network
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="https://blinkwear.in"
              className="text-[11px] font-semibold text-emerald-300 hover:text-white underline transition-colors"
            >
              Main Marketplace ↗
            </Link>
          </div>
        </div>
      </div>

      {/* Store Header & Hero Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="relative rounded-3xl overflow-hidden bg-neutral-900 shadow-md border border-neutral-200/60">
          {/* Banner Image or Luxury Gradient */}
          <div className="relative h-48 sm:h-64 lg:h-72 w-full bg-linear-to-r from-emerald-950 via-neutral-950 to-neutral-900 overflow-hidden">
            {store.banner_url ? (
              <Image
                src={store.banner_url}
                alt={`${store.store_name} Banner`}
                fill
                priority
                className="object-cover opacity-75"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/40 via-neutral-950/80 to-black">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
          </div>

          {/* Store Profile Info Overlay */}
          <div className="relative px-6 sm:px-10 pb-8 -mt-16 sm:-mt-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              {/* Logo & Identity */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-white p-1.5 shadow-xl border-2 border-white/80 shrink-0">
                  <div className="w-full h-full rounded-xl sm:rounded-2xl overflow-hidden bg-emerald-50 flex items-center justify-center relative">
                    {store.logo_url ? (
                      <Image
                        src={store.logo_url}
                        alt={store.store_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="font-serif text-3xl font-extrabold text-emerald-900">
                        {store.store_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-white">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-xs">
                      {store.store_name}
                    </h1>
                    {store.is_verified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-950 bg-emerald-400 px-2.5 py-0.5 rounded-full shadow-xs">
                        <CheckCircle className="w-3.5 h-3.5" /> Verified Partner
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300">
                    {store.city && (
                      <span className="flex items-center gap-1 text-neutral-300">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {store.city}, India
                      </span>
                    )}
                    <span className="text-neutral-500">•</span>
                    <span className="text-neutral-300">
                      {products.length} Curated {products.length === 1 ? 'Outfit' : 'Outfits'}
                    </span>
                    <span className="text-neutral-500">•</span>
                    <span className="text-emerald-300 font-mono text-[11px]">
                      {storeSlug}.blinkwear.in
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/15"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Store Link!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Link
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share Boutique
                </button>
              </div>
            </div>

            {/* Store Description / Bio */}
            {store.store_description && (
              <p className="mt-5 text-xs sm:text-sm text-neutral-300 max-w-3xl leading-relaxed">
                {store.store_description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Wardrobe Collection Showcase */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Navigation & Controls */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200/80 shadow-2xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Type Filter Tabs: All / Rentals / Buy */}
            <div className="flex items-center gap-1.5 p-1 bg-neutral-100/90 rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'all'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                All Outfits ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('rent')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'rent'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Rentals ({rentalCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('buy')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'buy'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Buy Pre-Loved ({buyCount})
              </button>
            </div>

            {/* Search & Sort Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Bar */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={`Search ${store.store_name}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs rounded-full pl-9 pr-4 py-2.5 focus:outline-hidden focus:border-neutral-900 focus:bg-white transition-all"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  aria-label="Sort products"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                  className="w-full sm:w-auto appearance-none bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs font-medium rounded-full pl-4 pr-9 py-2.5 focus:outline-hidden focus:border-neutral-900 cursor-pointer"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Category Filter Pills (if multiple categories available) */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 shrink-0 mr-1">
                Categories:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat.slug
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((p) => {
              const primaryImage =
                p.product_images && p.product_images.length > 0
                  ? p.product_images.sort((a, b) => a.sort_order - b.sort_order)[0]?.image_url
                  : null;

              const isRent = p.listing_type === 'rent' || p.listing_type === 'both';
              const isSale = p.listing_type === 'sale' || p.listing_type === 'both';

              return (
                <div
                  key={p.id}
                  className="group bg-white rounded-3xl border border-neutral-200/80 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Image Area */}
                    <div className="relative aspect-3/4 w-full bg-neutral-100 overflow-hidden">
                      {primaryImage ? (
                        <Image
                          src={primaryImage}
                          alt={p.title}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-300">
                          <Package className="w-12 h-12 stroke-[1.5]" />
                        </div>
                      )}

                      {/* Listing Type Tag Badge */}
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                        {p.listing_type === 'both' ? (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-900/90 text-emerald-200 backdrop-blur-xs px-2.5 py-0.5 rounded-full shadow-xs">
                            Rent & Buy
                          </span>
                        ) : p.listing_type === 'rent' ? (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-800/90 text-white backdrop-blur-xs px-2.5 py-0.5 rounded-full shadow-xs">
                            Rent Only
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-neutral-900/90 text-white backdrop-blur-xs px-2.5 py-0.5 rounded-full shadow-xs">
                            Buy Only
                          </span>
                        )}

                        {p.condition && (
                          <span className="text-[9px] font-semibold bg-white/90 text-neutral-700 backdrop-blur-xs px-2 py-0.5 rounded-full w-fit capitalize">
                            {p.condition.replace('_', ' ')}
                          </span>
                        )}
                      </div>

                      {/* Size Badge */}
                      {p.size && (
                        <div className="absolute bottom-2.5 right-2.5">
                          <span className="text-[10px] font-bold bg-neutral-950/80 text-white backdrop-blur-xs px-2 py-0.5 rounded-md">
                            Size: {p.size}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-2">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block truncate">
                          {p.brand || store.store_name}
                        </span>
                        <Link
                          href={`/products/${p.id}`}
                          className="font-serif font-bold text-sm text-neutral-900 line-clamp-1 hover:text-emerald-700 transition-colors"
                        >
                          {p.title}
                        </Link>
                      </div>

                      {/* Pricing Section */}
                      <div className="pt-1 space-y-1">
                        {isRent && (
                          <div className="flex items-baseline justify-between text-xs">
                            <span className="text-neutral-500 font-medium">Rent:</span>
                            <div className="text-right">
                              <span className="font-extrabold text-emerald-800">
                                {formatCurrency(p.rent_price_per_day || 0)}
                              </span>
                              <span className="text-[10px] text-neutral-400">/day</span>
                            </div>
                          </div>
                        )}

                        {isSale && (
                          <div className="flex items-baseline justify-between text-xs">
                            <span className="text-neutral-500 font-medium">Buy:</span>
                            <div className="text-right flex items-center gap-1.5 justify-end">
                              {p.discount_price && p.discount_price < (p.sale_price || 0) && (
                                <span className="text-[11px] text-neutral-400 line-through">
                                  {formatCurrency(p.sale_price || 0)}
                                </span>
                              )}
                              <span className="font-extrabold text-neutral-900">
                                {formatCurrency(p.discount_price || p.sale_price || 0)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="p-4 pt-0">
                    <Link
                      href={`/products/${p.id}`}
                      className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>{isRent ? 'Rent / View Outfit' : 'Buy Outfit'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-neutral-200 p-12 text-center space-y-4 shadow-2xs">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-neutral-900">
                No outfits found matching your filters
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                {searchQuery
                  ? `No items found matching "${searchQuery}". Try clearing your search.`
                  : 'This boutique does not currently have outfits listed in this filter category.'}
              </p>
            </div>
            {(searchQuery || selectedCategory !== 'all' || activeTab !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setActiveTab('all');
                }}
                className="px-5 py-2 rounded-full bg-neutral-900 text-white text-xs font-bold inline-block hover:bg-neutral-800 transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}

        {/* Quality & Delivery Assurance Footer */}
        <div className="bg-emerald-50 border border-emerald-100/80 rounded-3xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-xs text-neutral-900">Verified Seller Partner</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {store.store_name} is an authenticated boutique operating in {store.city || 'India'} on the BlinkWear platform.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-xs text-neutral-900">Sanitized & Steam Pressed</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Every rental garment is professionally cleaned, sanitized, and steam-pressed prior to doorstep delivery.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-xs text-neutral-900">Doorstep Return Pickup</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Enjoy free doorstep delivery and post-event return pickup handled by the BlinkWear logistics network.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
