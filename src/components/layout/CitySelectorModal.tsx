'use client';

import React, { useState } from 'react';
import { useCity } from '@/context/CityContext';
import { MapPin, X, Check } from 'lucide-react';

interface CitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CitySelectorModal({ isOpen, onClose }: CitySelectorModalProps) {
  const {
    selectedState,
    selectedCity,
    setSelectedArea,
    availableStates,
    getCitiesForState,
  } = useCity();

  const [activeStateTab, setActiveStateTab] = useState<string>(selectedState);

  if (!isOpen) return null;

  const citiesInState = getCitiesForState(activeStateTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Select Service Area</h3>
              <p className="text-xs text-neutral-500">Choose state and delivery city</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Select State */}
        <div className="px-6 pt-5 pb-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
            Step 1: Select State
          </label>
          <div className="grid grid-cols-2 gap-2">
            {availableStates.map((st) => {
              const isActive = activeStateTab.toLowerCase() === st.toLowerCase();
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setActiveStateTab(st)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    isActive
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                      : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Select City in State */}
        <div className="px-6 py-4 space-y-2.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
            Step 2: Select City in {activeStateTab}
          </label>

          <div className="space-y-2">
            {citiesInState.map((city) => {
              const isSelected =
                selectedCity.trim().toLowerCase() === city.trim().toLowerCase() &&
                selectedState.trim().toLowerCase() === activeStateTab.trim().toLowerCase();

              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    setSelectedArea(activeStateTab, city);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 text-neutral-950 font-semibold shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-neutral-300'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className="text-sm font-semibold">{city}</span>
                      <p className="text-[11px] text-neutral-500 font-normal">{activeStateTab}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                      <Check className="w-3.5 h-3.5" /> Selected
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clean Footer */}
        <div className="px-6 py-3.5 bg-neutral-50 border-t border-neutral-100 text-[11px] text-neutral-500 text-center">
          Delivering exclusively in Pune (Maharashtra) and Bhopal (Madhya Pradesh).
        </div>
      </div>
    </div>
  );
}
