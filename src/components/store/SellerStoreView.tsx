'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  CheckCircle,
  MapPin,
  Share2,
  Copy,
  Search,
  Package,
  ShoppingBag,
  ArrowRight,
  ChevronDown,
  Check,
  Clock,
  Phone,
  AtSign,
  ChevronRight,
  Shirt,
  Truck,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Heart,
  MessageCircle,
  Tag,
  Filter,
} from 'lucide-react';
import type { ProductWithImages, SellerPublicProfile } from '@/types/database';
import { formatCurrency } from '@/lib/utils';
import { getStoreUrl } from '@/lib/store';

// ─── Config ───────────────────────────────────────────────────────────────────
const DIWALI_ENABLED = true;

// ─── Palette map ──────────────────────────────────────────────────────────────
const PALETTE: Record<string, { primary: string; light: string; dark: string; text: string }> = {
  emerald: { primary: '#059669', light: '#d1fae5', dark: '#064e3b', text: '#fff' },
  rose:    { primary: '#e11d48', light: '#ffe4e6', dark: '#881337', text: '#fff' },
  violet:  { primary: '#7c3aed', light: '#ede9fe', dark: '#2e1065', text: '#fff' },
  amber:   { primary: '#d97706', light: '#fef3c7', dark: '#78350f', text: '#fff' },
  sky:     { primary: '#0284c7', light: '#e0f2fe', dark: '#0c4a6e', text: '#fff' },
  fuchsia: { primary: '#a21caf', light: '#fae8ff', dark: '#4a044e', text: '#fff' },
  gold:    { primary: '#b7791f', light: '#fef9c3', dark: '#78350f', text: '#fff' },
  maroon:  { primary: '#881337', light: '#ffe4e6', dark: '#4c0519', text: '#fff' },
};

function usePalette(accent?: string | null) {
  return PALETTE[accent || 'emerald'] ?? PALETTE.emerald;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type TabType = 'all' | 'rent' | 'buy';
type SortType = 'newest' | 'price_low' | 'price_high';

interface SellerStoreViewProps {
  store: SellerPublicProfile;
  products: ProductWithImages[];
  reviews?: Array<{ id: string; rating: number; comment: string; reviewer_name: string }>;
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-neutral-100 animate-pulse">
      <div className="aspect-3/4 bg-neutral-100" />
      <div className="p-4 space-y-2">
        <div className="h-2.5 bg-neutral-100 rounded-full w-2/3" />
        <div className="h-3.5 bg-neutral-100 rounded-full" />
        <div className="h-2.5 bg-neutral-100 rounded-full w-1/2" />
      </div>
    </div>
  );
}

// ─── How-It-Works steps ───────────────────────────────────────────────────────
const HOW_STEPS = [
  { icon: Search, label: 'Browse', desc: 'Find the perfect outfit from this boutique' },
  { icon: ShoppingBag, label: 'Book', desc: 'Choose your rental dates and checkout via Cashfree' },
  { icon: Truck, label: 'Delivered', desc: 'Doorstep delivery, sanitized & steam-pressed' },
  { icon: Heart, label: 'Wear', desc: 'Make an unforgettable entrance at your event' },
  { icon: RotateCcw, label: 'Return', desc: 'Free doorstep reverse pickup by our courier' },
];

