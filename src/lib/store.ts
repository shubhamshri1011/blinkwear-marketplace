// Utility functions for seller mini-stores on subdomains

export const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'app',
  'www',
  'store',
  'shop',
  'blog',
  'help',
  'support',
  'auth',
  'login',
  'register',
  'dashboard',
  'checkout',
  'cart',
  'orders',
  'profile',
  'seller',
  'sellers',
  'mail',
  'status',
  'test',
  'dev',
  'stage',
  'staging',
  'preview',
  'static',
  'assets',
  'cdn',
  'terms',
  'privacy',
  'about',
  'contact',
  'blinkwear',
  'marketplace',
  'compliance',
  'ops',
  'internal',
  'root',
  'web',
  'portal',
  'account',
  'pay',
  'payments',
  'rent',
  'rental',
  'rentals',
  'buy',
  'order',
  'tracking',
  'delivery',
]);

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/;

/**
 * Validates a store subdomain slug according to DNS and platform rules.
 */
export function validateStoreSlug(slug: string): { valid: boolean; error?: string } {
  const raw = slug.trim().toLowerCase();

  if (!raw || raw.length < 3) {
    return { valid: false, error: 'Subdomain must be at least 3 characters long' };
  }

  if (raw.length > 30) {
    return { valid: false, error: 'Subdomain cannot exceed 30 characters' };
  }

  if (raw.includes('--')) {
    return { valid: false, error: 'Subdomain cannot contain consecutive hyphens' };
  }

  if (!SLUG_REGEX.test(raw)) {
    return {
      valid: false,
      error: 'Subdomain can only contain lowercase letters, numbers, and single hyphens (cannot start or end with a hyphen)',
    };
  }

  if (RESERVED_SLUGS.has(raw)) {
    return { valid: false, error: `"${raw}" is a reserved system subdomain and cannot be used` };
  }

  return { valid: true };
}

/**
 * Sanitizes and formats a store name or custom string into a valid slug preview.
 */
export function formatStoreSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
    .replace(/-+$/, '');
}

/**
 * Extracts the seller store subdomain from an incoming hostname.
 * Handles production domains (e.g. shubhamclothing.blinkwear.in),
 * local development (e.g. shubhamclothing.localhost:3000),
 * and ignores www / *.vercel.app preview domains.
 */
export function getSubdomain(host: string | null): string | null {
  if (!host) return null;

  // Strip port
  const hostname = host.split(':')[0].toLowerCase();

  // Exclude IP addresses
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return null;
  }

  // Ignore *.vercel.app deployment previews
  if (hostname.endsWith('.vercel.app')) {
    return null;
  }

  // Ignore www hosts
  if (hostname === 'www' || hostname.startsWith('www.')) {
    return null;
  }

  // 1. Local development: *.localhost
  if (hostname.endsWith('.localhost')) {
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const sub = parts[0];
      if (sub && sub !== 'localhost' && sub !== 'www' && !RESERVED_SLUGS.has(sub)) {
        return sub;
      }
    }
    return null;
  }

  // 2. Production or root domain
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'blinkwear.in')
    .toLowerCase()
    .split(':')[0];

  // Exact root domain
  if (hostname === rootDomain) {
    return null;
  }

  // Subdomain of root domain: e.g. shubhamclothing.blinkwear.in
  if (hostname.endsWith(`.${rootDomain}`)) {
    const sub = hostname.slice(0, -(rootDomain.length + 1));
    if (sub && sub !== 'www' && !RESERVED_SLUGS.has(sub)) {
      return sub;
    }
  }

  return null;
}

/**
 * Computes the public URL for a given seller store slug.
 */
export function getStoreUrl(slug: string): string {
  if (typeof window !== 'undefined') {
    const port = window.location.port ? `:${window.location.port}` : '';
    const hostname = window.location.hostname.toLowerCase();

    // If running on localhost
    if (hostname.includes('localhost')) {
      return `${window.location.protocol}//${slug}.localhost${port}`;
    }
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'blinkwear.in';
  return `https://${slug}.${rootDomain}`;
}

/**
 * Normalizes phone numbers to include country code 91 for Indian wa.me links.
 */
export function formatWhatsAppLink(phone: string, text?: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return '#';

  let normalized = digits;
  // If 10 digits (typical Indian mobile without country code), prepend 91
  if (digits.length === 10) {
    normalized = `91${digits}`;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    normalized = `91${digits.slice(1)}`;
  }

  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${normalized}${query}`;
}
