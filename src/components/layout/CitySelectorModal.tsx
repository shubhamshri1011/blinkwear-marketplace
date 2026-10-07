'use client';

import React from 'react';
import { useCity } from '@/context/CityContext';
import { MapPin, X, Check } from 'lucide-react';

interface CitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CitySelectorModal({ isOpen, onClose }: CitySelectorModalProps) {
  const { selectedCity, setSelectedCity, availableCities } = useCity();

  if (!isOpen) return null;

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
              <h3 className="text-lg font-semibold text-neutral-900">Select Your City</h3>
              <p className="text-xs text-neutral-500">Rentals are delivered within the same city</p>
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

        {/* City Options */}
        <div className="p-6 space-y-3">
          {availableCities.map((city) => {
            const isSelected = selectedCity.toLowerCase() === city.toLowerCase();
            return (
              <button
                key={city}
                type="button"
                onClick={() => {
                  setSelectedCity(city);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
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
                    <span className="text-base">{city}</span>
                    <p className="text-xs text-neutral-500 font-normal">
                      {city.toLowerCase() === 'bhopal' ? 'Madhya Pradesh' : city.toLowerCase() === 'pune' ? 'Maharashtra' : 'Active Region'}
                    </p>
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

        {/* Footer info */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 text-xs text-neutral-500 text-center">
          Looking for other locations? BlinkWear is expanding rapidly across India!
        </div>
      </div>
    </div>
  );
}
