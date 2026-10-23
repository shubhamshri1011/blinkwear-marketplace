// src/lib/supabase/cookie-options.ts
// Unified cookie domain and options helper for Supabase Auth across:
// - Browser client (src/lib/supabase/client.ts)
// - Server client (src/lib/supabase/server.ts)
// - Middleware / Proxy (src/lib/supabase/middleware.ts & src/proxy.ts)

/**
 * Determines whether a shared root domain should be applied.
 * Set `domain: '.blinkwear.in'` ONLY when the hostname is 'blinkwear.in'
 * or ends with '.blinkwear.in'.
 *
 * In ALL other cases (localhost, *.localhost, *.vercel.app, preview URLs, IP addresses),
 * returns `undefined` so that browsers set standard host-only cookies.
 * (Browsers strictly reject `Domain=localhost` per RFC 6265).
 */
export function getCookieDomain(hostOrHostname?: string): string | undefined {
  let hostname = '';

  if (hostOrHostname) {
    // Strip port if present (e.g., "localhost:3000" -> "localhost")
    hostname = hostOrHostname.split(':')[0].toLowerCase();
  } else if (typeof window !== 'undefined') {
    hostname = window.location.hostname.toLowerCase();
  }

  if (!hostname) return undefined;

  // Only use shared domain on production blinkwear.in and its subdomains
  if (hostname === 'blinkwear.in' || hostname.endsWith('.blinkwear.in')) {
    return '.blinkwear.in';
  }

  // Every other environment (localhost, *.localhost, *.vercel.app, staging IP) is host-only
  return undefined;
}

/**
 * Returns standard cookie options for Supabase clients and cookies.set() calls.
 */
export function getSupabaseCookieOptions(hostOrHostname?: string): {
  domain?: string;
  path: string;
  sameSite: 'lax';
  maxAge: number;
} {
  const domain = getCookieDomain(hostOrHostname);
  return {
    ...(domain ? { domain } : {}),
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  };
}

/**
 * Clears all Supabase authentication and session cookies in the browser,
 * wiping BOTH host-only cookies and domain-scoped (.blinkwear.in) cookies.
 */
export function clearClientAuthCookies(): void {
  if (typeof document === 'undefined') return;

  const cookieNames: string[] = [];
  const rawCookies = document.cookie.split(';');

  for (const c of rawCookies) {
    const name = c.split('=')[0]?.trim();
    if (name && (name.includes('auth-token') || name.startsWith('sb-') || name.startsWith('blinkwear_'))) {
      cookieNames.push(name);
    }
  }

  // Paths and domains to thoroughly purge
  const paths = ['/', ''];
  const domains = [
    '', // Host-only (no domain attribute)
    '.blinkwear.in',
    'blinkwear.in',
    typeof window !== 'undefined' ? window.location.hostname : '',
  ].filter(Boolean);

  for (const name of cookieNames) {
    for (const p of paths) {
      // 1. Clear without domain (host-only)
      document.cookie = `${name}=; path=${p}; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;

      // 2. Clear with each explicit domain
      for (const d of domains) {
        document.cookie = `${name}=; path=${p}; domain=${d}; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      }
    }
  }
}
