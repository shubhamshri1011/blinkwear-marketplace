import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Store } from 'lucide-react';

// Phase 4: proper 404 for unknown subdomains / store slugs
export default function StoreNotFound() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-4 text-center gap-6">
      <div className="w-16 h-16 rounded-2xl bg-neutral-800 flex items-center justify-center">
        <Store className="w-8 h-8 text-neutral-500" />
      </div>
      <div className="space-y-2 max-w-sm">
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">404</p>
        <h1 className="font-serif text-2xl font-bold text-white">Boutique Not Found</h1>
        <p className="text-sm text-neutral-400 leading-relaxed">
          The boutique you&apos;re looking for doesn&apos;t exist on BlinkWear or may have changed its link. Check the address or explore the marketplace.
        </p>
      </div>
      <Link
        href="https://blinkwear.in"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Go to BlinkWear
      </Link>
    </div>
  );
}
