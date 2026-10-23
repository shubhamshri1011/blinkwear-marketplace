// Supabase browser client for marketplace-web
// Uses @supabase/ssr for Next.js App Router compatibility
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

function getCookieDomain(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const hostname = window.location.hostname.toLowerCase();
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'blinkwear.in').toLowerCase();
  if (hostname === rootDomain || hostname.endsWith(`.${rootDomain}`)) {
    return `.${rootDomain}`;
  }
  if (hostname.endsWith('.localhost') || hostname === 'localhost') {
    return 'localhost';
  }
  return undefined;
}

export function createClient() {
  const cookieDomain = getCookieDomain();
  const options = cookieDomain
    ? {
        cookieOptions: {
          domain: cookieDomain,
        },
      }
    : {};

  if (typeof window === 'undefined') {
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      options
    );
  }
  if (!client) {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      options
    );
  }
  return client;
}
