'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, CheckCircle2, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
          Here to Help
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900">
          Get in Touch with BlinkWear
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
          Have queries about sizing, delivery schedules, deposit refunds, or seller onboarding?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Contact info cards */}
        <div className="space-y-4">
          <div className="bg-neutral-50 p-6 rounded-3xl border border-neutral-200 space-y-2">
            <Mail className="w-5 h-5 text-emerald-600" />
            <h4 className="font-bold text-neutral-900 text-sm">Customer Care Email</h4>
            <p className="text-xs text-neutral-600">support@blinkwear.in</p>
            <p className="text-[11px] text-neutral-400">Response within 3 to 6 business hours</p>
          </div>

          <div className="bg-neutral-50 p-6 rounded-3xl border border-neutral-200 space-y-2">
            <Phone className="w-5 h-5 text-emerald-600" />
            <h4 className="font-bold text-neutral-900 text-sm">Direct Phone & WhatsApp</h4>
            <p className="text-xs text-neutral-600">+91 77229 58818</p>
            <p className="text-[11px] text-neutral-400">Mon - Sat: 10:00 AM to 8:00 PM IST</p>
          </div>

          <div className="bg-neutral-50 p-6 rounded-3xl border border-neutral-200 space-y-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <h4 className="font-bold text-neutral-900 text-sm">Regional Operation Hubs</h4>
            <p className="text-xs text-neutral-600">
              • Main Hub: Naveen Villa Sindhi Colony Bypass Road, Bina - 470113, Madhya Pradesh<br />
            </p>
          </div>
        </div>

        {/* Message form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xl">
          {submitted ? (
            <div className="text-center py-10 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="font-serif font-bold text-lg text-neutral-900">Message Received!</h3>
              <p className="text-xs text-neutral-500">
                Thank you for contacting us. A stylist from our support concierge will get back to you shortly.
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="space-y-4"
            >
              <h3 className="font-serif font-bold text-base text-neutral-900">Send an Inquiry</h3>

              <div>
                <label className="text-[11px] font-bold text-neutral-600 block mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-600 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-600 block mb-1">Mobile Number</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-600 block mb-1">Your Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="How can we assist you?"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs transition-colors shadow-md"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
