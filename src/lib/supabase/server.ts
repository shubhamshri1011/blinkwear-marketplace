import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import type { Database } from '@/types/database';
import { createCatalogClient } from './catalog';
import { getCookieDomain } from './cookie-options';
import { getSupabaseEnv } from './env';

export async function createClient() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const host = headerStore.get('x-forwarded-host') || headerStore.get('host') || '';
  const cookieDomain = getCookieDomain(host);

  const allCookies = cookieStore.getAll();

  // If the user has a Supabase auth session cookie, use SSR client with user context
  const hasUserSession = allCookies.some(
    (c) => c.name.includes('-auth-token') && c.value && c.value.length > 20
  );

  if (!hasUserSession) {
    // Guest visitor — try catalog client first
    const catalogClient = createCatalogClient();
    if (catalogClient) {
      return catalogClient;
    }
  }

  const { url, anonKey } = getSupabaseEnv();

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookieOptions: cookieDomain ? { domain: cookieDomain } : undefined,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                ...(cookieDomain ? { domain: cookieDomain } : {}),
              })
            );
          } catch {
            // Ignored when called from Server Component
          }
        },
      },
    }
  );
}

