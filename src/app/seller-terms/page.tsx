import React from 'react';
import Link from 'next/link';
import { Store, ShieldCheck, Banknote, Sparkles } from 'lucide-react';

export default function SellerTermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      <div className="pb-6 border-b border-neutral-100">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900">
          Seller Partner Terms of Service
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Lender onboarding agreements, commission structure, and garment protection
        </p>
      </div>

      <div className="text-xs sm:text-sm text-neutral-700 space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">1. Partner Eligibility & Wardrobe Quality</h2>
          <p>
            BlinkWear welcomes individual wardrobe owners, designer boutiques, and rental ateliers. All listed garments must be authentic designer apparel in &ldquo;New&rdquo;, &ldquo;Like New&rdquo;, or &ldquo;Good&rdquo; condition, free of tears, missing embellishments, or foul odors.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">2. Commission & Pricing Structure</h2>
          <p>
            Sellers set their own daily rental rates and pre-loved sale prices. BlinkWear retains a standard <strong>10% platform commission</strong> on completed rental bookings to cover marketing, logistics coordination, and customer support. The remaining 90% is remitted directly to the seller.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">3. Garment Sanitization & Logistics</h2>
          <p>
            BlinkWear manages the entire logistics chain. When a rental booking is accepted, our courier collects the outfit from your address. We handle all hospital-grade dry-cleaning, steam pressing, and delivery to the buyer. Upon return, the outfit is professionally sanitized once more before return to your wardrobe.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">4. Damage Protection & Security Deposits</h2>
          <p>
            Every rental includes a mandatory refundable security deposit paid by the renter. If a renter returns a garment with catastrophic damage, the security deposit is assessed to cover repair costs or fair replacement value paid out to the seller.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">5. Payout Schedule</h2>
          <p>
            Seller payouts for completed rentals and pre-loved sales are settled directly into the seller&apos;s verified bank account via NEFT/IMPS within 3 business days of booking completion.
          </p>
        </section>

        <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
          <span className="text-xs text-neutral-500">Ready to list your designer wardrobe?</span>
          <Link
            href="/become-a-seller"
            className="py-2.5 px-6 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
          >
            Apply as Seller Partner →
          </Link>
        </div>
      </div>
    </div>
  );
}
