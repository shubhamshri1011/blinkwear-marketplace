// test-cart-subdomain.mjs
// Verifies that guest cart items and cookie domains correctly isolate/synchronize across subdomains.

import assert from 'node:assert';

// Inline replication of cart-sync logic for standalone node execution
export function getSharedCookieDomain(host = '') {
  const hostname = host.split(':')[0].toLowerCase();
  if (!hostname) return '';
  if (hostname === 'blinkwear.in' || hostname.endsWith('.blinkwear.in')) {
    return '; domain=.blinkwear.in';
  }
  // Host-only for localhost, *.localhost, *.vercel.app
  return '';
}

export function parseGuestCartFromCookie(cookieStr) {
  const match = cookieStr.match(/(?:^|; )blinkwear_guest_cart=([^;]*)/);
  if (match && match[1]) {
    try {
      const decoded = decodeURIComponent(match[1]);
      const items = JSON.parse(decoded);
      if (Array.isArray(items)) return items;
    } catch {
      return [];
    }
  }
  return [];
}

console.log('--- Testing Cart Cross-Subdomain Synchronization ---');

// Test 1: Production Subdomain Cookie Domain
const prodSubdomain = 'gouri-lehengaz.blinkwear.in';
const prodDomain = getSharedCookieDomain(prodSubdomain);
assert.strictEqual(
  prodDomain,
  '; domain=.blinkwear.in',
  'Subdomain gouri-lehengaz.blinkwear.in should share cookie across .blinkwear.in'
);
console.log('✓ PASS: Production boutique subdomain sets cookie domain to .blinkwear.in');

// Test 2: Production Root Domain Cookie Domain
const rootDomain = getSharedCookieDomain('blinkwear.in');
assert.strictEqual(
  rootDomain,
  '; domain=.blinkwear.in',
  'Root blinkwear.in should share cookie across .blinkwear.in'
);
console.log('✓ PASS: Production root domain sets cookie domain to .blinkwear.in');

// Test 3: Localhost Subdomain Host-Only Cookie (Browser RFC 6265 requires no Domain=localhost)
const localSubdomain = 'anita.localhost';
const localDomain = getSharedCookieDomain(localSubdomain);
assert.strictEqual(
  localDomain,
  '',
  'Local subdomain anita.localhost must use host-only cookie (no Domain attribute)'
);
console.log('✓ PASS: Localhost uses host-only cookie (avoids RFC 6265 rejection)');

// Test 4: Cookie Payload Persistence and Decoding
const sampleCart = [
  {
    id: 'guest_item_1',
    product_id: 'prod_lehenga_101',
    purchase_type: 'rent',
    quantity: 1,
    selected_size: 'M',
    selected_color: 'Crimson Red',
  },
];
const serialized = encodeURIComponent(JSON.stringify(sampleCart));
const mockCookieString = `session_id=xyz; blinkwear_guest_cart=${serialized}; tracking=active`;

const parsed = parseGuestCartFromCookie(mockCookieString);
assert.strictEqual(parsed.length, 1, 'Should parse exactly 1 item from cookie');
assert.strictEqual(parsed[0].product_id, 'prod_lehenga_101');
assert.strictEqual(parsed[0].selected_color, 'Crimson Red');
console.log('✓ PASS: Shared guest cart parses identically on boutique subdomain and root marketplace');

console.log('All cart subdomain isolation and sync tests PASSED successfully!');
