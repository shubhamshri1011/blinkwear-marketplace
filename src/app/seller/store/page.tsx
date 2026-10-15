'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import {
  Store,
  Globe,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  ArrowLeft,
  Upload,
  RefreshCw,
  MapPin,
  Save,
} from 'lucide-react';
import {
  validateStoreSlug,
  formatStoreSlug,
  getStoreUrl,
  RESERVED_SLUGS,
} from '@/lib/store';

export default function SellerStoreSettingsPage() {
  const router = useRouter();
  const { user, profile, sellerProfile, refreshProfile } = useAuth();
  const supabase = createClient();

  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [city, setCity] = useState('');

  // Status & Validation states
  const [slugStatus, setSlugStatus] = useState<{
    checking: boolean;
    available?: boolean;
    error?: string;
  }>({ checking: false });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Initialize from sellerProfile
  useEffect(() => {
    if (sellerProfile) {
      setStoreName(sellerProfile.store_name || '');
      setStoreSlug(sellerProfile.store_slug || formatStoreSlug(sellerProfile.store_name || ''));
      setStoreDescription(sellerProfile.store_description || '');
      setLogoUrl(sellerProfile.logo_url || '');
      setBannerUrl(sellerProfile.banner_url || '');
      setCity(sellerProfile.city || profile?.city || '');
    }
  }, [sellerProfile, profile]);

  // Debounced slug availability checker
  const checkAvailability = useCallback(
    async (slugToCheck: string) => {
      const formatResult = validateStoreSlug(slugToCheck);
      if (!formatResult.valid) {
        setSlugStatus({ checking: false, available: false, error: formatResult.error });
        return;
      }

      // If matches existing saved slug of this user, it's valid
      if (sellerProfile?.store_slug && slugToCheck === sellerProfile.store_slug) {
        setSlugStatus({ checking: false, available: true });
        return;
      }

      setSlugStatus({ checking: true });

      try {
        // Try RPC check_store_slug_available
        const { data, error } = await supabase.rpc('check_store_slug_available', {
          p_slug: slugToCheck,
          p_seller_id: user?.id,
        });

        if (!error && data) {
          const res = data as { available: boolean; reason?: string };
          setSlugStatus({
            checking: false,
            available: res.available,
            error: res.available ? undefined : res.reason || 'Subdomain is not available',
          });
          return;
        }

        // Fallback: direct check on seller_public_profiles
        const { data: existing } = await supabase
          .from('seller_public_profiles')
          .select('id')
          .ilike('store_slug', slugToCheck)
          .neq('id', user?.id || '')
          .maybeSingle();

        if (existing) {
          setSlugStatus({
            checking: false,
            available: false,
            error: 'This subdomain is already taken by another boutique',
          });
        } else {
          setSlugStatus({ checking: false, available: true });
        }
      } catch {
        setSlugStatus({ checking: false, available: true });
      }
    },
    [sellerProfile, user, supabase]
  );

  useEffect(() => {
    if (!storeSlug) return;
    const timer = setTimeout(() => {
      checkAvailability(storeSlug);
    }, 450);
    return () => clearTimeout(timer);
  }, [storeSlug, checkAvailability]);

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Auto-clean to valid slug characters
    const cleaned = raw.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setStoreSlug(cleaned);
  };

  const handleAutoGenerateSlug = () => {
    if (!storeName.trim()) return;
    const generated = formatStoreSlug(storeName);
    setStoreSlug(generated);
  };

  const handleCopy = async () => {
    const url = getStoreUrl(storeSlug || 'my-boutique');
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    const cleanName = storeName.trim();
    if (!cleanName) {
      setSaveError('Store Name is required');
      return;
    }

    const cleanSlug = storeSlug.trim().toLowerCase();
    const slugValidation = validateStoreSlug(cleanSlug);
    if (!slugValidation.valid) {
      setSaveError(slugValidation.error || 'Please enter a valid subdomain slug');
      return;
    }

    if (slugStatus.available === false) {
      setSaveError(slugStatus.error || 'Selected subdomain is not available');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const { error } = await supabase
        .from('seller_profiles')
        .update({
          store_name: cleanName,
          store_slug: cleanSlug,
          store_description: storeDescription.trim() || null,
          logo_url: logoUrl.trim() || null,
          banner_url: bannerUrl.trim() || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      console.error('Error saving store settings:', err);
      setSaveError((err as Error).message || 'Failed to save store settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold text-neutral-900">Sign In Required</h2>
        <Link
          href="/login?redirect=/seller/store"
          className="inline-block mt-4 px-8 py-3 rounded-full bg-neutral-950 text-white font-bold text-xs"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const publicUrl = getStoreUrl(storeSlug || 'boutique');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div className="space-y-1">
          <Link
            href="/seller/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Free Boutique Feature
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full">
              Wildcard Subdomain
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-neutral-900">
            Mini-Store Branding & Subdomain
          </h1>
          <p className="text-xs text-neutral-500">
            Customize your dedicated boutique store link, brand logo, and banner on BlinkWear.
          </p>
        </div>

        {/* Live Link Button */}
        {sellerProfile?.store_slug && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="py-2.5 px-4 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>Visit Live Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Main Settings & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Settings (7 cols) */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
          {saveSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-900 text-xs font-medium">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Your store branding and subdomain settings have been saved successfully!</span>
            </div>
          )}

          {saveError && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-900 text-xs font-medium">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Subdomain Slug Card */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-2xs space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                Custom Store Subdomain
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Choose a unique web address for your boutique. Customers can browse only your approved outfits directly through this link.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
                Subdomain Slug
              </label>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 flex items-center">
                  <input
                    type="text"
                    value={storeSlug}
                    onChange={handleSlugChange}
                    placeholder="e.g. shubhamclothing"
                    maxLength={63}
                    className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs font-mono font-medium rounded-xl pl-3.5 pr-20 py-3 focus:outline-hidden focus:border-neutral-900"
                  />
                  <span className="absolute right-3.5 text-xs text-neutral-400 font-mono pointer-events-none select-none">
                    .blinkwear.in
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAutoGenerateSlug}
                  title="Generate from Store Name"
                  className="px-3 py-3 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Auto
                </button>
              </div>

              {/* Real-time validation indicator */}
              <div className="text-[11px] pt-1">
                {slugStatus.checking ? (
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Checking availability...
                  </span>
                ) : slugStatus.available ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <strong>{storeSlug}.blinkwear.in</strong> is available!
                  </span>
                ) : slugStatus.error ? (
                  <span className="text-rose-600 font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    {slugStatus.error}
                  </span>
                ) : (
                  <span className="text-neutral-400">
                    3–63 characters, lowercase letters, numbers, and single hyphens.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Store Branding Info */}
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-600" />
              Boutique Identity & Branding
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                  Store / Boutique Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. Shubham Clothing & Bridal"
                  className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs rounded-xl px-3.5 py-3 focus:outline-hidden focus:border-neutral-900 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                  About Boutique / Bio
                </label>
                <textarea
                  rows={3}
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  placeholder="Describe your design heritage, special bridal collections, lehengas, or occasion wear..."
                  className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs rounded-xl p-3.5 focus:outline-hidden focus:border-neutral-900 leading-relaxed"
                />
                <span className="text-[11px] text-neutral-400 mt-1 block">
                  Displayed on your mini-store header and in Google search previews.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                    Logo Image URL
                  </label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://.../logo.png"
                    className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs rounded-xl px-3.5 py-3 focus:outline-hidden focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                    Store Banner Image URL
                  </label>
                  <input
                    type="url"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://.../banner.jpg"
                    className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs rounded-xl px-3.5 py-3 focus:outline-hidden focus:border-neutral-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving || slugStatus.available === false}
              className="py-3 px-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Store Settings
                </>
              )}
            </button>
          </div>
        </form>

        {/* Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-24 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Live Storefront Card Preview
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Interactive Preview
              </span>
            </div>

            {/* Preview Container */}
            <div className="bg-neutral-900 rounded-3xl overflow-hidden shadow-lg border border-neutral-800 text-white">
              {/* Mini Banner */}
              <div className="relative h-28 w-full bg-linear-to-r from-emerald-950 to-neutral-950 overflow-hidden">
                {bannerUrl ? (
                  <Image
                    src={bannerUrl}
                    alt="Banner Preview"
                    fill
                    className="object-cover opacity-80"
                  />
                ) : (
                  <div className="absolute inset-0 bg-radial-gradient from-emerald-800/40 to-black/80" />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-transparent to-transparent" />
              </div>

              {/* Mini Profile Info */}
              <div className="p-5 pt-0 -mt-8 relative space-y-3">
                <div className="flex items-end gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-md border border-neutral-700 shrink-0">
                    <div className="w-full h-full rounded-xl bg-emerald-50 flex items-center justify-center overflow-hidden relative">
                      {logoUrl ? (
                        <Image
                          src={logoUrl}
                          alt="Logo Preview"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="font-serif text-2xl font-bold text-emerald-900">
                          {(storeName || 'B').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-0.5 overflow-hidden">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-serif font-bold text-base text-white truncate">
                        {storeName || 'Your Boutique Name'}
                      </h4>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    </div>
                    <p className="text-[11px] text-emerald-300 font-mono truncate">
                      {storeSlug || 'slug'}.blinkwear.in
                    </p>
                  </div>
                </div>

                <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                  {storeDescription || 'No description entered yet. Share what makes your wardrobe collection special.'}
                </p>

                <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" /> {city || 'India'}
                  </span>
                  <span className="text-emerald-400 font-semibold">Active Free Storefront</span>
                </div>
              </div>
            </div>

            {/* Quick Tip Box */}
            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 text-xs space-y-1.5">
              <h5 className="font-bold text-neutral-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                How your Mini-Store works:
              </h5>
              <p className="text-neutral-600 leading-relaxed text-[11px]">
                Your mini-store automatically features only your admin-approved, active outfits. Buyers can place rental bookings or purchase items with full Cashfree security and doorstep delivery handled by BlinkWear.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
