'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCity } from '@/context/CityContext';
import { createClient } from '@/lib/supabase/client';
import { User, Phone, MapPin, Mail, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { availableCities } = useCity();
  const supabase = createClient();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [city, setCity] = useState(profile?.city || 'Bhopal');

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setCity(profile.city || 'Bhopal');
    }
  }, [profile]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold text-neutral-900">Please Sign In</h2>
        <Link href="/login?redirect=/profile" className="inline-block mt-4 px-8 py-3 rounded-full bg-neutral-950 text-white font-bold text-xs">
          Sign In
        </Link>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanPhone = phone.replace(/\D/g, '');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: cleanPhone,
          city,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      setSuccessMessage('Profile information successfully updated!');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div className="pb-6 border-b border-neutral-100">
        <h1 className="font-serif text-3xl font-bold text-neutral-900">Account Profile</h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Manage your contact credentials and preferred rental delivery hub
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-2xs space-y-6">
        <div>
          <label className="text-xs font-bold text-neutral-700 block mb-1">
            Registered Email
          </label>
          <input
            type="email"
            disabled
            value={user.email || ''}
            className="w-full bg-neutral-100 text-neutral-500 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs cursor-not-allowed"
          />
          <p className="text-[10px] text-neutral-400 mt-1">Email cannot be changed.</p>
        </div>

        <div>
          <label className="text-xs font-bold text-neutral-700 block mb-1">
            Full Name
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-hidden focus:border-neutral-900"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-neutral-700 block mb-1">
            Mobile Number
          </label>
          <input
            type="tel"
            required
            placeholder="10-digit number"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-hidden focus:border-neutral-900"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-neutral-700 block mb-1">
            Primary City Hub
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            aria-label="Select primary city hub"
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-hidden focus:border-neutral-900"
          >
            {availableCities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
          <Link
            href="/addresses"
            className="text-xs font-semibold text-neutral-700 hover:text-neutral-950 underline"
          >
            Manage Saved Delivery Addresses →
          </Link>

          <button
            type="submit"
            disabled={isSaving}
            className="py-3 px-8 rounded-full bg-neutral-950 text-white font-bold text-xs hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving Changes...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
