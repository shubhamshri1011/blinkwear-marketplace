import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rental Policy & Agreement — BlinkWear.in',
  description:
    'Read the BlinkWear fashion rental agreement. Guidelines on rental periods, delivery schedules, garment care, return procedures, and damage policies.',
  alternates: {
    canonical: 'https://blinkwear.in/rental-policy',
  },
  openGraph: {
    title: 'Rental Policy | BlinkWear.in',
    description: 'Guidelines on rental periods, delivery schedules, garment care, and return procedures.',
    url: 'https://blinkwear.in/rental-policy',
  },
};

export default function RentalPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      <div className="pb-6 border-b border-neutral-100">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900">
          Rental Agreement & Guidelines
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Effective Date: January 2025 • Governing BlinkWear Fashion Rental Services
        </p>
      </div>

      <div className="prose prose-neutral max-w-none text-xs sm:text-sm text-neutral-700 space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">1. Nature of the Rental Agreement</h2>
          <p>
            By booking a rental on BlinkWear.in, you acknowledge and agree that you are entering into a temporary bailment agreement. Ownership of the garment, accessories, and all embellishments remains strictly with the seller or BlinkWear at all times.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">2. Rental Period and Delivery</h2>
          <p>
            The rental period commences on the delivery date selected during booking and ends on the scheduled return date. Garments are delivered 24 to 48 hours prior to your selected event date. The return pickup is scheduled for the morning following the final rental day.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">3. Care of Garments and Alterations</h2>
          <p>
            Renters agree to treat all garments with utmost care. Temporary alterations (such as loose basting stitches or safety pins) must not puncture or damage delicate fabrics like raw silk, organza, or velvet. Permanent alterations, cutting, iron heats exceeding fabric tolerance, or unauthorized home washes are strictly prohibited.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">4. Damage and Security Deposit Assessment</h2>
          <p>
            Each rental booking requires a refundable security deposit. Upon return pickup, every garment is inspected at our regional hub. Normal wear and standard dry-cleanable stains (such as perspiration or minor surface dust) carry zero penalty. In the event of irreversible fabric tear, severe burn marks, or permanent wine/oil stains, repair costs will be deducted from the security deposit.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">5. Late Returns</h2>
          <p>
            Prompt return ensures the next renter receives their outfit on time. Delays without prior authorization may incur late fees of up to 50% of the daily rental rate for each 24-hour delay.
          </p>
        </section>
      </div>
    </div>
  );
}
