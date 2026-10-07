import React from 'react';

export default function CancellationPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      <div className="pb-6 border-b border-neutral-100">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900">
          Cancellation Policy
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          BlinkWear Transparent Rental & Purchase Order Cancellation Schedule
        </p>
      </div>

      <div className="text-xs sm:text-sm text-neutral-700 space-y-6 leading-relaxed">
        <p>
          We understand that event schedules, wedding dates, and party plans can shift unexpectedly. Our cancellation policy is designed to be as fair and flexible as possible to both renters and outfit lenders.
        </p>

        <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200 space-y-4">
          <h2 className="text-sm font-bold text-neutral-900">Rental Cancellation Windows</h2>

          <div className="space-y-3">
            <div className="p-3 bg-white rounded-xl border border-neutral-200">
              <span className="font-bold text-neutral-900 block text-xs">
                Cancellation Before Garment Dispatch (More than 48h prior to delivery date)
              </span>
              <p className="text-neutral-600 text-xs mt-1">
                <strong>100% Refund</strong> of Security Deposit + <strong>90% Refund</strong> of Rental Fee (10% standard processing fee).
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-neutral-200">
              <span className="font-bold text-neutral-900 block text-xs">
                Cancellation After Dispatch but Before Delivery
              </span>
              <p className="text-neutral-600 text-xs mt-1">
                <strong>100% Refund</strong> of Security Deposit + <strong>50% Refund</strong> of Rental Fee (to cover dry cleaning & transit logistics). Delivery fees are non-refundable.
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-neutral-200">
              <span className="font-bold text-neutral-900 block text-xs">
                Cancellation After Delivery
              </span>
              <p className="text-neutral-600 text-xs mt-1">
                <strong>100% Refund</strong> of Security Deposit upon intact return. Rental fee is non-refundable once delivered, unless verified fit mismatch reported within 4 hours.
              </p>
            </div>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-neutral-900">Purchase Orders (Pre-Loved)</h2>
          <p>
            Pre-loved buy orders can be cancelled free of charge prior to courier dispatch. Once dispatched, standard return shipping charges will apply if returned unused with security tags intact.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-neutral-900">Refund Processing Timeline</h2>
          <p>
            Approved cancellation refunds are processed back to your original payment method (Cashfree UPI / Net Banking / Card) within 3 to 5 business days.
          </p>
        </section>
      </div>
    </div>
  );
}
