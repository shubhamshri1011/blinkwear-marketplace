'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCity } from '@/context/CityContext';
import { createClient } from '@/lib/supabase/client';
import type { Address } from '@/types/database';
import { MapPin, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AddressesPage() {
  const { user, profile } = useAuth();
  const { selectedCity } = useCity();
  const supabase = createClient();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [newAddr, setNewAddr] = useState({
    label: 'Home',
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address_line1: '',
    address_line2: '',
    city: selectedCity,
    state: selectedCity.toLowerCase() === 'bhopal' ? 'Madhya Pradesh' : 'Maharashtra',
    pincode: '',
    is_default: false,
  });

  const fetchAddresses = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (!error && data) {
        setAddresses(data as Address[]);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setActionError(null);

    try {
      const { error } = await supabase.from('addresses').insert({
        user_id: user.id,
        label: newAddr.label,
        full_name: newAddr.full_name || profile?.full_name || 'Customer',
        phone: newAddr.phone || profile?.phone || '',
        address_line1: newAddr.address_line1,
        address_line2: newAddr.address_line2 || null,
        city: newAddr.city,
        state: newAddr.state,
        pincode: newAddr.pincode,
        is_default: addresses.length === 0 || newAddr.is_default,
      });

      if (error) throw error;

      setIsAdding(false);
      setNewAddr({
        label: 'Home',
        full_name: profile?.full_name || '',
        phone: profile?.phone || '',
        address_line1: '',
        address_line2: '',
        city: selectedCity,
        state: selectedCity.toLowerCase() === 'bhopal' ? 'Madhya Pradesh' : 'Maharashtra',
        pincode: '',
        is_default: false,
      });
      await fetchAddresses();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to save address');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this address?')) return;
    try {
      await supabase.from('addresses').delete().eq('id', id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Error deleting address:', err);
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    try {
      // First uncheck all
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
      // Then check this one
      await supabase.from('addresses').update({ is_default: true }).eq('id', id);
      await fetchAddresses();
    } catch (err) {
      console.error('Error setting default:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div className="flex items-center justify-between pb-6 border-b border-neutral-100">
        <div>
          <h1 className="font-serif text-3xl font-bold text-neutral-900">Saved Addresses</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Manage your delivery and reverse pickup addresses
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="py-2.5 px-5 rounded-full bg-neutral-950 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-neutral-800 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Address
          </button>
        )}
      </div>

      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-md space-y-4">
          <h3 className="font-semibold text-sm text-neutral-900">Add New Address</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-neutral-500 block mb-1">
                Recipient Name
              </label>
              <input
                type="text"
                required
                value={newAddr.full_name}
                onChange={(e) => setNewAddr({ ...newAddr, full_name: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-500 block mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={newAddr.phone}
                onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-neutral-500 block mb-1">
              Flat / House / Building & Street
            </label>
            <input
              type="text"
              required
              value={newAddr.address_line1}
              onChange={(e) => setNewAddr({ ...newAddr, address_line1: e.target.value })}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-bold text-neutral-500 block mb-1">City</label>
              <input
                type="text"
                required
                value={newAddr.city}
                onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-500 block mb-1">State</label>
              <input
                type="text"
                required
                value={newAddr.state}
                onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-500 block mb-1">Pincode</label>
              <input
                type="text"
                required
                value={newAddr.pincode}
                onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-neutral-950 text-white font-bold text-xs"
            >
              Save Address
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-neutral-500 hover:text-neutral-900"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Address cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`p-6 rounded-3xl border bg-white shadow-2xs space-y-3 relative ${
              addr.is_default ? 'border-emerald-600 ring-1 ring-emerald-600' : 'border-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-900 text-sm">{addr.full_name}</span>
              {addr.is_default ? (
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Default Address
                </span>
              ) : (
                <button
                  onClick={() => handleSetDefault(addr.id)}
                  className="text-[11px] font-medium text-neutral-500 hover:text-neutral-900 underline"
                >
                  Set as Default
                </button>
              )}
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              {addr.address_line1}
              {addr.address_line2 ? `, ${addr.address_line2}` : ''}
              <br />
              {addr.city}, {addr.state} — {addr.pincode}
            </p>

            <p className="text-xs text-neutral-500">Phone: {addr.phone}</p>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => handleDelete(addr.id)}
                className="text-neutral-400 hover:text-rose-600 text-xs flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
