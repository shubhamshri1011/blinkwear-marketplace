'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

export interface ActiveServiceArea {
  state: string;
  city: string;
  is_active?: boolean;
  delivery_charge?: number | null;
  delivery_promise_text?: string | null;
}

export const DEFAULT_SERVICE_AREAS: ActiveServiceArea[] = [
  { state: 'Madhya Pradesh', city: 'Bhopal', is_active: true, delivery_charge: null, delivery_promise_text: null },
  { state: 'Maharashtra', city: 'Pune', is_active: true, delivery_charge: null, delivery_promise_text: null },
];

export const DEFAULT_CITIES = ['Bhopal', 'Pune'];

interface CityContextType {
  selectedState: string;
  selectedCity: string;
  setSelectedArea: (state: string, city: string) => void;
  setSelectedCity: (city: string) => void;
  serviceAreas: ActiveServiceArea[];
  availableStates: string[];
  getCitiesForState: (state: string) => string[];
  availableCities: string[];
  currentArea: ActiveServiceArea | undefined;
  isLoading: boolean;
}

const CityContext = createContext<CityContextType>({
  selectedState: 'Madhya Pradesh',
  selectedCity: 'Bhopal',
  setSelectedArea: () => {},
  setSelectedCity: () => {},
  serviceAreas: DEFAULT_SERVICE_AREAS,
  availableStates: ['Madhya Pradesh', 'Maharashtra'],
  getCitiesForState: () => ['Bhopal'],
  availableCities: DEFAULT_CITIES,
  currentArea: DEFAULT_SERVICE_AREAS[0],
  isLoading: false,
});

export function CityProvider({ children }: { children: React.ReactNode }) {
  const [serviceAreas, setServiceAreas] = useState<ActiveServiceArea[]>(DEFAULT_SERVICE_AREAS);
  const [selectedCity, setSelectedCityState] = useState<string>('Bhopal');
  const [selectedState, setSelectedState] = useState<string>('Madhya Pradesh');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Available unique states
  const availableStates = useMemo(() => {
    return Array.from(new Set(serviceAreas.map((a) => a.state)));
  }, [serviceAreas]);

  // Available unique cities
  const availableCities = useMemo(() => {
    return Array.from(new Set(serviceAreas.map((a) => a.city)));
  }, [serviceAreas]);

  const getCitiesForState = (state: string): string[] => {
    return serviceAreas
      .filter((a) => a.state.trim().toLowerCase() === state.trim().toLowerCase())
      .map((a) => a.city);
  };

  const currentArea = useMemo(() => {
    return serviceAreas.find(
      (a) => a.city.trim().toLowerCase() === selectedCity.trim().toLowerCase()
    );
  }, [serviceAreas, selectedCity]);

  useEffect(() => {
    const savedCity = typeof window !== 'undefined' ? localStorage.getItem('blinkwear_selected_city') : null;
    const savedState = typeof window !== 'undefined' ? localStorage.getItem('blinkwear_selected_state') : null;

    if (savedCity) {
      setSelectedCityState(savedCity);
    }
    if (savedState) {
      setSelectedState(savedState);
    }

    async function fetchAreas() {
      try {
        const res = await fetch('/api/cities');
        if (res.ok) {
          const json = await res.json();
          if (json.areas && json.areas.length > 0) {
            setServiceAreas(json.areas);
            // Verify if savedCity is valid
            const matching = json.areas.find(
              (a: ActiveServiceArea) => a.city.trim().toLowerCase() === (savedCity || 'bhopal').trim().toLowerCase()
            );
            if (matching) {
              setSelectedCityState(matching.city);
              setSelectedState(matching.state);
            } else if (json.areas[0]) {
              setSelectedCityState(json.areas[0].city);
              setSelectedState(json.areas[0].state);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching service areas:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAreas();
  }, []);

  const setSelectedArea = (state: string, city: string) => {
    setSelectedState(state);
    setSelectedCityState(city);
    if (typeof window !== 'undefined') {
      localStorage.setItem('blinkwear_selected_state', state);
      localStorage.setItem('blinkwear_selected_city', city);
    }
  };

  const setSelectedCity = (city: string) => {
    const matching = serviceAreas.find(
      (a) => a.city.trim().toLowerCase() === city.trim().toLowerCase()
    );
    const state = matching ? matching.state : selectedState;
    setSelectedArea(state, city);
  };

  return (
    <CityContext.Provider
      value={{
        selectedState,
        selectedCity,
        setSelectedArea,
        setSelectedCity,
        serviceAreas,
        availableStates,
        getCitiesForState,
        availableCities,
        currentArea,
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
