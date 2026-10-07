import React from 'react';
import Link from 'next/link';
import { SearchX, Home, ShoppingBag } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-20 text-center">
      <div className="w-20 h-20 rounded-3xl bg-neutral-100 flex items-center justify-center mx-auto mb-6">
        <SearchX className="w-10 h-10 text-neutral-400" />
      </div>
      <h1 className="font-serif text-4xl font-bold text-neutral-900 mb-3">Page Not Found</h1>
      <p className="text-sm text-neutral-500 max-w-md mx-auto mb-8 leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved. Let&apos;s get
        you back to something great.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-950 text-white font-bold text-sm hover:bg-neutral-800 transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-neutral-200 text-neutral-700 font-semibold text-sm hover:bg-neutral-50 transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          Browse Products
        </Link>
      </div>
    </div>
  );
}
