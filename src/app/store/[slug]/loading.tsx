import React from 'react';

// Skeleton shown while the store page SSR renders
export default function StoreLoading() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      {/* Sticky header skeleton */}
      <div className="bg-neutral-950 h-14 sticky top-0 z-50" />

      {/* Hero skeleton */}
      <div className="relative h-[70vh] bg-neutral-100">
        <div className="absolute bottom-8 left-8 space-y-3">
          <div className="w-20 h-20 rounded-2xl bg-neutral-200" />
          <div className="h-8 w-64 bg-neutral-200 rounded-full" />
          <div className="h-4 w-48 bg-neutral-200 rounded-full" />
          <div className="h-10 w-40 bg-neutral-200 rounded-full mt-4" />
        </div>
      </div>

      {/* Product grid skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="h-6 w-48 bg-neutral-100 rounded-full" />
        <div className="h-14 bg-neutral-50 rounded-2xl border border-neutral-100" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-neutral-50 rounded-2xl overflow-hidden border border-neutral-100">
              <div className="aspect-[3/4] bg-neutral-100" />
              <div className="p-4 space-y-2">
                <div className="h-2.5 bg-neutral-100 rounded-full w-2/3" />
                <div className="h-3.5 bg-neutral-100 rounded-full" />
                <div className="h-2.5 bg-neutral-100 rounded-full w-1/2 mt-2" />
                <div className="h-8 bg-neutral-100 rounded-xl mt-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
