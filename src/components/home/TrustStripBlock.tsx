'use client';

import React from 'react';
import type { TrustBadge, TrustBadgeIcon } from '@/types/database';
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  Sparkles,
  Award,
  Tag,
  Heart,
  Lock,
} from 'lucide-react';

interface TrustStripBlockProps {
  badges: TrustBadge[];
  title?: string;
  subtitle?: string | null;
}

const ICON_MAP: Record<TrustBadgeIcon, React.ElementType> = {
  'shield-check': ShieldCheck,
  truck: Truck,
  'check-circle': CheckCircle2,
  sparkles: Sparkles,
  'badge-check': Award,
  tag: Tag,
  heart: Heart,
  lock: Lock,
};

export function TrustStripBlock({ badges, title, subtitle }: TrustStripBlockProps) {
  if (!badges || badges.length === 0) return null;

  return (
    <section aria-label="Why BlinkWear" className="w-full bg-neutral-50/80 border-y border-neutral-200/60 py-6 sm:py-8 my-6 sm:my-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="text-center mb-6">
            {title && (
              <h2 className="font-serif text-lg sm:text-xl font-bold text-neutral-950">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        )}

        <div className={`grid gap-4 sm:gap-6 ${
          badges.length === 1
            ? 'grid-cols-1'
            : badges.length === 2
            ? 'grid-cols-1 sm:grid-cols-2'
            : badges.length === 3
            ? 'grid-cols-1 md:grid-cols-3'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        }`}>
          {badges.map((badge, idx) => {
            const IconComponent = ICON_MAP[badge.icon] || ShieldCheck;

            return (
              <div
                key={idx}
                className="flex items-start gap-3.5 p-4 rounded-xl bg-white border border-neutral-100 shadow-2xs hover:shadow-xs transition-shadow"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                  <IconComponent className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-neutral-900 leading-tight">
                    {badge.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5 leading-relaxed">
                    {badge.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
