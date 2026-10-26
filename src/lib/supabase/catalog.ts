import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { getSupabaseEnv, hasSupabaseEnv } from './env';

/**
 * Creates an anonymous Supabase client for reading public catalog data
 * (active products, categories, banners, platform cities).
 * Operates safely under the standard public/anon RLS policy without credentials.
 *
 * If environment variables are missing (e.g. during a build without env vars),
 * returns null and logs an error so callers can degrade gracefully.
 */
export function createCatalogClient() {
  if (!hasSupabaseEnv()) {
    console.error(
      '[BlinkWear] Missing Supabase environment variables for createCatalogClient. ' +
        'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
    return null;
  }

  const { url, anonKey } = getSupabaseEnv();

  return createSupabaseClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
