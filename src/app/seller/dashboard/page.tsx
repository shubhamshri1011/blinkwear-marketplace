'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import {
  Store,
  Package,
  Calendar,
  DollarSign,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Globe,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { getStoreUrl } from '@/lib/store';

export default function SellerDashboardPage() {
  const router = useRouter();
  const { user, profile, sellerProfile } = useAuth();
  const supabase = createClient();

  const [stats, setStats] = useState({
    totalProducts: 0,
    activeRentals: 0,
    totalOrders: 0,
    totalEarnings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  const storeSlug = sellerProfile?.store_slug;
  const storeUrl = storeSlug ? getStoreUrl(storeSlug) : null;

  const handleCopyLink = async () => {
    if (!storeUrl) return;
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!user) return;

    async function loadStats() {
      setIsLoading(true);
      try {
        const [{ count: prodCount }, { data: rentalsData }, { data: orderItemsData }] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }).eq('seller_id', user!.id),
          supabase.from('rental_bookings').select('rental_amount, total_charged, fulfillment_status').eq('seller_id', user!.id),
          supabase.from('order_items').select('line_total, item_status').eq('seller_id', user!.id),
        ]);

        const rentalEarnings = (rentalsData || []).reduce((acc, r) => acc + (r.rental_amount || 0), 0);
        const orderEarnings = (orderItemsData || []).reduce((acc, o) => acc + (o.line_total || 0), 0);

        setStats({
          totalProducts: prodCount || 0,
          activeRentals: (rentalsData || []).filter((r) => !['completed', 'cancelled'].includes(r.fulfillment_status)).length,
          totalOrders: (orderItemsData || []).length,
          totalEarnings: rentalEarnings + orderEarnings,
        });
      } catch (err) {
        console.error('Error fetching seller stats:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, [user, supabase]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold text-neutral-900">Sign In to Access Dashboard</h2>
        <Link href="/login?redirect=/seller/dashboard" className="inline-block mt-4 px-8 py-3 rounded-full bg-neutral-950 text-white font-bold text-xs">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Seller Partner Portal
            </span>
            {sellerProfile?.verification_status && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full capitalize">
                Status: {sellerProfile.verification_status}
              </span>
            )}
          </div>
          <h1 className="font-serif text-3xl font-bold text-neutral-900 mt-1">
            {sellerProfile?.store_name || 'My Closet Dashboard'}
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Operating in {sellerProfile?.city || profile?.city || 'India'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/seller/store"
            className="py-2.5 px-5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs flex items-center gap-1.5 transition-colors border border-neutral-200"
          >
            <Globe className="w-4 h-4 text-emerald-600" /> Mini-Store Settings
          </Link>
          <Link
            href="/seller/products/new"
            className="py-2.5 px-6 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" /> Add New Outfit
          </Link>
        </div>
      </div>

      {/* Mini-Store Subdomain Showcase Card */}
      <div className="bg-linear-to-r from-neutral-900 via-neutral-950 to-emerald-950 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
              Free Boutique Subdomain
            </span>
            <span className="text-[10px] text-neutral-400">
              Zero platform subscription fee
            </span>
          </div>

          <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
            {storeSlug ? (
              <span className="flex items-center gap-2 flex-wrap">
                <span>{sellerProfile?.store_name} Mini-Store</span>
                <span className="text-sm font-mono text-emerald-300 font-normal bg-white/10 px-3 py-1 rounded-full border border-white/10">
                  {storeSlug}.blinkwear.in
                </span>
              </span>
            ) : (
              'Claim Your Free Boutique Subdomain'
            )}
          </h3>

          <p className="text-xs text-neutral-300 max-w-xl leading-relaxed">
            Your private boutique storefront showcases only your approved outfits, custom logo, banner, and Buy/Rent options. Share it with your clients on Instagram and WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {storeUrl && (
            <>
              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2.5 px-4 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
              </button>
              <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
              >
                <span>Visit Store</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </>
          )}

          <Link
            href="/seller/store"
            className="py-2.5 px-5 rounded-full bg-white text-neutral-900 hover:bg-neutral-100 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
          >
            <span>{storeSlug ? 'Edit Branding' : 'Setup Subdomain →'}</span>
          </Link>
        </div>
      </div>

      {/* KYC Verification Alert Banner */}
      {(!sellerProfile?.is_verified || sellerProfile?.verification_status === 'pending') && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 sm:p-6 flex items-start gap-4 shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
            <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm text-amber-950">
                Seller Account Pending Admin Verification
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full">
                Under Review
              </span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Your PAN Card and Identity documents have been submitted to BlinkWear Compliance Admins.
              Your account must be reviewed and approved from the Admin Panel before your store becomes
              active and your listed outfits can go live to buyers.
            </p>
            <div className="pt-1 text-[11px] text-amber-700 font-medium">
              Turnaround: 24–48 hours • Need urgent review? Email{' '}
              <a href="mailto:support@blinkwear.in" className="underline font-semibold text-amber-900">
                support@blinkwear.in
              </a>
            </div>
          </div>
        </div>
      )}

      {sellerProfile?.verification_status === 'rejected' && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 sm:p-6 flex items-start gap-4 shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-rose-950">
              KYC Verification Rejected
            </h3>
            <p className="text-xs text-rose-800 leading-relaxed">
              Your seller KYC documents could not be verified by our administrative team. Please
              re-submit clear front and back images of your PAN card and Identity document.
            </p>
            <Link
              href="/become-a-seller"
              className="inline-block mt-2 text-xs font-bold text-rose-900 underline"
            >
              Re-submit KYC Documents →
            </Link>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-2xs space-y-2">
          <span className="text-xs font-semibold text-neutral-400">Total Wardrobe Listings</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
            {stats.totalProducts}
          </p>
          <Link href="/seller/products" className="text-xs text-emerald-600 font-semibold hover:underline inline-block">
            View products →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-2xs space-y-2">
          <span className="text-xs font-semibold text-neutral-400">Active Rental Bookings</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
            {stats.activeRentals}
          </p>
          <Link href="/seller/rentals" className="text-xs text-emerald-600 font-semibold hover:underline inline-block">
            Manage rentals →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-2xs space-y-2">
          <span className="text-xs font-semibold text-neutral-400">Total Buy Orders</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
            {stats.totalOrders}
          </p>
          <Link href="/seller/orders" className="text-xs text-emerald-600 font-semibold hover:underline inline-block">
            Manage orders →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-2xs space-y-2">
          <span className="text-xs font-semibold text-neutral-400">Gross Rental Volume</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-neutral-900">
            {formatCurrency(stats.totalEarnings)}
          </p>
          <span className="text-[10px] text-neutral-400 block">Excluding refundable deposits</span>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          href="/seller/products"
          className="bg-neutral-50 hover:bg-neutral-100/80 p-6 rounded-3xl border border-neutral-200 transition-colors space-y-2 block"
        >
          <Package className="w-6 h-6 text-emerald-600" />
          <h3 className="font-bold text-sm text-neutral-900">Manage Wardrobe</h3>
          <p className="text-xs text-neutral-500">
            Edit rental pricing, adjust deposits, update images, and manage sizes.
          </p>
        </Link>

        <Link
          href="/seller/rentals"
          className="bg-neutral-50 hover:bg-neutral-100/80 p-6 rounded-3xl border border-neutral-200 transition-colors space-y-2 block"
        >
          <Calendar className="w-6 h-6 text-emerald-600" />
          <h3 className="font-bold text-sm text-neutral-900">Rental Bookings</h3>
          <p className="text-xs text-neutral-500">
            Accept rental requests, advance dispatch status, and log garment handovers.
          </p>
        </Link>

        <Link
          href="/seller/orders"
          className="bg-neutral-50 hover:bg-neutral-100/80 p-6 rounded-3xl border border-neutral-200 transition-colors space-y-2 block"
        >
          <Store className="w-6 h-6 text-emerald-600" />
          <h3 className="font-bold text-sm text-neutral-900">Buy Orders</h3>
          <p className="text-xs text-neutral-500">
            View completed and pending buyer orders and sales volume.
          </p>
        </Link>

        <Link
          href="/seller/store"
          className="bg-emerald-50/60 hover:bg-emerald-100/70 p-6 rounded-3xl border border-emerald-200/80 transition-colors space-y-2 block"
        >
          <Globe className="w-6 h-6 text-emerald-700" />
          <h3 className="font-bold text-sm text-emerald-950">Mini-Store & Subdomain</h3>
          <p className="text-xs text-emerald-800">
            Customize your store URL, boutique bio, logo, and banner.
          </p>
        </Link>
      </div>
    </div>
  );
}
