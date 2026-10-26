// Supabase browser client for marketplace-web
// Uses @supabase/ssr for Next.js App Router compatibility
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import { getCookieDomain } from './cookie-options';
import { getSupabaseEnv, hasSupabaseEnv } from './env';

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (typeof window === 'undefined') {
    // SSR / static prerender path — if env vars are absent at build time,
    // return null gracefully so static page prerendering succeeds.
    if (!hasSupabaseEnv()) {
      return null as unknown as ReturnType<typeof createBrowserClient<Database>>;
    }
    const { url, anonKey } = getSupabaseEnv();
    const cookieDomain = getCookieDomain();
    const options = cookieDomain ? { cookieOptions: { domain: cookieDomain } } : {};
    return createBrowserClient<Database>(url, anonKey, options);
  }

  const { url, anonKey } = getSupabaseEnv();
  const cookieDomain = getCookieDomain();
  const options = cookieDomain
    ? {
        cookieOptions: {
          domain: cookieDomain,
        },
      }
    : {};

  // Browser path — reuse a singleton to avoid duplicate GoTrue instances.
  if (!client) {
    client = createBrowserClient<Database>(url, anonKey, options);
  }
  return client;
}
