import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Truck,
  Mail,
  Phone,
  MapPin,
  Heart,
} from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-neutral-950 text-neutral-300 pt-16 pb-8 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Proposition Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-neutral-800">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Professional Sanitization</h4>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Hospital-grade dry cleaning and UV sterilization before every delivery.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400 shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Doorstep Delivery & Return</h4>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Seamless delivery to your door and scheduled pickup when your event ends.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Verified Designer Apparel</h4>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Every listing is verified for fabric authenticity, condition, and craftsmanship.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400 shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Deposit refunded after quality check</h4>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Security deposits refunded directly to your payment source upon quality check.
              </p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-12 border-b border-neutral-800 text-sm">
          {/* Brand Info */}
          <div className="col-span-2">
            <Link href="/" className="font-serif text-2xl font-black text-white">
              Blink<span className="text-emerald-500 font-sans">Wear.in</span>
            </Link>
            <p className="text-neutral-400 text-xs mt-3 max-w-sm leading-relaxed">
              India&apos;s premier luxury fashion rental and resale marketplace. Wear iconic designer lehengas, sherwanis, and luxury occasionwear at a fraction of the retail price.
            </p>

            <div className="mt-6 flex flex-col gap-2 text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Operating Hubs: Bhopal & Pune (Expansion Ongoing)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>support@blinkwear.in</span>
              </div>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h5 className="text-white font-semibold text-xs uppercase tracking-wider mb-4">
              Rentals
            </h5>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <Link href="/category/lehengas" className="hover:text-white transition-colors">
                  Rental Lehengas (Bhopal)
                </Link>
              </li>
              <li>
                <Link href="/category/dresses" className="hover:text-white transition-colors">
                  Designer Dresses
                </Link>
              </li>
              <li>
                <Link href="/category/sarees" className="hover:text-white transition-colors">
                  Designer Sarees
                </Link>
              </li>
              <li>
                <Link href="/category/ethnic-wear" className="hover:text-white transition-colors">
                  Ethnic & Festive Wear
                </Link>
              </li>
              <li>
                <Link href="/products?type=rent" className="hover:text-emerald-400 font-medium transition-colors">
                  Browse All Rentals →
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h5 className="text-white font-semibold text-xs uppercase tracking-wider mb-4">
              Help & Policies
            </h5>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <Link href="/rental-policy" className="hover:text-white transition-colors">
                  Rental Agreement
                </Link>
              </li>
              <li>
                <Link href="/cancellation-policy" className="hover:text-white transition-colors">
                  Cancellation Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-white transition-colors">
                  Deposit & Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/shipping-delivery" className="hover:text-white transition-colors">
                  Shipping & Reverse Pickup
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Sellers & Legal */}
          <div>
            <h5 className="text-white font-semibold text-xs uppercase tracking-wider mb-4">
              Sell & Legal
            </h5>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <Link href="/become-a-seller" className="hover:text-white transition-colors">
                  List Your Wardrobe
                </Link>
              </li>
              <li>
                <Link href="/seller-terms" className="hover:text-white transition-colors">
                  Seller Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/terms-and-conditions" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About BlinkWear
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* SEO Popular Searches Section */}
        <div className="py-8 border-b border-neutral-800 text-[11px] text-neutral-400 space-y-2 leading-relaxed">
          <p className="font-semibold text-neutral-300 text-xs">Popular Searches:</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <Link href="/category/lehengas" className="hover:text-emerald-400">Rental Lehenga Bhopal</Link>
            <span>•</span>
            <Link href="/category/lehengas" className="hover:text-emerald-400">Lehenga on Rent</Link>
            <span>•</span>
            <Link href="/category/lehengas" className="hover:text-emerald-400">Bridal Lehenga Rental</Link>
            <span>•</span>
            <Link href="/products?type=rent" className="hover:text-emerald-400">BlinkWear Fashion Rental</Link>
            <span>•</span>
            <Link href="/category/lehengas" className="hover:text-emerald-400">Lehenga Rent Near Me</Link>
            <span>•</span>
            <Link href="/category/ethnic-wear" className="hover:text-emerald-400">Ethnic Wear on Rent</Link>
            <span>•</span>
            <Link href="/category/dresses" className="hover:text-emerald-400">Designer Dress Rental</Link>
            <span>•</span>
            <Link href="/about" className="hover:text-emerald-400">Blink Wear India</Link>
            <span>•</span>
            <Link href="/become-a-seller" className="hover:text-emerald-400">Rent Out Your Lehenga</Link>
          </div>
          <p className="text-neutral-500 text-[10px] pt-1">
            BlinkWear is India&apos;s premier fashion rental ecosystem operating in Bhopal, Pune, and nationwide. Rent authentic designer bridal lehengas, party wear, and groom couture with hospital-grade sanitization and doorstep returns.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col items-center gap-4 text-xs text-neutral-500 sm:flex-row sm:justify-between">
          <p>© 2026 BlinkWear.in. All rights reserved.</p>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-center">
            <span className="flex items-center gap-1">
              Secured with <span className="font-semibold text-neutral-300">Cashfree Payments</span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              Crafted with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Indian Fashion
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
