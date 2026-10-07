import React from 'react';
import Link from 'next/link';

export default function FAQPage() {
  const faqs = [
    {
      q: 'How does renting an outfit work on BlinkWear?',
      a: 'Browse our designer collection, select your event date and rental duration (typically 3, 5, or 7+ days), and proceed to secure Cashfree checkout. We deliver the outfit freshly sanitized and steam-pressed 24 to 48 hours before your event. When your rental period concludes, pack it in the provided prepaid garment bag, and our courier will collect it from your doorstep.',
    },
    {
      q: 'Do I need to dry clean or wash the outfit before returning it?',
      a: 'Absolutely not! We take care of all dry cleaning and garment care. In fact, we kindly ask that you do NOT attempt to wash or dry clean the garment yourself, as delicate fabrics like zardozi, silk, and brocade require specialized solvent treatments.',
    },
    {
      q: 'When and how is my security deposit refunded?',
      a: 'Your refundable security deposit is initiated within 24 to 48 hours of our quality inspection team receiving the garment at our regional hub. The funds are credited directly back to the original payment method (bank account / UPI) via Cashfree.',
    },
    {
      q: 'What if the outfit does not fit properly upon delivery?',
      a: 'We understand the importance of flawless fit. All our listings provide detailed bust, waist, and length measurements. If an item arrives and does not fit, contact our concierge within 4 hours of delivery. We will arrange an immediate doorstep exchange if an alternate size is available in your city or provide a full store credit.',
    },
    {
      q: 'What happens in case of minor accidental stains or wear?',
      a: 'We understand that weddings and parties involve dining and dancing! Normal minor wear and water/food stains treatable through our standard dry-cleaning protocol are fully covered at zero penalty. Significant permanent damage, tears, or missing embellishments will be assessed against the security deposit according to our rental policy.',
    },
    {
      q: 'Which cities does BlinkWear currently operate in?',
      a: 'We currently offer direct same-city doorstep delivery and reverse pickup in Bhopal (Madhya Pradesh) and Pune (Maharashtra). We are expanding to Indore, Mumbai, Delhi-NCR, and Bengaluru soon!',
    },
    {
      q: 'How can I monetize my own bridal or designer wardrobe?',
      a: 'Visit our "Become a Seller" page and submit your store profile. You can list bridal lehengas, sherwanis, or gowns. Whenever a customer books your item, you earn rental payouts while we handle courier pickups, insured transit, and customer sanitization.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
          Help Center
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900">
          Frequently Asked Questions
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500">
          Everything you need to know about renting designer outfits, deposits, and returns
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-2xs space-y-2"
          >
            <h3 className="font-bold text-sm sm:text-base text-neutral-900">{faq.q}</h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>

      <div className="text-center pt-6">
        <p className="text-xs text-neutral-500">
          Still have a question? Contact us at{' '}
          <Link href="/contact" className="text-emerald-700 font-bold underline">
            support@blinkwear.in
          </Link>
        </p>
      </div>
    </div>
  );
}
