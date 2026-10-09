import React from 'react';
import type { Metadata } from 'next';
import { Truck, RotateCcw, ShieldCheck, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shipping & Delivery — Doorstep Delivery & Reverse Pickup | BlinkWear.in',
  description:
    'Learn about BlinkWear shipping timelines, doorstep delivery 48 hours before your event, and free scheduled reverse pickup across Bhopal & India.',
  alternates: {
    canonical: 'https://blinkwear.in/shipping-delivery',
  },
  openGraph: {
    title: 'Shipping & Delivery | BlinkWear.in',
    description: 'Doorstep delivery and hassle-free return logistics for designer fashion rentals.',
    url: 'https://blinkwear.in/shipping-delivery',
  },
};

export default function ShippingDeliveryPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      <div className="pb-6 border-b border-neutral-100">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900">
          Shipping & Reverse Pickup
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Doorstep delivery protocols and prepaid return logistics
        </p>
      </div>

      <div className="text-xs sm:text-sm text-neutral-700 space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">1. Delivery Zones & City Matching</h2>
          <p>
            BlinkWear currently operates local white-glove delivery networks in <strong>Bhopal</strong> and <strong>Pune</strong>. To guarantee that delicate garments arrive wrinkle-free and on time, fashion rentals are fulfilled within the same city hub.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">2. Pre-Event Arrival Guarantee</h2>
          <p>
            All rental garments are delivered <strong>24 to 48 hours</strong> prior to your event start date. This buffer allows you ample time to try on the outfit, coordinate jewellery and footwear, and notify our concierge in the rare event of any fit discrepancy.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">3. Tamper-Proof Packaging</h2>
          <p>
            Every outfit is packaged in a breathable, reusable, moisture-proof BlinkWear garment bag with custom wooden hanger and sealed with a tamper-evident serial tag.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">4. Scheduled Doorstep Reverse Pickup</h2>
          <p>
            On the morning following your final rental day, our logistics partner will arrive at your registered address to collect the garment bag. You do not need to print any return label or visit a courier center.
          </p>
        </section>
      </div>
    </div>
  );
}
