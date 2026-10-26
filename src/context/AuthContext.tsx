'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { clearClientAuthCookies } from '@/lib/supabase/cookie-options';
import type { User } from '@supabase/supabase-js';
import type { Profile, SellerProfile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  sellerProfile: SellerProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  sellerProfile: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Lazy client: only instantiated in browser / client runtime, never during SSR or static prerendering at build
  const supabase = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    return createClient();
  }, []);

  const fetchUserData = async (
    currentUser: User | null,
    clientOverride?: ReturnType<typeof createClient>
  ) => {
    if (!currentUser) {
      setProfile(null);
      setSellerProfile(null);
      setIsLoading(false);
      return;
    }

    const client = clientOverride || supabase || (typeof window !== 'undefined' ? createClient() : null);
    if (!client) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: prof, error: profError } = await client
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (!profError && prof) {
        setProfile(prof as Profile);

        if (prof.is_seller) {
          const { data: sellerProf } = await client
            .from('seller_profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

          if (sellerProf) {
            setSellerProfile(sellerProf as SellerProfile);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const client = supabase || createClient();
    if (!client) {
      setIsLoading(false);
      return;
    }

    const initAuth = async () => {
      const { data: { session } } = await client.auth.getSession();
      setUser(session?.user ?? null);
      await fetchUserData(session?.user ?? null, client);
    };

    initAuth();

    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        await fetchUserData(session?.user ?? null, client);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const refreshProfile = async () => {
    const client = supabase || (typeof window !== 'undefined' ? createClient() : null);
    if (!client) return;
    const { data: { user: currentUser } } = await client.auth.getUser();
    await fetchUserData(currentUser, client);
  };

  const signOut = async () => {
    try {
      // 1. Clear session cookies both with domain and host-only
      clearClientAuthCookies();
      // 2. Terminate Supabase session
      const client = supabase || (typeof window !== 'undefined' ? createClient() : null);
      if (client) {
        await client.auth.signOut();
      }
    } catch (err) {
      console.error('Error during signOut:', err);
    } finally {
      setUser(null);
      setProfile(null);
      setSellerProfile(null);
      // 3. Redirect to home page
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        sellerProfile,
        isLoading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
