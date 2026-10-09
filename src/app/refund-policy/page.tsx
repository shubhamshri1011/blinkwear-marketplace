import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Deposit & Refund Policy — BlinkWear.in',
  description:
    'Learn about BlinkWear security deposit refunds, turnaround times, quality inspection procedures, and payout terms.',
  alternates: {
    canonical: 'https://blinkwear.in/refund-policy',
  },
  openGraph: {
    title: 'Refund Policy | BlinkWear.in',
    description: 'Learn about security deposit refunds and quality inspection procedures on BlinkWear.',
    url: 'https://blinkwear.in/refund-policy',
  },
};

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      <div className="pb-6 border-b border-neutral-100">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900">
          Deposit & Refund Policy
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Deposit refunded after quality check and payout terms
        </p>
      </div>

      <div className="text-xs sm:text-sm text-neutral-700 space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">1. Security Deposit Nature</h2>
          <p>
            Every rental garment requires a refundable security deposit at checkout. This deposit safeguards our seller partners against permanent loss, non-return, or catastrophic fabric damage. It is held securely and never mixed with company revenue.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">2. Refund Timeline</h2>
          <p>
            Upon our logistics courier collecting the garment from your doorstep, it is delivered to our regional hub for a standardized 15-minute physical and UV quality inspection. Once approved, the refund is initiated within <strong>24 to 48 hours</strong> directly through the Cashfree payment gateway to your original bank account or UPI ID.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">3. Deductions & Assessments</h2>
          <p>
            Deductions only occur under exceptional circumstances:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-neutral-600">
            <li>Permanent burn holes or irreversible fabric tears beyond repair.</li>
            <li>Loss of major designer accessories or bespoke removable embellishments (e.g. heirloom brooches, belts).</li>
            <li>Unreturned garments after 7 days without customer communication (forfeited).</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">4. Support & Discrepancies</h2>
          <p>
            In the rare event of a deduction dispute, our quality inspection video and photographic evidence recorded upon return receipt will be shared transparently with both the renter and the lender.
          </p>
        </section>
      </div>
    </div>
  );
}
