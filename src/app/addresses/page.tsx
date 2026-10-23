'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCity } from '@/context/CityContext';
import { createClient } from '@/lib/supabase/client';
import type { Address } from '@/types/database';
import { MapPin, Plus, Trash2, Edit2, CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function AddressesPage() {
  const { user, profile } = useAuth();
  const {
    selectedCity,
    selectedState,
    availableStates,
    getCitiesForState,
    serviceAreas,
  } = useCity();
  const supabase = createClient();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingAddr, setEditingAddr] = useState<Address | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [newAddr, setNewAddr] = useState({
    label: 'Home',
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address_line1: '',
    address_line2: '',
    state: selectedState,
    city: selectedCity,
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

  const isAddressServiceable = (addr: Address) => {
    return serviceAreas.some(
      (a) => a.city.trim().toLowerCase() === (addr.city || '').trim().toLowerCase()
    );
  };

  const validateAddressForm = (form: {
    phone: string;
    pincode: string;
    state: string;
    city: string;
    address_line1: string;
  }) => {
    if (!form.address_line1.trim()) {
      return 'Please enter address line 1.';
    }
    const cleanPhone = form.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return 'Please enter a valid 10-digit mobile number.';
    }
    const cleanPincode = form.pincode.replace(/\D/g, '');
    if (cleanPincode.length !== 6) {
      return 'Please enter a valid 6-digit postal pincode.';
    }
    if (!form.state || !form.city) {
      return 'Please select a valid state and city.';
    }
    return null;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setActionError(null);

    const validationErr = validateAddressForm(newAddr);
    if (validationErr) {
      setActionError(validationErr);
      return;
    }

    try {
      const { error } = await supabase.from('addresses').insert({
        user_id: user.id,
        label: newAddr.label,
        full_name: newAddr.full_name || profile?.full_name || 'Customer',
        phone: newAddr.phone.replace(/\D/g, '').slice(0, 10),
        address_line1: newAddr.address_line1.trim(),
        address_line2: newAddr.address_line2?.trim() || null,
        city: newAddr.city.trim(),
        state: newAddr.state.trim(),
        pincode: newAddr.pincode.replace(/\D/g, '').slice(0, 6),
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
        state: selectedState,
        city: selectedCity,
        pincode: '',
        is_default: false,
      });
      await fetchAddresses();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to save address');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingAddr) return;
    setActionError(null);

    const validationErr = validateAddressForm(editingAddr);
    if (validationErr) {
      setActionError(validationErr);
      return;
    }

    try {
      const { error } = await supabase
        .from('addresses')
        .update({
          label: editingAddr.label,
          full_name: editingAddr.full_name,
          phone: editingAddr.phone.replace(/\D/g, '').slice(0, 10),
          address_line1: editingAddr.address_line1.trim(),
          address_line2: editingAddr.address_line2?.trim() || null,
          city: editingAddr.city.trim(),
          state: editingAddr.state.trim(),
          pincode: editingAddr.pincode.replace(/\D/g, '').slice(0, 6),
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingAddr.id);

      if (error) throw error;

      setEditingAddr(null);
      await fetchAddresses();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to update address');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this address? Past orders and rentals keep their existing delivery snapshot.')) return;
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
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
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
            Manage your delivery and reverse pickup addresses for Pune & Bhopal
          </p>
        </div>

        {!isAdding && !editingAddr && (
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

      {/* Add Address Form */}
      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <h3 className="font-semibold text-sm text-neutral-900">Add New Address</h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="p-1 text-neutral-400 hover:text-neutral-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-neutral-500 block mb-1">Recipient Name</label>
              <input
                type="text"
                required
                value={newAddr.full_name}
                onChange={(e) => setNewAddr({ ...newAddr, full_name: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-500 block mb-1">Phone Number (10 Digits)</label>
              <input
                type="tel"
                required
                placeholder="10-digit mobile number"
                value={newAddr.phone}
                onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-neutral-500 block mb-1">Flat / House / Building & Street</label>
            <input
              type="text"
              required
              value={newAddr.address_line1}
              onChange={(e) => setNewAddr({ ...newAddr, address_line1: e.target.value })}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-neutral-500 block mb-1">Landmark / Area (Optional)</label>
            <input
              type="text"
              value={newAddr.address_line2}
              onChange={(e) => setNewAddr({ ...newAddr, address_line2: e.target.value })}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-bold text-neutral-500 block mb-1">State</label>
              <select
                value={newAddr.state}
                onChange={(e) => {
                  const st = e.target.value;
                  const cities = getCitiesForState(st);
                  setNewAddr({ ...newAddr, state: st, city: cities[0] || '' });
                }}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
              >
                {availableStates.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-500 block mb-1">City</label>
              <select
                value={newAddr.city}
                onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
              >
                {getCitiesForState(newAddr.state).map((ct) => (
                  <option key={ct} value={ct}>{ct}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-500 block mb-1">Pincode (6 Digits)</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="6-digit pincode"
                value={newAddr.pincode}
                onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
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

      {/* Edit Address Form Modal / Box */}
      {editingAddr && (
        <form onSubmit={handleUpdate} className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-900 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <h3 className="font-semibold text-sm text-neutral-900">Edit Address</h3>
            <button
              type="button"
              onClick={() => setEditingAddr(null)}
              className="p-1 text-neutral-400 hover:text-neutral-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-neutral-500 block mb-1">Recipient Name</label>
              <input
                type="text"
                required
                value={editingAddr.full_name}
                onChange={(e) => setEditingAddr({ ...editingAddr, full_name: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-500 block mb-1">Phone Number (10 Digits)</label>
              <input
                type="tel"
                required
                value={editingAddr.phone}
                onChange={(e) => setEditingAddr({ ...editingAddr, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-neutral-500 block mb-1">Flat / House / Building & Street</label>
            <input
              type="text"
              required
              value={editingAddr.address_line1}
              onChange={(e) => setEditingAddr({ ...editingAddr, address_line1: e.target.value })}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-neutral-500 block mb-1">Landmark / Area (Optional)</label>
            <input
              type="text"
              value={editingAddr.address_line2 || ''}
              onChange={(e) => setEditingAddr({ ...editingAddr, address_line2: e.target.value })}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-bold text-neutral-500 block mb-1">State</label>
              <select
                value={editingAddr.state}
                onChange={(e) => {
                  const st = e.target.value;
                  const cities = getCitiesForState(st);
                  setEditingAddr({ ...editingAddr, state: st, city: cities[0] || '' });
                }}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
              >
                {availableStates.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-500 block mb-1">City</label>
              <select
                value={editingAddr.city}
                onChange={(e) => setEditingAddr({ ...editingAddr, city: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
              >
                {getCitiesForState(editingAddr.state).map((ct) => (
                  <option key={ct} value={ct}>{ct}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-500 block mb-1">Pincode (6 Digits)</label>
              <input
                type="text"
                required
                maxLength={6}
                value={editingAddr.pincode}
                onChange={(e) => setEditingAddr({ ...editingAddr, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-neutral-950 text-white font-bold text-xs"
            >
              Update Address
            </button>
            <button
              type="button"
              onClick={() => setEditingAddr(null)}
              className="text-xs text-neutral-500 hover:text-neutral-900"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Address cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => {
          const isServiceable = isAddressServiceable(addr);
          return (
            <div
              key={addr.id}
              className={`p-6 rounded-3xl border bg-white shadow-2xs space-y-3 relative ${
                !isServiceable
                  ? 'border-neutral-200 bg-neutral-50/50'
                  : addr.is_default
                  ? 'border-emerald-600 ring-1 ring-emerald-600'
                  : 'border-neutral-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-900 text-sm">{addr.full_name}</span>
                <div className="flex items-center gap-2">
                  {!isServiceable && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                      Not Serviceable
                    </span>
                  )}
                  {addr.is_default ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-[11px] font-medium text-neutral-500 hover:text-neutral-900 underline"
                    >
                      Set Default
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-neutral-600 leading-relaxed">
                {addr.address_line1}
                {addr.address_line2 ? `, ${addr.address_line2}` : ''}
                <br />
                {addr.city}, {addr.state} — {addr.pincode}
              </p>

              <p className="text-xs text-neutral-500">Phone: {addr.phone}</p>

              {!isServiceable && (
                <p className="text-[11px] text-rose-600 font-medium">
                  This address is outside BlinkWear service areas (Pune & Bhopal).
                </p>
              )}

              <div className="pt-2 flex justify-end items-center gap-3">
                <button
                  onClick={() => setEditingAddr(addr)}
                  className="text-neutral-500 hover:text-neutral-900 text-xs flex items-center gap-1 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="text-neutral-400 hover:text-rose-600 text-xs flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
