import type { CartItemWithProduct } from '@/types/database';

export const GUEST_CART_COOKIE = 'blinkwear_guest_cart';
export const GUEST_CART_STORAGE_KEY = 'blinkwear_guest_cart';

/**
 * Computes the root cookie domain so cookies can be shared between the main
 * marketplace (blinkwear.in) and all boutique subdomains (*.blinkwear.in),
 * as well as for local development (*.localhost).
 */
export function getSharedCookieDomain(hostname?: string): string {
  const host = (hostname || (typeof window !== 'undefined' ? window.location.hostname : '')).split(':')[0].toLowerCase();
  if (!host) return '';

  if (host === 'blinkwear.in' || host.endsWith('.blinkwear.in')) {
    return '; domain=.blinkwear.in';
  }
  // Host-only for localhost, *.localhost, *.vercel.app
  return '';
}

/**
 * Reads guest cart items.
 * Prioritizes the shared cross-subdomain cookie; falls back to localStorage.
 */
export function readGuestCart(customCookie?: string): CartItemWithProduct[] {
  // 1. Check cookie first
  try {
    const cookieStr =
      customCookie !== undefined
        ? customCookie
        : typeof document !== 'undefined'
          ? document.cookie
          : '';

    const match = cookieStr.match(new RegExp(`(?:^|; )${GUEST_CART_COOKIE}=([^;]*)`));
    if (match && match[1]) {
      const decoded = decodeURIComponent(match[1]);
      const items = JSON.parse(decoded);
      if (Array.isArray(items)) {
        return items;
      }
    }
  } catch {
    // ignore json or decode parse errors
  }

  // 2. Fall back to origin-scoped localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(GUEST_CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  return [];
}

/**
 * Saves guest cart items to BOTH the cross-subdomain cookie and local storage.
 */
export function saveGuestCart(items: CartItemWithProduct[], hostname?: string): void {
  const serialized = encodeURIComponent(JSON.stringify(items));
  const domainStr = getSharedCookieDomain(hostname);
  const cookieValue = `${GUEST_CART_COOKIE}=${serialized}; path=/${domainStr}; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;

  if (typeof document !== 'undefined') {
    try {
      document.cookie = cookieValue;
    } catch (e) {
      console.error('[CartSync] Failed to set cookie:', e);
    }
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('[CartSync] Failed to write localStorage:', e);
    }
  }
}

/**
 * Clears guest cart from both cookie and local storage.
 */
export function clearGuestCart(hostname?: string): void {
  const domainStr = getSharedCookieDomain(hostname);
  const cookieValue = `${GUEST_CART_COOKIE}=; path=/${domainStr}; max-age=0; SameSite=Lax`;

  if (typeof document !== 'undefined') {
    try {
      document.cookie = cookieValue;
    } catch (e) {
      console.error('[CartSync] Failed to clear cookie:', e);
    }
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
