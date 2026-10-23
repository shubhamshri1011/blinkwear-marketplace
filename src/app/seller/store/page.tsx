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
  RefreshCw,
  MapPin,
  Save,
  Phone,
  AtSign,
  Clock,
  Tag,
  Eye,
  EyeOff,
  QrCode,
  Share2,
  Palette,
  ChevronRight,
} from 'lucide-react';
import {
  validateStoreSlug,
  formatStoreSlug,
  getStoreUrl,
} from '@/lib/store';
import { ImageUploader } from '@/components/store/ImageUploader';
import type { SellerProfile } from '@/types/database';
import QRCode from 'qrcode';

// ─── Palette options ──────────────────────────────────────────────────────────
const PALETTES = [
  { id: 'emerald', label: 'Emerald', bg: '#059669', text: '#fff' },
  { id: 'rose', label: 'Rose', bg: '#e11d48', text: '#fff' },
  { id: 'violet', label: 'Violet', bg: '#7c3aed', text: '#fff' },
  { id: 'amber', label: 'Amber', bg: '#d97706', text: '#fff' },
  { id: 'sky', label: 'Sky', bg: '#0284c7', text: '#fff' },
  { id: 'fuchsia', label: 'Fuchsia', bg: '#a21caf', text: '#fff' },
  { id: 'gold', label: 'Gold', bg: '#b7791f', text: '#fff' },
  { id: 'maroon', label: 'Maroon', bg: '#7f1d1d', text: '#fff' },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sanitizeText(s: string, maxLen: number) {
  return s.replace(/<[^>]*>/g, '').slice(0, maxLen);
}

function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-neutral-100 last:border-0">
      <div>
        <p className="text-xs font-semibold text-neutral-800">{label}</p>
        <p className="text-[11px] text-neutral-400 mt-0.5">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5.5 rounded-full transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${value ? 'bg-emerald-500' : 'bg-neutral-200'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4.5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}

// ─── QR Code download helper (generated 100% client-side via qrcode) ───────────
async function downloadQr(url: string, storeName: string) {
  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: 600,
      margin: 2,
      color: {
        dark: '#111827',
        light: '#ffffff',
      },
    });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${storeName.replace(/\s+/g, '-').toLowerCase()}-boutique-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error('Failed to generate client QR code:', err);
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SellerStoreSettingsPage() {
  const router = useRouter();
  const { user, profile, sellerProfile, refreshProfile } = useAuth();
  const supabase = createClient();

  // ── Form state
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [city, setCity] = useState('');
  const [accentPalette, setAccentPalette] = useState('emerald');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [storeHours, setStoreHours] = useState('');
  const [specialityTags, setSpecialityTags] = useState('');
  const [showAbout, setShowAbout] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(true);
  const [showReviews, setShowReviews] = useState(true);
  const [showContact, setShowContact] = useState(true);
  const [diwaliTheme, setDiwaliTheme] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);

  // ── UI state
  const [slugStatus, setSlugStatus] = useState<{
    checking: boolean;
    available?: boolean;
    error?: string;
  }>({ checking: false });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeSection, setActiveSection] = useState<
    'identity' | 'branding' | 'contact' | 'visibility'
  >('identity');

  // ── Init from sellerProfile
  useEffect(() => {
    if (sellerProfile) {
      const sp = sellerProfile as typeof sellerProfile & {
        tagline?: string | null;
        accent_palette?: string | null;
        whatsapp_number?: string | null;
        instagram_handle?: string | null;
        store_hours?: string | null;
        speciality_tags?: string[] | null;
        show_about?: boolean;
        show_how_it_works?: boolean;
        show_reviews?: boolean;
        show_contact?: boolean;
        diwali_theme?: boolean;
      };
      setStoreName(sp.store_name || '');
      setStoreSlug(sp.store_slug || formatStoreSlug(sp.store_name || ''));
      setTagline(sp.tagline || '');
      setStoreDescription(sp.store_description || '');
      setLogoUrl(sp.logo_url && sp.logo_url.startsWith('http') ? sp.logo_url : null);
      setBannerUrl(sp.banner_url && sp.banner_url.startsWith('http') ? sp.banner_url : null);
      setCity(sp.city || profile?.city || '');
      setAccentPalette(sp.accent_palette || 'emerald');
      setWhatsappNumber(sp.whatsapp_number || '');
      setInstagramHandle(sp.instagram_handle || '');
      setStoreHours(sp.store_hours || '');
      setSpecialityTags((sp.speciality_tags || []).join(', '));
      setShowAbout(sp.show_about ?? true);
      setShowHowItWorks(sp.show_how_it_works ?? true);
      setShowReviews(sp.show_reviews ?? true);
      setShowContact(sp.show_contact ?? true);
      setDiwaliTheme(sp.diwali_theme ?? false);
    }
  }, [sellerProfile, profile]);

  // ── Unsaved-changes guard
  useEffect(() => {
    setHasUnsaved(true);
  }, [storeName, storeSlug, tagline, storeDescription, logoUrl, bannerUrl, city, accentPalette, whatsappNumber, instagramHandle, storeHours, specialityTags, showAbout, showHowItWorks, showReviews, showContact, diwaliTheme]);

  // ── Slug availability check
  const checkAvailability = useCallback(
    async (slugToCheck: string) => {
      const formatResult = validateStoreSlug(slugToCheck);
      if (!formatResult.valid) {
        setSlugStatus({ checking: false, available: false, error: formatResult.error });
        return;
      }
      if (sellerProfile?.store_slug && slugToCheck === sellerProfile.store_slug) {
        setSlugStatus({ checking: false, available: true });
        return;
      }
      setSlugStatus({ checking: true });
      try {
        const { data, error } = await supabase.rpc('check_store_slug_available', {
          p_slug: slugToCheck,
          p_seller_id: user?.id,
        });
        if (!error && data) {
          const res = data as { available: boolean; reason?: string };
          setSlugStatus({
            checking: false,
            available: res.available,
            error: res.available ? undefined : res.reason || 'Subdomain not available',
          });
          return;
        }
        // fallback
        const { data: existing } = await supabase
          .from('seller_public_profiles')
          .select('id')
          .ilike('store_slug', slugToCheck)
          .neq('id', user?.id || '')
          .maybeSingle();
        setSlugStatus({ checking: false, available: !existing });
      } catch {
        setSlugStatus({ checking: false, available: true });
      }
    },
    [sellerProfile, user, supabase]
  );

  useEffect(() => {
    if (!storeSlug) return;
    const t = setTimeout(() => checkAvailability(storeSlug), 450);
    return () => clearTimeout(t);
  }, [storeSlug, checkAvailability]);

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  };

  const handleAutoSlug = () => {
    const rawCandidate = storeName || sellerProfile?.store_name || profile?.full_name || '';
    if (!rawCandidate.trim()) {
      setSlugStatus({
        checking: false,
        available: false,
        error: 'Please enter a Boutique Name below first to auto-generate a slug',
      });
      return;
    }
    const generated = formatStoreSlug(rawCandidate);
    setStoreSlug(generated);
    setHasUnsaved(true);
    checkAvailability(generated);
  };

  const handleCopy = async () => {
    const url = getStoreUrl(storeSlug || 'my-boutique');
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch { /**/ }
  };

  const handleShare = async () => {
    const url = getStoreUrl(storeSlug || 'my-boutique');
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: `${storeName} on BlinkWear`, url });
        return;
      } catch { /**/ }
    }
    handleCopy();
  };

  // ── Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const cleanName = sanitizeText(storeName.trim(), 60);
    if (!cleanName || cleanName.length < 2) {
      setSaveError('Store Name must be between 2 and 60 characters');
      return;
    }
    const cleanSlug = storeSlug.trim().toLowerCase();
    const slugV = validateStoreSlug(cleanSlug);
    if (!slugV.valid) { setSaveError(slugV.error || 'Invalid subdomain slug'); return; }
    if (slugStatus.available === false) { setSaveError(slugStatus.error || 'Subdomain not available'); return; }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const tagsArr = specialityTags
      .split(',')
      .map((t) => sanitizeText(t.trim(), 30))
      .filter(Boolean)
      .slice(0, 8);

    const coreUpdatePayload: Partial<SellerProfile> = {
      store_name: cleanName,
      store_slug: cleanSlug,
      store_description: sanitizeText(storeDescription.trim(), 1000) || null,
      logo_url: logoUrl || null,
      banner_url: bannerUrl || null,
    };

    const fullUpdatePayload: Partial<SellerProfile> = {
      ...coreUpdatePayload,
      tagline: sanitizeText(tagline.trim(), 120) || null,
      accent_palette: accentPalette,
      whatsapp_number: whatsappNumber.trim() || null,
      instagram_handle: instagramHandle.trim().replace(/^@/, '') || null,
      store_hours: sanitizeText(storeHours.trim(), 100) || null,
      speciality_tags: tagsArr,
      show_about: showAbout,
      show_how_it_works: showHowItWorks,
      show_reviews: showReviews,
      show_contact: showContact,
      diwali_theme: diwaliTheme,
    };

    try {
      let { error } = await supabase
        .from('seller_profiles')
        .update(fullUpdatePayload)
        .eq('id', user.id);

      // Graceful fallback if database schema does not yet have Phase 41 V2 columns
      if (error && (error.code === '42703' || error.message?.includes('does not exist'))) {
        console.warn('Advanced Storefront V2 columns missing in database; falling back to core profile fields:', error.message);
        const fallbackRes = await supabase
          .from('seller_profiles')
          .update(coreUpdatePayload)
          .eq('id', user.id);
        error = fallbackRes.error;
        if (!error) {
          await refreshProfile();
          setSaveSuccess(true);
          setHasUnsaved(false);
          setSaveError('Boutique core identity & logo saved. (Note: extended theme/tags require applying migration phase41_storefront_v2.sql).');
          setTimeout(() => setSaveSuccess(false), 5000);
          return;
        }
      }

      if (error) throw error;
      await refreshProfile();
      setSaveSuccess(true);
      setHasUnsaved(false);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      console.error('Error saving seller store:', err);
      setSaveError((err as Error).message || 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Checklist
  const checklist = [
    { label: 'Logo uploaded', done: !!logoUrl },
    { label: 'Banner uploaded', done: !!bannerUrl },
    { label: 'Bio / description added', done: storeDescription.trim().length >= 20 },
    { label: 'Subdomain set & available', done: !!storeSlug && slugStatus.available === true },
    {
      label: 'Boutique approved by admin',
      done: !!(sellerProfile as { is_approved?: boolean } | null)?.is_approved,
    },
  ];
  const checklistDone = checklist.filter((c) => c.done).length;

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
  const accentColor = PALETTES.find((p) => p.id === accentPalette)?.bg || '#059669';
  const initialsChar = (storeName || 'B').charAt(0).toUpperCase();

  // ── Nav sections
  const SECTIONS = [
    { id: 'identity' as const, label: 'Identity & Subdomain', icon: Globe },
    { id: 'branding' as const, label: 'Logo & Banner', icon: Palette },
    { id: 'contact' as const, label: 'Contact & Social', icon: Phone },
    { id: 'visibility' as const, label: 'Sections & Theme', icon: Eye },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200 mb-8">
        <div className="space-y-1">
          <Link
            href="/seller/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Free Boutique
            </span>
            {hasUnsaved && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                Unsaved changes
              </span>
            )}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900">
            My Boutique Settings
          </h1>
          <p className="text-xs text-neutral-500">
            Customize your branded mini-store on BlinkWear.
          </p>
        </div>

        {/* Action buttons */}
        {sellerProfile?.store_slug && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => downloadQr(publicUrl, storeName || 'boutique')}
              title="Download QR code"
              className="py-2.5 px-3.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" /> QR Code
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="py-2.5 px-3.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="py-2.5 px-4 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'Copied!' : 'Copy Link'}
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              Visit Store <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── Left sidebar: nav + checklist ── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Section nav */}
          <nav className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-semibold transition-colors border-b border-neutral-100 last:border-0
                    ${activeSection === s.id ? 'bg-neutral-950 text-white' : 'text-neutral-600 hover:bg-neutral-50'}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {s.label}
                  {activeSection !== s.id && (
                    <ChevronRight className="w-3.5 h-3.5 ml-auto text-neutral-400" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Launch Checklist */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Launch Checklist
              </span>
              <span className="text-xs font-bold text-neutral-500">
                {checklistDone}/{checklist.length}
              </span>
            </div>
            {/* Progress */}
            <div className="h-1.5 bg-neutral-100 rounded-full mb-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${(checklistDone / checklist.length) * 100}%` }}
              />
            </div>
            <ul className="space-y-1.5">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-[11px]">
                  {item.done ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-neutral-300 shrink-0" />
                  )}
                  <span className={item.done ? 'text-neutral-500 line-through' : 'text-neutral-700 font-medium'}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Main form ── */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-5 space-y-5"
          noValidate
        >
          {saveSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-900 text-xs font-medium">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              Settings saved! Your boutique is live.
            </div>
          )}
          {saveError && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-900 text-xs font-medium">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              {saveError}
            </div>
          )}

          {/* ── IDENTITY SECTION ── */}
          {activeSection === 'identity' && (
            <div className="space-y-5">
              {/* Subdomain */}
              <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-600" /> Custom Subdomain
                </h3>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
                    Subdomain Slug <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 flex items-center">
                      <input
                        type="text"
                        value={storeSlug}
                        onChange={handleSlugChange}
                        placeholder="e.g. gouri-lehengaz"
                        maxLength={30}
                        className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs font-mono font-medium rounded-xl pl-3.5 pr-24 py-3 focus:outline-none focus:border-neutral-900"
                      />
                      <span className="absolute right-3.5 text-xs text-neutral-400 font-mono pointer-events-none select-none">
                        .blinkwear.in
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoSlug}
                      title="Auto-generate from boutique name"
                      className="px-3 py-3 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Auto
                    </button>
                  </div>
                  <div className="text-[11px] pt-0.5">
                    {slugStatus.checking ? (
                      <span className="text-neutral-400 flex items-center gap-1.5">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Checking…
                      </span>
                    ) : slugStatus.available ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        {storeSlug}.blinkwear.in is available!
                      </span>
                    ) : slugStatus.error ? (
                      <span className="text-rose-600 font-medium flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> {slugStatus.error}
                      </span>
                    ) : (
                      <span className="text-neutral-400">3–30 characters, lowercase, numbers, hyphens.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Store info */}
              <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-2xs space-y-4">
                <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-600" /> Boutique Identity
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
                      placeholder="e.g. Gouri Lehengaz Bridal"
                      maxLength={80}
                      className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs rounded-xl px-3.5 py-3 focus:outline-none focus:border-neutral-900 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                      Tagline
                    </label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="e.g. Where every occasion becomes unforgettable"
                      maxLength={120}
                      className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs rounded-xl px-3.5 py-3 focus:outline-none focus:border-neutral-900 font-medium"
                    />
                    <span className="text-[11px] text-neutral-400 mt-1 block">{tagline.length}/120</span>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                      About / Bio
                    </label>
                    <textarea
                      rows={4}
                      value={storeDescription}
                      onChange={(e) => setStoreDescription(e.target.value)}
                      maxLength={1000}
                      placeholder="Your design heritage, bridal speciality, occasion wear, years of experience…"
                      className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs rounded-xl p-3.5 focus:outline-none focus:border-neutral-900 leading-relaxed resize-none"
                    />
                    <span className="text-[11px] text-neutral-400 mt-0.5 block">{storeDescription.length}/1000</span>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" /> Speciality Tags
                    </label>
                    <input
                      type="text"
                      value={specialityTags}
                      onChange={(e) => setSpecialityTags(e.target.value)}
                      placeholder="Bridal, Lehenga, Saree, Indo-Western (comma separated)"
                      maxLength={300}
                      className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs rounded-xl px-3.5 py-3 focus:outline-none focus:border-neutral-900"
                    />
                    <span className="text-[11px] text-neutral-400 mt-1 block">Max 8 tags, comma-separated.</span>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Bhopal"
                      maxLength={60}
                      className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs rounded-xl px-3.5 py-3 focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>
              </div>

              {/* Accent palette */}
              <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-2xs">
                <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2 mb-4">
                  <Palette className="w-4 h-4 text-emerald-600" /> Brand Accent Color
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {PALETTES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      title={p.label}
                      onClick={() => setAccentPalette(p.id)}
                      style={{ backgroundColor: p.bg }}
                      className={`w-9 h-9 rounded-xl transition-all shrink-0 ${accentPalette === p.id ? 'ring-2 ring-offset-2 ring-neutral-900 scale-110' : 'hover:scale-105'}`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-neutral-400 mt-3">
                  Selected: <strong className="text-neutral-700">{PALETTES.find((p) => p.id === accentPalette)?.label}</strong> — used for CTAs and highlights on your storefront.
                </p>
              </div>
            </div>
          )}

          {/* ── BRANDING SECTION ── */}
          {activeSection === 'branding' && (
            <div className="space-y-5">
              <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-2xs space-y-6">
                <h3 className="font-bold text-sm text-neutral-900">Logo Image</h3>
                {user && (
                  <ImageUploader
                    variant="logo"
                    sellerId={user.id}
                    currentUrl={logoUrl}
                    onUploadComplete={(url) => { setLogoUrl(url); }}
                    onRemove={() => setLogoUrl(null)}
                  />
                )}
              </div>
              <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-2xs space-y-6">
                <h3 className="font-bold text-sm text-neutral-900">Banner Image</h3>
                {user && (
                  <ImageUploader
                    variant="banner"
                    sellerId={user.id}
                    currentUrl={bannerUrl}
                    onUploadComplete={(url) => { setBannerUrl(url); }}
                    onRemove={() => setBannerUrl(null)}
                  />
                )}
              </div>
            </div>
          )}

          {/* ── CONTACT SECTION ── */}
          {activeSection === 'contact' && (
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" /> Contact & Social
              </h3>
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 leading-relaxed">
                ⚠ These details are shown publicly on your storefront only when "Show Contact" is turned on. Use only a business WhatsApp number.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                    WhatsApp Number (optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value.replace(/[^+0-9]/g, ''))}
                      placeholder="+91 98765 43210"
                      maxLength={16}
                      className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs rounded-xl pl-9 pr-3.5 py-3 focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                    Instagram Handle (optional)
                  </label>
                  <div className="relative">
                    <AtSign className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value.replace(/^@/, ''))}
                      placeholder="your_boutique"
                      maxLength={30}
                      className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs rounded-xl pl-9 pr-3.5 py-3 focus:outline-none focus:border-neutral-900 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Store Hours (optional)
                  </label>
                  <input
                    type="text"
                    value={storeHours}
                    onChange={(e) => setStoreHours(e.target.value)}
                    placeholder="Mon–Sat 10am–8pm, Sun 11am–6pm"
                    maxLength={200}
                    className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs rounded-xl px-3.5 py-3 focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── VISIBILITY SECTION ── */}
          {activeSection === 'visibility' && (
            <div className="space-y-5">
              <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-2xs">
                <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2 mb-4">
                  <Eye className="w-4 h-4 text-emerald-600" /> Section Visibility
                </h3>
                <ToggleRow
                  label="About Boutique"
                  hint="Show your bio and speciality tags"
                  value={showAbout}
                  onChange={setShowAbout}
                />
                <ToggleRow
                  label="How Renting Works"
                  hint="Show the 5-step rental process guide"
                  value={showHowItWorks}
                  onChange={setShowHowItWorks}
                />
                <ToggleRow
                  label="Reviews & Ratings"
                  hint="Show customer reviews (hidden if none)"
                  value={showReviews}
                  onChange={setShowReviews}
                />
                <ToggleRow
                  label="Contact & Location"
                  hint="Show WhatsApp, Instagram, city, hours"
                  value={showContact}
                  onChange={setShowContact}
                />
              </div>
              <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-amber-900 flex items-center gap-2">
                      ✨ Diwali Festive Theme
                    </h3>
                    <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                      Adds a subtle gold/maroon festive accent and a diya motif to your storefront hero. Switch off anytime.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={diwaliTheme}
                    onClick={() => setDiwaliTheme(!diwaliTheme)}
                    className={`relative w-10 h-5.5 rounded-full transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${diwaliTheme ? 'bg-amber-500' : 'bg-neutral-200'}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${diwaliTheme ? 'translate-x-4.5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Save button */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {hasUnsaved && (
              <span className="text-[11px] text-amber-600 font-medium">You have unsaved changes.</span>
            )}
            <button
              type="submit"
              disabled={isSaving || slugStatus.available === false}
              className="ml-auto py-3 px-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Settings
                </>
              )}
            </button>
          </div>
        </form>

        {/* ── Right: Live Preview ── */}
        <div className="lg:col-span-4 space-y-4">
          <div className="sticky top-24 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Live Preview
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Updates live
              </span>
            </div>

            {/* Storefront mini-preview */}
            <div
              className={`rounded-3xl overflow-hidden shadow-lg border border-neutral-200 text-white ${diwaliTheme ? 'bg-neutral-950 ring-1 ring-amber-500/30' : 'bg-neutral-900'}`}
            >
              {/* Banner */}
              <div className="relative h-24 w-full overflow-hidden">
                {bannerUrl ? (
                  <Image
                    src={bannerUrl}
                    alt="Banner Preview"
                    fill
                    className="object-cover opacity-80"
                    sizes="400px"
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: diwaliTheme
                        ? 'linear-gradient(135deg, #7f1d1d 0%, #b7791f 50%, #1a1a1a 100%)'
                        : `linear-gradient(135deg, ${accentColor}55 0%, #0a0a0a 100%)`,
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
                {diwaliTheme && (
                  <div className="absolute top-2 right-3 text-amber-400 text-lg opacity-70">🪔</div>
                )}
              </div>

              {/* Profile */}
              <div className="px-5 pb-5 -mt-7 relative space-y-3">
                <div className="flex items-end gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-md border border-neutral-700 shrink-0">
                    <div className="w-full h-full rounded-xl overflow-hidden relative flex items-center justify-center"
                         style={{ backgroundColor: `${accentColor}20` }}>
                      {logoUrl ? (
                        <Image src={logoUrl} alt="Logo" fill className="object-cover" sizes="80px" />
                      ) : (
                        <span className="font-serif text-2xl font-bold" style={{ color: accentColor }}>
                          {initialsChar}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-serif font-bold text-sm text-white truncate">
                        {storeName || 'Your Boutique Name'}
                      </h4>
                      <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                    </div>
                    {tagline && (
                      <p className="text-[10px] text-neutral-300 italic truncate">{tagline}</p>
                    )}
                    <p className="text-[10px] font-mono" style={{ color: accentColor }}>
                      {storeSlug || 'slug'}.blinkwear.in
                    </p>
                  </div>
                </div>

                {storeDescription && (
                  <p className="text-[10px] text-neutral-300 line-clamp-2 leading-relaxed">
                    {storeDescription}
                  </p>
                )}

                <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[10px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-emerald-400" /> {city || 'India'}
                  </span>
                  <span style={{ color: accentColor }} className="font-semibold">
                    {diwaliTheme ? '✨ Diwali Special' : 'Active Storefront'}
                  </span>
                </div>
              </div>
            </div>

            {/* Palette preview */}
            <div
              className="rounded-2xl px-4 py-3 text-xs font-bold text-center shadow-sm"
              style={{ backgroundColor: accentColor, color: '#fff' }}
            >
              Browse Collection →
            </div>

            {/* Sections on/off summary */}
            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100">
              <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2.5">Visible Sections</p>
              <div className="space-y-1.5">
                {[
                  { label: 'Hero + Collection', on: true, forced: true },
                  { label: 'About Boutique', on: showAbout },
                  { label: 'How Renting Works', on: showHowItWorks },
                  { label: 'Reviews', on: showReviews },
                  { label: 'Contact & Location', on: showContact },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2 text-[11px]">
                    {s.on ? (
                      <Eye className="w-3 h-3 text-emerald-500 shrink-0" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-neutral-300 shrink-0" />
                    )}
                    <span className={s.on ? 'text-neutral-700 font-medium' : 'text-neutral-300'}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
