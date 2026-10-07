'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PlatformCity } from '@/types/database';

interface CityContextType {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  availableCities: string[];
  isLoading: boolean;
}

const CityContext = createContext<CityContextType>({
  selectedCity: 'Bhopal',
  setSelectedCity: () => {},
  availableCities: ['Bhopal', 'Pune'],
  isLoading: false,
});

export const DEFAULT_CITIES = ['Bhopal', 'Pune'];

export function CityProvider({ children }: { children: React.ReactNode }) {
  const [selectedCity, setSelectedCityState] = useState<string>('Bhopal');
  const [availableCities, setAvailableCities] = useState<string[]>(DEFAULT_CITIES);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load persisted city from localStorage if present
    const saved = localStorage.getItem('blinkwear_selected_city');
    if (saved) {
      setSelectedCityState(saved);
    }

    // Fetch active cities from /api/cities
    async function fetchCities() {
      try {
        const res = await fetch('/api/cities');
        if (res.ok) {
          const json = await res.json();
          if (json.cities && json.cities.length > 0) {
            setAvailableCities(json.cities);
            if (!saved && json.cities.length > 0) {
              setSelectedCityState(json.cities[0]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching platform cities:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCities();
  }, []);

  const setSelectedCity = (city: string) => {
    setSelectedCityState(city);
    localStorage.setItem('blinkwear_selected_city', city);
  };

  return (
    <CityContext.Provider
      value={{
        selectedCity,
        setSelectedCity,
        availableCities,
        isLoading,
      }}
    >
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  return useContext(CityContext);
}