// ─── Store header ─────────────────────────────────────────────────────────────
function StoreHeader({
  store,
  pal,
  onShare,
  onCopy,
  copied,
}: {
  store: SellerPublicProfile;
  pal: ReturnType<typeof usePalette>;
  storeUrl: string;
  onShare: () => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const initials = store.store_name.charAt(0).toUpperCase();
  const isDiwali = DIWALI_ENABLED && store.diwali_theme;

  return (
    <header className="bg-neutral-950 sticky top-0 z-50 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Logo + Name */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-8 h-8 rounded-lg overflow-hidden relative shrink-0 flex items-center justify-center"
            style={{ backgroundColor: `${pal.primary}22` }}
          >
            {store.logo_url ? (
              <Image src={store.logo_url} alt={store.store_name} fill className="object-cover" sizes="40px" />
            ) : (
              <span className="text-sm font-bold font-serif" style={{ color: pal.primary }}>{initials}</span>
            )}
          </div>
          <span className="font-serif font-bold text-sm text-white truncate">
            {store.store_name}
          </span>
          {store.is_verified && (
            <span title="Verified BlinkWear Boutique">
              <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: pal.primary }} />
            </span>
          )}
        </div>

        {/* Anchor nav — desktop */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-neutral-400">
          {[
            { href: '#collection', label: 'Collection' },
            ...(store.show_about ? [{ href: '#about', label: 'About' }] : []),
            ...(store.show_how_it_works ? [{ href: '#how', label: 'How It Works' }] : []),
            ...(store.show_contact ? [{ href: '#contact', label: 'Contact' }] : []),
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hover:text-white transition-colors hover:underline underline-offset-4"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isDiwali && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-900/30 px-2.5 py-1 rounded-full border border-amber-700/40">
              🪔 Diwali Special
            </span>
          )}
          <button
            type="button"
            onClick={onCopy}
            className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Copy store link"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onShare}
            className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Share this boutique"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection({
  store,
  pal,
  productCount,
}: {
  store: SellerPublicProfile;
  pal: ReturnType<typeof usePalette>;
  productCount: number;
}) {
  const isDiwali = DIWALI_ENABLED && store.diwali_theme;
  const initials = store.store_name.charAt(0).toUpperCase();

  return (
    <section className="relative min-h-[50vh] sm:min-h-[60vh] flex flex-col justify-end overflow-hidden">
      {/* Banner */}
      <div className="absolute inset-0">
        {store.banner_url ? (
          <Image
            src={store.banner_url}
            alt={store.store_name}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div
            className="w-full h-full relative"
            style={{
              background: isDiwali
                ? 'linear-gradient(135deg, #450a0a 0%, #78350f 45%, #18181b 100%)'
                : `linear-gradient(135deg, ${pal.dark} 0%, #111827 60%, #030712 100%)`,
            }}
          >
            <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
            {isDiwali && (
              <div className="absolute top-8 right-12 text-5xl opacity-20 rotate-12 select-none">🪔</div>
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-neutral-950/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-20 sm:pt-24 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end gap-6">
          {/* Logo */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-1.5 shadow-2xl shrink-0 border-2 border-white/30 relative">
            <div
              className="w-full h-full rounded-xl overflow-hidden relative flex items-center justify-center"
              style={{ backgroundColor: `${pal.primary}15` }}
            >
              {store.logo_url ? (
                <Image src={store.logo_url} alt={store.store_name} fill className="object-cover" sizes="100px" />
              ) : (
                <span className="font-serif text-3xl font-extrabold" style={{ color: pal.primary }}>{initials}</span>
              )}
            </div>
          </div>

          <div className="space-y-2 text-white flex-1">
            {/* Verified badge — ONLY shown if store.is_verified === true */}
            {store.is_verified && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm"
                style={{ backgroundColor: pal.primary, color: '#fff' }}
              >
                <CheckCircle className="w-3 h-3" /> Verified BlinkWear Boutique
              </span>
            )}

            <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight drop-shadow-sm">
              {store.store_name}
            </h1>

            {store.tagline && (
              <p className="text-sm sm:text-base text-neutral-300 italic">{store.tagline}</p>
            )}

            {/* Speciality tags */}
            {store.speciality_tags && store.speciality_tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {store.speciality_tags.filter(Boolean).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-white/90"
                  >
                    <Tag className="w-2.5 h-2.5 opacity-70" /> {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 pt-1">
              {store.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" style={{ color: pal.primary }} />
                  {store.city}, India
                </span>
              )}
              {store.store_hours && (
                <>
                  <span className="text-neutral-600">•</span>
                  <span className="flex items-center gap-1 text-neutral-300">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" /> {store.store_hours}
                  </span>
                </>
              )}
              {productCount > 0 && (
                <>
                  <span className="text-neutral-600">•</span>
                  <span>{productCount} curated {productCount === 1 ? 'outfit' : 'outfits'}</span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-3">
              <a
                href="#collection"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm shadow-lg transition-all hover:scale-105"
                style={{ backgroundColor: pal.primary, color: '#fff' }}
              >
                Browse Collection <ArrowRight className="w-4 h-4" />
              </a>
              {store.show_contact && store.whatsapp_number && (
                <a
                  href={`https://wa.me/${store.whatsapp_number.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all"
                >
                  <MessageCircle className="w-4 h-4 text-green-400" /> WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Collection Section ───────────────────────────────────────────────────────
function CollectionSection({
  store,
  products,
  pal,
}: {
  store: SellerPublicProfile;
  products: ProductWithImages[];
  pal: ReturnType<typeof usePalette>;
}) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('newest');

  // Compute available sizes across this seller's products
  const availableSizes = useMemo(() => {
    const sizeSet = new Set<string>();
    products.forEach((p) => {
      if (p.size) {
        p.size.split(',').forEach((s) => {
          const trimmed = s.trim();
          if (trimmed) sizeSet.add(trimmed);
        });
      }
    });
    return Array.from(sizeSet).sort();
  }, [products]);

  const rentalCount = useMemo(
    () => products.filter((p) => p.listing_type === 'rent' || p.listing_type === 'both').length,
    [products]
  );
  const buyCount = useMemo(
    () => products.filter((p) => p.listing_type === 'sale' || p.listing_type === 'both').length,
    [products]
  );

  const categories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; slug: string }>();
    products.forEach((p) => {
      if (p.category?.name) {
        map.set(p.category.slug || p.category.name, {
          id: p.category.id,
          name: p.category.name,
          slug: p.category.slug || p.category.name,
        });
      }
    });
    return Array.from(map.values());
  }, [products]);

  // Strict in-store filtering limited to THIS seller's products
  const filtered = useMemo(() => {
    return products
      .filter((p) => {
        // Tab (Rent vs Buy)
        if (activeTab === 'rent' && p.listing_type !== 'rent' && p.listing_type !== 'both') return false;
        if (activeTab === 'buy' && p.listing_type !== 'sale' && p.listing_type !== 'both') return false;

        // Category
        if (selectedCategory !== 'all') {
          const cs = p.category?.slug || p.category?.name;
          if (cs !== selectedCategory) return false;
        }

        // Price Filter
        const price = p.rent_price_per_day || p.sale_price || 0;
        if (priceRange === 'under_1500' && price >= 1500) return false;
        if (priceRange === '1500_3000' && (price < 1500 || price > 3000)) return false;
        if (priceRange === '3000_5000' && (price < 3000 || price > 5000)) return false;
        if (priceRange === 'above_5000' && price <= 5000) return false;

        // Size Filter
        if (selectedSize !== 'all') {
          const productSizes = (p.size || '').split(',').map((s) => s.trim().toLowerCase());
          if (!productSizes.includes(selectedSize.toLowerCase())) return false;
        }

        // Search Query (only within this seller's products)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = p.title.toLowerCase().includes(q);
          const matchesBrand = (p.brand || '').toLowerCase().includes(q);
          const matchesDesc = (p.description || '').toLowerCase().includes(q);
          const matchesColor = (p.color || '').toLowerCase().includes(q);
          const matchesTags = (p.search_tags || []).some((t) => t.toLowerCase().includes(q));
          if (!matchesTitle && !matchesBrand && !matchesDesc && !matchesColor && !matchesTags) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_low') {
          return (a.rent_price_per_day || a.sale_price || 0) - (b.rent_price_per_day || b.sale_price || 0);
        }
        if (sortBy === 'price_high') {
          return (b.rent_price_per_day || b.sale_price || 0) - (a.rent_price_per_day || a.sale_price || 0);
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [products, activeTab, selectedCategory, priceRange, selectedSize, searchQuery, sortBy]);

  const TABS = [
    { id: 'all' as const, label: `All (${products.length})` },
    { id: 'rent' as const, label: `Rent (${rentalCount})` },
    { id: 'buy' as const, label: `Buy (${buyCount})` },
  ];

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    priceRange !== 'all' ||
    selectedSize !== 'all' ||
    searchQuery.trim().length > 0 ||
    activeTab !== 'all';

  const resetFilters = () => {
    setActiveTab('all');
    setSelectedCategory('all');
    setPriceRange('all');
    setSelectedSize('all');
    setSearchQuery('');
  };

  // Empty state when store has zero products published
  if (products.length === 0) {
    return (
      <section id="collection" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-6 max-w-lg mx-auto">
          <div
            className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-sm"
            style={{ backgroundColor: pal.light }}
          >
            👗
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-neutral-900">Collection Coming Soon</h2>
            <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
              {store.store_name} is currently handpicking and photographing their designer collection.
              Follow on WhatsApp or Instagram to be the first to book!
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {store.show_contact && store.whatsapp_number && (
              <a
                href={`https://wa.me/${store.whatsapp_number.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all hover:scale-105"
                style={{ backgroundColor: pal.primary }}
              >
                <MessageCircle className="w-4 h-4" /> Message Boutique
              </a>
            )}
            {store.show_contact && store.instagram_handle && (
              <a
                href={`https://instagram.com/${store.instagram_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-all"
              >
                <AtSign className="w-4 h-4" /> @{store.instagram_handle}
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="collection" className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Section header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: pal.primary }}>
              The Collection
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900">
              Curated Wardrobe
            </h2>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-4 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Tabs (All / Rent / Buy) */}
            <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl w-fit">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === t.id
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Filter controls row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* In-store Search */}
              <div className="relative flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={`Search in ${store.store_name}…`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs rounded-full pl-8 pr-4 py-2 w-full sm:w-48 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all"
                />
              </div>

              {/* Price Filter */}
              <div className="relative">
                <select
                  aria-label="Filter by price"
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="appearance-none bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs font-medium rounded-full pl-3.5 pr-8 py-2 focus:outline-none focus:border-neutral-900 cursor-pointer"
                >
                  <option value="all">All Prices</option>
                  <option value="under_1500">Under ₹1,500</option>
                  <option value="1500_3000">₹1,500 – ₹3,000</option>
                  <option value="3000_5000">₹3,000 – ₹5,000</option>
                  <option value="above_5000">₹5,000+</option>
                </select>
                <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Size Filter */}
              {availableSizes.length > 0 && (
                <div className="relative">
                  <select
                    aria-label="Filter by size"
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="appearance-none bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs font-medium rounded-full pl-3.5 pr-8 py-2 focus:outline-none focus:border-neutral-900 cursor-pointer"
                  >
                    <option value="all">All Sizes</option>
                    {availableSizes.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}

              {/* Sort By */}
              <div className="relative">
                <select
                  aria-label="Sort products"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                  className="appearance-none bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs font-medium rounded-full pl-3.5 pr-8 py-2 focus:outline-none focus:border-neutral-900 cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
                <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Category pills */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                  selectedCategory === 'all' ? 'text-white shadow-xs' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
                style={selectedCategory === 'all' ? { backgroundColor: pal.primary } : {}}
              >
                All Categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.slug)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                    selectedCategory === c.slug ? 'text-white shadow-xs' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                  style={selectedCategory === c.slug ? { backgroundColor: pal.primary } : {}}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Products Grid or Empty Result State */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-4 bg-neutral-50 rounded-3xl border border-neutral-200 p-8">
            <Package className="w-10 h-10 text-neutral-400 mx-auto" />
            <div>
              <h3 className="font-serif text-lg font-bold text-neutral-900">No matching outfits found</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                No outfits match your chosen category, price range, size, or search terms in {store.store_name}.
              </p>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="px-5 py-2 rounded-full text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
              style={{ backgroundColor: pal.primary }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} pal={pal} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, pal }: { product: ProductWithImages; pal: ReturnType<typeof usePalette> }) {
  const images = (product.product_images || []).sort((a, b) => a.sort_order - b.sort_order);
  const primaryImage = images[0]?.image_url;
  const isRent = product.listing_type === 'rent' || product.listing_type === 'both';
  const isSale = product.listing_type === 'sale' || product.listing_type === 'both';

  return (
    <Link
      href={`/products/${product.id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-neutral-200 hover:border-neutral-300 shadow-xs hover:shadow-lg transition-all flex flex-col"
    >
      {/* Image container */}
      <div className="relative aspect-3/4 w-full bg-neutral-100 overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.title}
            fill
            className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
            <Shirt className="w-8 h-8" />
          </div>
        )}

        {/* Listing badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {isRent && (
            <span
              className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs text-white"
              style={{ backgroundColor: pal.primary }}
            >
              Rent
            </span>
          )}
          {isSale && !isRent && (
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs bg-neutral-900 text-white">
              Buy
            </span>
          )}
        </div>

        {product.condition && (
          <span className="absolute bottom-2.5 left-2.5 text-[9px] font-semibold capitalize bg-white/90 backdrop-blur-xs text-neutral-700 px-2 py-0.5 rounded-md">
            {product.condition.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
        <div>
          {product.brand && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 truncate">
              {product.brand}
            </p>
          )}
          <h3 className="font-semibold text-xs sm:text-sm text-neutral-900 line-clamp-2 leading-snug group-hover:underline">
            {product.title}
          </h3>
        </div>

        {/* Price display */}
        <div className="pt-1.5 border-t border-neutral-100">
          {isRent && product.rent_price_per_day ? (
            <div>
              <span className="text-xs text-neutral-400 font-medium">Rent from </span>
              <span className="font-serif font-bold text-sm sm:text-base text-neutral-950">
                {formatCurrency(product.rent_price_per_day)}
              </span>
              <span className="text-[10px] text-neutral-400 font-medium">/day</span>
            </div>
          ) : product.sale_price ? (
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif font-bold text-sm sm:text-base text-neutral-950">
                {formatCurrency(product.discount_price || product.sale_price)}
              </span>
              {product.discount_price && product.sale_price > product.discount_price && (
                <span className="text-[10px] text-neutral-400 line-through">
                  {formatCurrency(product.sale_price)}
                </span>
              )}
            </div>
          ) : null}

          {product.size && (
            <p className="text-[10px] text-neutral-500 font-medium pt-0.5">
              Size: {product.size}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── About Section ───────────────────────────────────────────────────────────
function AboutSection({ store, pal }: { store: SellerPublicProfile; pal: ReturnType<typeof usePalette> }) {
  const tags = store.speciality_tags?.filter(Boolean) || [];
  return (
    <section id="about" className="py-12 sm:py-16 bg-neutral-50/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: pal.primary }}>
            The Story
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 mb-4">
            About {store.store_name}
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed whitespace-pre-line">
            {store.store_description}
          </p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold"
                  style={{ backgroundColor: pal.light, color: pal.dark }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works Section ─────────────────────────────────────────────────────
function HowItWorksSection({ pal }: { pal: ReturnType<typeof usePalette> }) {
  return (
    <section id="how" className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: pal.primary }}>
            Seamless Experience
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900">
            How Renting Works
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {HOW_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="text-center space-y-3">
                <div
                  className="relative mx-auto w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: pal.light }}
                >
                  <Icon className="w-6 h-6" style={{ color: pal.primary }} />
                  <span
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center text-white shadow"
                    style={{ backgroundColor: pal.primary }}
                  >
                    {i + 1}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-xs text-neutral-900">{step.label}</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust pills */}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {[
            { icon: ShieldCheck, label: 'Cashfree Secured Payments' },
            { icon: Sparkles, label: 'Sanitized & Steam Pressed' },
            { icon: Truck, label: 'Doorstep Delivery' },
            { icon: RotateCcw, label: 'Free Reverse Pickup' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 bg-white border border-neutral-200 rounded-full px-4 py-2 text-xs font-semibold text-neutral-700 shadow-xs">
              <Icon className="w-3.5 h-3.5" style={{ color: pal.primary }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Contact Section ──────────────────────────────────────────────────────────
function ContactSection({ store, pal }: { store: SellerPublicProfile; pal: ReturnType<typeof usePalette> }) {
  return (
    <section id="contact" className="py-12 sm:py-16 bg-neutral-50/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: pal.primary }}>
            Get in touch
          </p>
          <h2 className="font-serif text-2xl font-bold text-neutral-900 mb-6">
            Contact & Boutique Location
          </h2>
          <div className="space-y-4">
            {store.city && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: pal.light }}>
                  <MapPin className="w-4 h-4" style={{ color: pal.primary }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Location</p>
                  <p className="text-sm font-semibold text-neutral-900">{store.city}, India</p>
                </div>
              </div>
            )}
            {store.whatsapp_number && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: pal.light }}>
                  <Phone className="w-4 h-4" style={{ color: pal.primary }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">WhatsApp</p>
                  <a
                    href={`https://wa.me/${store.whatsapp_number.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold hover:underline"
                    style={{ color: pal.primary }}
                  >
                    {store.whatsapp_number}
                  </a>
                </div>
              </div>
            )}
            {store.instagram_handle && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: pal.light }}>
                  <AtSign className="w-4 h-4" style={{ color: pal.primary }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Instagram</p>
                  <a
                    href={`https://instagram.com/${store.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold hover:underline"
                    style={{ color: pal.primary }}
                  >
                    @{store.instagram_handle}
                  </a>
                </div>
              </div>
            )}
            {store.store_hours && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: pal.light }}>
                  <Clock className="w-4 h-4" style={{ color: pal.primary }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Store Hours</p>
                  <p className="text-sm font-semibold text-neutral-900">{store.store_hours}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function StoreFooter({ store }: { store: SellerPublicProfile; pal: ReturnType<typeof usePalette> }) {
  return (
    <footer className="bg-neutral-950 text-neutral-500 py-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <p>
          <span className="font-serif text-neutral-300 font-semibold">{store.store_name}</span>
          {store.city && <> · {store.city}</>}
        </p>
        <Link
          href="https://blinkwear.in"
          className="hover:text-neutral-300 transition-colors underline underline-offset-4"
        >
          Powered by BlinkWear ↗
        </Link>
      </div>
    </footer>
  );
}

// ─── Boutique Under Setup state ───────────────────────────────────────────────
function UnderSetupState({ store, pal }: { store: SellerPublicProfile; pal: ReturnType<typeof usePalette> }) {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-4 text-center gap-6">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm"
        style={{ backgroundColor: pal.light }}
      >
        🏪
      </div>
      <div className="space-y-2 max-w-sm">
        <h1 className="font-serif text-2xl font-bold text-neutral-900">{store.store_name}</h1>
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full w-fit mx-auto">
          Boutique Under Setup
        </p>
        <p className="text-sm text-neutral-500 leading-relaxed pt-1">
          This boutique is preparing their bridal and festive wardrobe collection on BlinkWear.
          Check back soon for exclusive designer rentals!
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {store.show_contact && store.whatsapp_number && (
          <a
            href={`https://wa.me/${store.whatsapp_number.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-white border border-neutral-200 text-neutral-800 hover:bg-neutral-100 transition-all"
          >
            <MessageCircle className="w-3.5 h-3.5 text-green-600" /> Inquire via WhatsApp
          </a>
        )}
        <Link
          href="https://blinkwear.in"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-white shadow-xs"
          style={{ backgroundColor: pal.primary }}
        >
          Explore BlinkWear Marketplace <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function SellerStoreView({ store, products, reviews }: SellerStoreViewProps) {
  const pal = usePalette(store.accent_palette);
  const storeUrl = getStoreUrl(store.store_slug || 'boutique');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /**/ }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: `${store.store_name} on BlinkWear`, url: storeUrl });
        return;
      } catch { /**/ }
    }
    handleCopy();
  };

  // If the boutique has 0 products and missing key setup details, show Boutique Under Setup
  const isUnderSetup =
    products.length === 0 &&
    (!store.store_description || (!store.logo_url && !store.banner_url));

  if (isUnderSetup) {
    return <UnderSetupState store={store} pal={pal} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <StoreHeader
        store={store}
        pal={pal}
        storeUrl={storeUrl}
        onShare={handleShare}
        onCopy={handleCopy}
        copied={copied}
      />
      <main>
        <HeroSection store={store} pal={pal} productCount={products.length} />
        <CollectionSection store={store} products={products} pal={pal} />
        {store.show_about && store.store_description && (
          <AboutSection store={store} pal={pal} />
        )}
        {store.show_how_it_works && <HowItWorksSection pal={pal} />}
        {/* Hide Reviews if there are none (Requirement 5) */}
        {store.show_reviews && reviews && reviews.length > 0 && (
          <section id="reviews" className="py-12 sm:py-16 bg-neutral-50/70">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: pal.primary }}>
                  Buyer Love
                </p>
                <h2 className="font-serif text-2xl font-bold text-neutral-900">Verified Buyer Reviews</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map((r) => (
                  <div key={r.id} className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-2">
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: r.rating }).map((_, idx) => (
                        <span key={idx}>★</span>
                      ))}
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">&ldquo;{r.comment}&rdquo;</p>
                    <p className="text-[11px] font-semibold text-neutral-900 pt-1">— {r.reviewer_name}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
        {store.show_contact && (store.whatsapp_number || store.instagram_handle || store.store_hours || store.city) && (
          <ContactSection store={store} pal={pal} />
        )}
      </main>
      <StoreFooter store={store} pal={pal} />
    </div>
  );
}

// Named exports for skeleton (used in loading.tsx)
export { ProductSkeleton };
