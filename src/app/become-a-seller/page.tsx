'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCity } from '@/context/CityContext';
import { createClient } from '@/lib/supabase/client';
import {
  Store,
  Sparkles,
  ShieldCheck,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Upload,
  FileText,
  X,
  Clock,
  ArrowRight,
  CreditCard,
  Building2,
  Lock,
} from 'lucide-react';

interface DocFile {
  file: File;
  preview: string;
}

function DocUploadSlot({
  label,
  description,
  required,
  value,
  onChange,
}: {
  label: string;
  description: string;
  required: boolean;
  value: DocFile | null;
  onChange: (f: DocFile | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5 MB. Please choose a smaller file.');
      return;
    }
    const preview = URL.createObjectURL(file);
    onChange({ file, preview });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-neutral-800">
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </p>
          <p className="text-[10px] text-neutral-500 leading-relaxed mt-0.5">{description}</p>
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-1 text-neutral-400 hover:text-rose-500 shrink-0"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {value ? (
        <div className="relative h-32 rounded-xl overflow-hidden border border-emerald-300 bg-emerald-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.preview} alt={label} className="w-full h-full object-cover" />
          <div className="absolute bottom-0 inset-x-0 bg-emerald-800/85 text-white text-[10px] font-semibold text-center py-1 truncate px-2">
            ✓ {value.file.name}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="h-32 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors flex flex-col items-center justify-center gap-1.5 text-neutral-500 hover:text-emerald-700"
        >
          <Upload className="w-5 h-5 text-neutral-400" />
          <span className="text-xs font-semibold">Click to upload {label}</span>
          <span className="text-[10px] text-neutral-400">JPG, PNG, WEBP (Max 5 MB)</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

export default function BecomeASellerPage() {
  const router = useRouter();
  const { user, profile, sellerProfile, refreshProfile } = useAuth();
  const { availableCities, selectedCity } = useCity();
  const supabase = createClient();

  // Basic info (Step 1)
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [businessAddress, setBusinessAddress] = useState('');
  const [city, setCity] = useState(profile?.city || selectedCity || 'Bhopal');
  const [state, setState] = useState('Madhya Pradesh');
  const [pincode, setPincode] = useState('');
  const [businessType, setBusinessType] = useState('Individual Closet Owner');
  const [storeDescription, setStoreDescription] = useState('');

  // KYC (Step 2)
  const [panNumber, setPanNumber] = useState('');
  const [panFront, setPanFront] = useState<DocFile | null>(null);

  // Secondary ID Selection: 'aadhaar' or 'govt_id'
  const [secondaryIdType, setSecondaryIdType] = useState<'aadhaar' | 'govt_id'>('aadhaar');

  // If Aadhaar
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarFront, setAadhaarFront] = useState<DocFile | null>(null);
  const [aadhaarBack, setAadhaarBack] = useState<DocFile | null>(null);

  // If Other Govt ID / Utility
  const [govtDocType, setGovtDocType] = useState('Driving License');
  const [govtDocNumber, setGovtDocNumber] = useState('');
  const [govtIdFront, setGovtIdFront] = useState<DocFile | null>(null);
  const [govtIdBack, setGovtIdBack] = useState<DocFile | null>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // City → state mapping
  const cityStateMap: Record<string, string> = {
    Bhopal: 'Madhya Pradesh',
    Pune: 'Maharashtra',
  };

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    setState(cityStateMap[newCity] || 'Madhya Pradesh');
  };

  // If not logged in
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-neutral-900">Partner With BlinkWear</h2>
        <p className="text-sm text-neutral-500 mt-2 max-w-md mx-auto">
          Please sign in to your BlinkWear account before submitting your seller partner application.
        </p>
        <Link
          href="/login?redirect=/become-a-seller"
          className="inline-block mt-6 px-8 py-3 rounded-full bg-neutral-950 text-white font-bold text-xs shadow-md"
        >
          Sign In to Apply
        </Link>
      </div>
    );
  }

  // If already registered
  if (profile?.is_seller && sellerProfile) {
    const isPending = sellerProfile.verification_status === 'pending' || !sellerProfile.is_verified;
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
            isPending ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {isPending ? <Clock className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
        </div>

        <div>
          <span
            className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
              isPending ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {isPending ? 'Application Pending Admin Verification' : 'Verified Partner'}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 mt-3">
            {isPending ? 'Your Seller Application is Under Review' : 'You are a Registered BlinkWear Seller'}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2 max-w-md mx-auto">
            Store: <strong className="text-neutral-900">{sellerProfile.store_name}</strong> • City:{' '}
            <strong className="text-neutral-900">{sellerProfile.city}</strong>
          </p>
        </div>

        {isPending && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 max-w-lg mx-auto text-left space-y-2">
            <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              Compulsory Admin KYC Verification In Progress
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              Every seller account on BlinkWear undergoes mandatory identity & document review. Your
              submitted PAN card and identity documents are queued for verification.
            </p>
            <p className="text-[11px] text-amber-700">
              Expected review turnaround: <strong>24 to 48 business hours</strong>. Once verified by
              an administrator in the Admin Panel, your store and listed outfits will become active
              and visible to buyers.
            </p>
          </div>
        )}

        <div className="pt-2 flex justify-center gap-3">
          <Link
            href="/seller/dashboard"
            className="px-6 py-2.5 rounded-full bg-neutral-950 text-white font-bold text-xs shadow-md"
          >
            Open Seller Dashboard →
          </Link>
          <Link
            href="/seller/products/new"
            className="px-6 py-2.5 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-md"
          >
            Draft a New Listing
          </Link>
        </div>
      </div>
    );
  }

  // Upload a document file to seller-assets bucket (private bucket)
  const ALLOWED_KYC_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_KYC_SIZE = 5 * 1024 * 1024; // 5 MB

  const uploadDoc = async (docFile: DocFile, docName: string): Promise<string | null> => {
    if (!user) return null;

    // Client-side validation: MIME type
    if (!ALLOWED_KYC_TYPES.includes(docFile.file.type)) {
      setErrorMessage(
        `"${docFile.file.name}" is not a supported format. Please upload a JPEG, PNG, or WebP image. PDFs and other document formats are not accepted — take a photo or scan of your document instead.`
      );
      return null;
    }

    // Client-side validation: file size
    if (docFile.file.size > MAX_KYC_SIZE) {
      setErrorMessage(
        `"${docFile.file.name}" exceeds the 5 MB size limit. Please compress or resize the image and try again.`
      );
      return null;
    }

    const ext = docFile.file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/kyc/${docName}_${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from('seller-assets')
      .upload(path, docFile.file, { cacheControl: '3600', upsert: true });

    if (error || !data) {
      console.error(`Error uploading ${docName}:`, error);
      return null;
    }

    // Store storage path in DB (never temporary signed URLs)
    return path;
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please provide a valid 10-digit mobile number.');
      return;
    }
    if (!storeName.trim()) {
      setErrorMessage('Please provide your Store / Boutique name.');
      return;
    }
    if (!businessAddress.trim() || !pincode.trim()) {
      setErrorMessage('Please fill in complete street address and pincode.');
      return;
    }
    setErrorMessage(null);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    // 1. Validate Compulsory PAN
    const cleanPan = panNumber.trim().toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!cleanPan || !panRegex.test(cleanPan)) {
      setErrorMessage('Please provide a valid 10-character alphanumeric PAN number (e.g. ABCDE1234F).');
      setIsLoading(false);
      return;
    }
    if (!panFront) {
      setErrorMessage('PAN Card photo (front) is compulsory.');
      setIsLoading(false);
      return;
    }

    // 2. Validate Compulsory Secondary ID (Aadhaar or Other Govt ID/Utility)
    if (secondaryIdType === 'aadhaar') {
      const cleanAadhaar = aadhaarNumber.replace(/\D/g, '');
      if (cleanAadhaar.length !== 12) {
        setErrorMessage('Please provide a valid 12-digit Aadhaar number.');
        setIsLoading(false);
        return;
      }
      if (!aadhaarFront) {
        setErrorMessage('Aadhaar Card Front photo is compulsory.');
        setIsLoading(false);
        return;
      }
      if (!aadhaarBack) {
        setErrorMessage('Aadhaar Card Back photo is compulsory.');
        setIsLoading(false);
        return;
      }
    } else {
      if (!govtDocNumber.trim()) {
        setErrorMessage(`Please provide the document/ID number for ${govtDocType}.`);
        setIsLoading(false);
        return;
      }
      if (!govtIdFront) {
        setErrorMessage(`Front photo of your ${govtDocType} is compulsory.`);
        setIsLoading(false);
        return;
      }
      if (!govtIdBack) {
        setErrorMessage(`Back photo (or second page) of your ${govtDocType} is compulsory.`);
        setIsLoading(false);
        return;
      }
    }

    try {
      // Upload all mandatory documents
      const panFrontUrl = await uploadDoc(panFront, 'pan_front');
      if (!panFrontUrl) throw new Error('Failed to upload PAN card photo. Please try again.');

      let idFrontUrl: string | null = null;
      let idBackUrl: string | null = null;

      if (secondaryIdType === 'aadhaar') {
        const [aFront, aBack] = await Promise.all([
          uploadDoc(aadhaarFront!, 'aadhaar_front'),
          uploadDoc(aadhaarBack!, 'aadhaar_back'),
        ]);
        if (!aFront || !aBack) throw new Error('Failed to upload Aadhaar card images. Please try again.');
        idFrontUrl = aFront;
        idBackUrl = aBack;
      } else {
        const [gFront, gBack] = await Promise.all([
          uploadDoc(govtIdFront!, 'govtid_front'),
          uploadDoc(govtIdBack!, 'govtid_back'),
        ]);
        if (!gFront || !gBack) throw new Error(`Failed to upload ${govtDocType} images. Please try again.`);
        idFrontUrl = gFront;
        idBackUrl = gBack;
      }

      // Build structured KYC metadata stored in logo_url for admin review
      const kycMeta = {
        pan_number: cleanPan,
        pan_front_url: panFrontUrl,
        id_type: secondaryIdType,
        id_name: secondaryIdType === 'aadhaar' ? 'Aadhaar Card' : govtDocType,
        id_number: secondaryIdType === 'aadhaar' ? aadhaarNumber.replace(/\D/g, '') : govtDocNumber.trim(),
        id_front_url: idFrontUrl,
        id_back_url: idBackUrl,
        submitted_at: new Date().toISOString(),
      };

      const cleanPhone = phone.replace(/\D/g, '');

      // Check if seller profile already exists
      const { data: existing } = await supabase
        .from('seller_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      let sellerError;
      if (existing) {
        const { error } = await supabase
          .from('seller_profiles')
          .update({
            store_name: storeName.trim(),
            owner_name: ownerName.trim(),
            email: email.trim(),
            phone: cleanPhone,
            business_address: businessAddress.trim(),
            city,
            state,
            pincode: pincode.trim(),
            business_type: businessType,
            store_description: storeDescription.trim() || null,
            pan_number: cleanPan,
            kyc_docs: kycMeta,
            is_active: false,
          })
          .eq('id', user.id);
        sellerError = error;
      } else {
        const { error } = await supabase.from('seller_profiles').insert({
          id: user.id,
          store_name: storeName.trim(),
          owner_name: ownerName.trim(),
          email: email.trim(),
          phone: cleanPhone,
          business_address: businessAddress.trim(),
          city,
          state,
          pincode: pincode.trim(),
          business_type: businessType,
          store_description: storeDescription.trim() || null,
          pan_number: cleanPan,
          kyc_docs: kycMeta,
          is_active: false,
        });
        sellerError = error;
      }

      if (sellerError) throw sellerError;

      // Update user profile to mark seller applicant
      await supabase
        .from('profiles')
        .update({
          is_seller: true,
          active_role: 'seller',
        })
        .eq('id', user.id);

      await refreshProfile();
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      console.error('Seller submission error:', err);
      const msg = err instanceof Error ? err.message : 'Application submission failed';
      setErrorMessage(`Submission error: ${msg}. Please try again or contact support.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
          Status: Pending Admin Verification
        </span>
        <h2 className="font-serif text-3xl font-bold text-neutral-900">Application Submitted!</h2>
        <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
          Your BlinkWear Seller application and mandatory KYC documents (PAN + Identity Proof) have
          been received.
        </p>
        <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 text-left text-xs space-y-2 max-w-md mx-auto text-neutral-700">
          <p className="font-semibold text-neutral-900">What happens next?</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-600">
            <li>BlinkWear Admins review and verify your identity documents from the Admin Panel.</li>
            <li>Your account enters <strong>Verified</strong> status upon approval.</li>
            <li>Any garments you list will be moderated and made live for buyers.</li>
          </ul>
        </div>
        <div className="pt-4 flex justify-center gap-4 flex-wrap">
          <Link
            href="/seller/dashboard"
            className="px-8 py-3 rounded-full bg-neutral-950 text-white font-bold text-xs shadow-md"
          >
            Go to Seller Dashboard
          </Link>
          <Link
            href="/products"
            className="px-8 py-3 rounded-full border border-neutral-200 text-neutral-700 font-bold text-xs hover:bg-neutral-50"
          >
            Browse Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Title */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
          BlinkWear Partner Onboarding
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-neutral-950">
          Register as a Verified Seller
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-xl mx-auto leading-relaxed">
          Monetize your luxury wardrobe. Every seller account requires compulsory PAN + Identity KYC
          and admin verification to maintain our trusted marketplace standard.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
            step === 1
              ? 'border-neutral-950 bg-neutral-950 text-white'
              : 'border-neutral-200 bg-neutral-50 text-neutral-600'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
            1
          </span>
          Store & Business Details
        </button>

        <span className="text-neutral-300">→</span>

        <button
          type="button"
          disabled={step < 2}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
            step === 2
              ? 'border-neutral-950 bg-neutral-950 text-white'
              : 'border-neutral-200 bg-neutral-50 text-neutral-400'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
            2
          </span>
          Compulsory KYC Documents
        </button>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: Store & Owner Details */}
      {step === 1 && (
        <form onSubmit={handleStep1Next} className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-10 space-y-6 shadow-2xs">
          <div>
            <h3 className="font-serif text-xl font-bold text-neutral-900">1. Store & Contact Details</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Basic store and dispatch location info for buyer orders.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Store / Boutique Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Couture Closet Bhopal"
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-xs bg-neutral-50 focus:bg-white focus:outline-hidden focus:border-neutral-950"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Owner Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="As per PAN card"
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-xs bg-neutral-50 focus:bg-white focus:outline-hidden focus:border-neutral-950"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Contact Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-xs bg-neutral-50 focus:bg-white focus:outline-hidden focus:border-neutral-950"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Contact Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-xs bg-neutral-50 focus:bg-white focus:outline-hidden focus:border-neutral-950"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Operating Hub City <span className="text-rose-500">*</span>
              </label>
              <select
                value={city}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-xs bg-neutral-50 focus:bg-white focus:outline-hidden focus:border-neutral-950"
              >
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">State</label>
              <input
                type="text"
                disabled
                value={state}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-xs bg-neutral-100 text-neutral-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Pincode <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="e.g. 462001"
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-xs bg-neutral-50 focus:bg-white focus:outline-hidden focus:border-neutral-950"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1">
              Dispatch & Pickup Street Address <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              placeholder="Flat / Building, Street, Landmark for delivery agents to pick up rental items"
              className="w-full rounded-xl border border-neutral-200 p-3 text-xs bg-neutral-50 focus:bg-white focus:outline-hidden focus:border-neutral-950"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Business Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-xs bg-neutral-50 focus:bg-white focus:outline-hidden focus:border-neutral-950"
              >
                <option value="Individual Closet Owner">Individual Closet Owner (Private Wardrobe)</option>
                <option value="Designer Atelier / Boutique">Designer Atelier / Boutique</option>
                <option value="Bridal Rental Store">Bridal & Wedding Rental Store</option>
                <option value="Costume / Production House">Costume / Production House</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Collection Summary (Optional)
              </label>
              <input
                type="text"
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                placeholder="e.g. Sabyasachi bridal lehengas, groom sherwanis"
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-xs bg-neutral-50 focus:bg-white focus:outline-hidden focus:border-neutral-950"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-8 py-3 rounded-full bg-neutral-950 text-white font-bold text-xs flex items-center gap-2 hover:bg-neutral-800 transition-colors shadow-md"
            >
              Continue to KYC Verification <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: Compulsory KYC Documents */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-10 space-y-8 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                Compulsory Compliance
              </span>
              <span className="text-[10px] text-neutral-500">Government KYC Requirement</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-neutral-900 mt-1">
              2. Compulsory KYC Identity Documents
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              To protect both buyers and sellers, all BlinkWear seller partners must upload a valid PAN
              and an approved Identity Proof. Both front and back images are mandatory where applicable.
            </p>
          </div>

          {/* Section A: PAN CARD (Compulsory) */}
          <div className="border border-neutral-200 rounded-2xl p-5 sm:p-6 space-y-4 bg-neutral-50/50">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-700" />
              <div>
                <h4 className="text-sm font-bold text-neutral-900">
                  Document 1: PAN Card <span className="text-rose-500">*</span>
                </h4>
                <p className="text-[11px] text-neutral-500">
                  Mandatory for tax compliance, fraud prevention, and seller payout settlements.
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                PAN Card Number (10 Alphanumeric Characters) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={10}
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                className="w-full sm:w-80 rounded-xl border border-neutral-300 px-3 py-2 text-xs font-mono uppercase bg-white focus:outline-hidden focus:border-neutral-950"
              />
            </div>

            <DocUploadSlot
              label="PAN Card Photo (Front)"
              description="Clear photo or scanned copy showing your PAN number, name, and photo clearly."
              required={true}
              value={panFront}
              onChange={setPanFront}
            />
          </div>

          {/* Section B: Secondary ID (Aadhaar OR Another Govt ID/Utility) */}
          <div className="border border-neutral-200 rounded-2xl p-5 sm:p-6 space-y-5 bg-neutral-50/50">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-700" />
              <div>
                <h4 className="text-sm font-bold text-neutral-900">
                  Document 2: Identity & Address Proof <span className="text-rose-500">*</span>
                </h4>
                <p className="text-[11px] text-neutral-500">
                  Select either Aadhaar Card OR another official Government ID / Utility Document. Front
                  and back images are mandatory.
                </p>
              </div>
            </div>

            {/* Document Choice Switcher */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSecondaryIdType('aadhaar')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  secondaryIdType === 'aadhaar'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                    secondaryIdType === 'aadhaar' ? 'border-emerald-600 bg-emerald-600' : 'border-neutral-300'
                  }`}
                >
                  {secondaryIdType === 'aadhaar' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900">Aadhaar Card (Recommended)</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    12-digit UIDAI card. Front and Back photos mandatory.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSecondaryIdType('govt_id')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  secondaryIdType === 'govt_id'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                    secondaryIdType === 'govt_id' ? 'border-emerald-600 bg-emerald-600' : 'border-neutral-300'
                  }`}
                >
                  {secondaryIdType === 'govt_id' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900">Other Government ID / Utility Document</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    Driving License, Voter ID, Passport, or Recent Utility Bill.
                  </p>
                </div>
              </button>
            </div>

            {/* Sub-section: Aadhaar Card Form */}
            {secondaryIdType === 'aadhaar' && (
              <div className="space-y-4 pt-2 border-t border-neutral-200">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Aadhaar Number (12 Digits) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    value={aadhaarNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                      setAadhaarNumber(val);
                    }}
                    placeholder="XXXX XXXX XXXX"
                    className="w-full sm:w-80 rounded-xl border border-neutral-300 px-3 py-2 text-xs font-mono bg-white focus:outline-hidden focus:border-neutral-950"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DocUploadSlot
                    label="Aadhaar Card Photo (Front)"
                    description="Front side showing name, photo, and 12-digit number clearly."
                    required={true}
                    value={aadhaarFront}
                    onChange={setAadhaarFront}
                  />

                  <DocUploadSlot
                    label="Aadhaar Card Photo (Back)"
                    description="Back side showing registered residential address and QR code clearly."
                    required={true}
                    value={aadhaarBack}
                    onChange={setAadhaarBack}
                  />
                </div>
              </div>
            )}

            {/* Sub-section: Other Govt ID / Utility Form */}
            {secondaryIdType === 'govt_id' && (
              <div className="space-y-4 pt-2 border-t border-neutral-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-neutral-700 block mb-1">
                      Document Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={govtDocType}
                      onChange={(e) => setGovtDocType(e.target.value)}
                      className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs bg-white focus:outline-hidden focus:border-neutral-950"
                    >
                      <option value="Driving License">Driving License</option>
                      <option value="Voter ID (Election Card)">Voter ID (Election Card)</option>
                      <option value="Passport">Passport</option>
                      <option value="Electricity / Water Utility Bill">Electricity / Water Utility Bill (Recent 3 Mos)</option>
                      <option value="Rent / Lease Agreement">Registered Rent / Lease Agreement</option>
                      <option value="Municipal Trade License">Municipal Trade / Shop License</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-700 block mb-1">
                      Document / Identifier Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={govtDocNumber}
                      onChange={(e) => setGovtDocNumber(e.target.value)}
                      placeholder="e.g. DL / Voter ID / Consumer Account No."
                      className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs bg-white focus:outline-hidden focus:border-neutral-950"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DocUploadSlot
                    label={`${govtDocType} (Front / Page 1)`}
                    description={`Front face or main page of your ${govtDocType}.`}
                    required={true}
                    value={govtIdFront}
                    onChange={setGovtIdFront}
                  />

                  <DocUploadSlot
                    label={`${govtDocType} (Back / Page 2)`}
                    description={`Back side or second page showing address details.`}
                    required={true}
                    value={govtIdBack}
                    onChange={setGovtIdBack}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Security & Confidentiality Notice */}
          <div className="rounded-2xl bg-neutral-50 p-4 border border-neutral-200 text-xs text-neutral-600 flex items-start gap-3">
            <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Strict Confidentiality:</strong> Your identity documents are encrypted and accessible
              only by verified BlinkWear Compliance Admins for seller account approval and payout validation.
              They are never displayed publicly to buyers.
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-2.5 rounded-full border border-neutral-200 text-neutral-700 font-bold text-xs hover:bg-neutral-50 transition-colors"
            >
              ← Back to Details
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50 shadow-md"
            >
              {isLoading ? (
                <span>Submitting KYC Application…</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Submit KYC for Admin Verification
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
