'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { Category } from '@/types/database';
import { Filter, X, ChevronDown, Check, RotateCcw } from 'lucide-react';

interface ProductsFilterProps {
  categories: Category[];
  availableCities: string[];
}

export function ProductsFilter({ categories, availableCities }: ProductsFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const currentType = searchParams.get('type') || 'all';
  const currentCategory = searchParams.get('category') || '';
  const currentCity = searchParams.get('city') || '';
  const currentSize = searchParams.get('size') || '';
  const currentSort = searchParams.get('sort') || 'newest';

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all' && value !== '') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push(pathname);
  };

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'Free Size'];

  const hasActiveFilters = Boolean(
    searchParams.get('type') ||
    searchParams.get('category') ||
    searchParams.get('city') ||
    searchParams.get('size') ||
    searchParams.get('minPrice') ||
    searchParams.get('maxPrice')
  );

  const filterContent = (
    <div className="space-y-6">
      {/* Header and Reset */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-800" />
          <span className="font-semibold text-sm text-neutral-900">Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Reset All
          </button>
        )}
      </div>

      {/* Mode / Type Toggle */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-3">
          Rental / Purchase
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-100 rounded-xl">
          {[
            { id: 'all', label: 'All' },
            { id: 'rent', label: 'Rent' },
            { id: 'sale', label: 'Buy' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => updateParam('type', item.id)}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentType === item.id
                  ? 'bg-white text-neutral-950 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* City Filter */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-3">
          Location Hub
        </label>
        <div className="space-y-1.5">
          <button
            onClick={() => updateParam('city', null)}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left transition-colors ${
              !currentCity
                ? 'bg-emerald-50 text-emerald-800 font-semibold'
                : 'text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <span>All Cities</span>
            {!currentCity && <Check className="w-3.5 h-3.5 text-emerald-600" />}
          </button>
          {availableCities.map((city) => {
            const isSelected = currentCity.toLowerCase() === city.toLowerCase();
            return (
              <button
                key={city}
                onClick={() => updateParam('city', isSelected ? null : city)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left transition-colors ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <span>{city}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category List */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-3">
          Categories
        </label>
        <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
          <button
            onClick={() => updateParam('category', null)}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left transition-colors ${
              !currentCategory
                ? 'bg-emerald-50 text-emerald-800 font-semibold'
                : 'text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <span>All Categories</span>
            {!currentCategory && <Check className="w-3.5 h-3.5 text-emerald-600" />}
          </button>
          {categories.map((cat) => {
            const isSelected = currentCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => updateParam('category', isSelected ? null : cat.slug)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left transition-colors ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <span className="truncate">{cat.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Size Chips */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-3">
          Size
        </label>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => {
            const isSelected = currentSize === s;
            return (
              <button
                key={s}
                onClick={() => updateParam('size', isSelected ? null : s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort By Dropdown */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
          Sort By
        </label>
        <select
          value={currentSort}
          onChange={(e) => updateParam('sort', e.target.value)}
          aria-label="Sort products by"
          className="w-full bg-white border border-neutral-200 text-neutral-800 text-xs rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-neutral-900"
        >
          <option value="newest">Newest Arrivals</option>
          <option value="popular">Most Popular</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile filter toggle bar */}
      <div className="lg:hidden mb-6 flex items-center justify-between bg-white p-3 rounded-2xl border border-neutral-200">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex items-center gap-2 text-xs font-semibold text-neutral-900"
        >
          <Filter className="w-4 h-4 text-emerald-600" />
          Filter & Sort {hasActiveFilters && '(Active)'}
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-rose-600 font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* Desktop Filter Box */}
      <div className="hidden lg:block bg-white p-6 rounded-3xl border border-neutral-100 shadow-xs">
        {filterContent}
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-4/5 max-w-sm bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100">
                <span className="font-serif text-lg font-bold text-neutral-900">Filters</span>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {filterContent}
            </div>

            <div className="pt-6 border-t border-neutral-100 mt-6">
              <button
                onClick={() => setIsMobileOpen(false)}
                className="w-full py-3 bg-neutral-950 text-white rounded-xl text-xs font-bold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
