import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
import { createCatalogClient } from './catalog';

export async function createClient() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // If the user has a Supabase auth session cookie, use SSR client with user context
  const hasUserSession = allCookies.some(
    (c) => c.name.includes('-auth-token') && c.value && c.value.length > 20
  );

  if (!hasUserSession) {
    // Guest visitor — use the catalog client so public catalog queries
    // succeed without RLS permission errors.
    return createCatalogClient();
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored when called from Server Component
          }
        },
      },
    }
  );
}
