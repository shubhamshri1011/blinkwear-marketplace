import React from 'react';

export default function TermsAndConditionsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      <div className="pb-6 border-b border-neutral-100">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900">
          Terms & Conditions
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Last updated: January 2025 • BlinkWear.in User Agreement
        </p>
      </div>

      <div className="text-xs sm:text-sm text-neutral-700 space-y-6 leading-relaxed">
        <p>
          Welcome to BlinkWear.in (the &quot;Platform&quot;). These Terms and Conditions govern your access to and use of our fashion rental and e-commerce marketplace. By using our website, services, or placing bookings, you agree to be bound by these Terms.
        </p>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">1. Account Registration</h2>
          <p>
            Users must provide authentic and accurate contact information, including a valid 10-digit mobile number capable of receiving SMS and OTP verification. You are responsible for safeguarding your login credentials.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">2. Marketplace Model</h2>
          <p>
            BlinkWear acts as a managed marketplace connecting individual and boutique wardrobe owners (&quot;Sellers&quot;) with customers wishing to rent or purchase apparel (&quot;Buyers&quot;). We facilitate quality assurance, dry cleaning, insured delivery, and secure payment processing.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">3. Payments & Escrow</h2>
          <p>
            All electronic payments, including rental rates, delivery charges, platform service fees, and refundable security deposits, are processed securely through Cashfree Payments India Pvt. Ltd. Rental security deposits are held in escrow pending successful return inspection.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">4. Prohibited Conduct</h2>
          <p>
            Users may not attempt to duplicate, sublicense, reverse-engineer, or maliciously exploit platform assets. Renters shall not resell, sub-rent, or assign rented garments to third parties.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-neutral-900">5. Limitation of Liability & Dispute Resolution</h2>
          <p>
            These terms are governed by the laws of India. Any legal dispute arising out of or in connection with the Platform shall be subject to the exclusive jurisdiction of the competent courts in Bhopal, Madhya Pradesh.
          </p>
        </section>
      </div>
    </div>
  );
}
