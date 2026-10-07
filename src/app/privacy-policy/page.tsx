import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      <div className="pb-6 border-b border-neutral-100">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Last revised: January 2025 • Compliant with Indian Information Technology Rules
        </p>
      </div>

      <div className="text-xs sm:text-sm text-neutral-700 space-y-6 leading-relaxed">
        <p>
          At BlinkWear.in, we respect your privacy and are committed to protecting the personal data you share with us. This policy details how we collect, store, and utilize your information.
        </p>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">1. Information We Collect</h2>
          <p>
            When you register, place a rental booking, or list products, we collect your name, email address, mobile phone number, delivery and billing addresses, and city. For sellers, we may collect store details and optional verification documents (such as PAN/GST) solely for identity compliance.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">2. How We Use Your Data</h2>
          <ul className="list-disc pl-5 space-y-1 text-neutral-600">
            <li>To process rental bookings, purchase orders, and deposit refunds.</li>
            <li>To coordinate logistics and doorstep courier pickups.</li>
            <li>To send order status notifications, OTP codes, and service alerts via SMS and email.</li>
            <li>To prevent fraud, payment abuse, and identity theft.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">3. Payment Security & Third Parties</h2>
          <p>
            We do not store your full credit/debit card numbers or UPI PINs. All financial transactions are tokenized and processed through PCI-DSS certified gateway partners (Cashfree Payments). Your information is never sold to third-party marketing brokers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">4. Grievance Officer</h2>
          <p>
            In accordance with the Information Technology Act 2000, questions regarding data privacy may be directed to our Grievance Officer at <strong>privacy@blinkwear.in</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
