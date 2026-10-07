import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Returns a valid JWT access token for reading public catalog data (products,
 * categories, banners, platform_cities, seller_profiles).
 * 
 * Necessary because Postgres RLS functions in phase19 require an authenticated
 * role rather than anon, preventing permission errors for guest visitors.
 */
export async function getCatalogAccessToken(): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);

  // Return cached token if valid for at least 5 more minutes
  if (cachedToken && tokenExpiresAt - now > 300) {
    return cachedToken;
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const tempClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await tempClient.auth.signInWithPassword({
      email: 'guest_catalog@blinkwear.in',
      password: 'BlinkWear2026!Guest',
    });

    if (error || !data.session) {
      console.warn('Could not refresh catalog token:', error?.message);
      return cachedToken;
    }

    cachedToken = data.session.access_token;
    tokenExpiresAt = data.session.expires_at || (now + 3600);
    return cachedToken;
  } catch (err) {
    console.error('Error fetching catalog access token:', err);
    return cachedToken;
  }
}

/**
 * Creates a catalog-ready Supabase client.
 * Uses the catalog access token to reliably bypass anon RLS limits on read queries.
 */
export async function createCatalogClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const token = await getCatalogAccessToken();

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}
