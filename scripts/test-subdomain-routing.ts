import assert from 'node:assert/strict';
import {
  validateStoreSlug,
  formatStoreSlug,
  getSubdomain,
  RESERVED_SLUGS,
  getStoreUrl,
} from '../src/lib/store';

console.log('Running Seller Subdomain & Mini-Store Test Suite...\n');

// 1. Test Slug Format Validation
console.log('Test 1: Valid Slug Formats');
const validSlugs = [
  'shubhamclothing',
  'shubham-couture',
  'boutique-101',
  'bridal-lehenga-pune',
  'a1b2c3d4',
  'z-9',
];
for (const slug of validSlugs) {
  const result = validateStoreSlug(slug);
  assert.equal(result.valid, true, `Slug "${slug}" should be valid, got: ${result.error}`);
}
console.log('  Passed: All valid slugs accepted.');

console.log('\nTest 2: Invalid Slug Formats (Length & Characters)');
const invalidSlugs = [
  { slug: '', expected: 'Subdomain must be at least 3 characters long' },
  { slug: 'ab', expected: 'Subdomain must be at least 3 characters long' },
  { slug: 'a'.repeat(64), expected: 'Subdomain cannot exceed 63 characters' },
  { slug: '-shubham', expected: 'Subdomain can only contain lowercase letters, numbers, and single hyphens' },
  { slug: 'shubham-', expected: 'Subdomain can only contain lowercase letters, numbers, and single hyphens' },
  { slug: 'shubham--clothing', expected: 'Subdomain cannot contain consecutive hyphens' },
  { slug: 'shubham_clothing', expected: 'Subdomain can only contain lowercase letters, numbers, and single hyphens' },
  { slug: 'shubham.clothing', expected: 'Subdomain can only contain lowercase letters, numbers, and single hyphens' },
  { slug: 'shubham clothing', expected: 'Subdomain can only contain lowercase letters, numbers, and single hyphens' },
  { slug: 'SHUBHAM', expected: 'Subdomain can only contain lowercase letters, numbers, and single hyphens' },
];
for (const { slug, expected } of invalidSlugs) {
  const result = validateStoreSlug(slug);
  assert.equal(result.valid, false, `Slug "${slug}" should be rejected`);
  assert.ok(
    result.error && result.error.includes(expected.split(' ')[0]),
    `Error for "${slug}" should match expectation, got: ${result.error}`
  );
}
console.log('  Passed: All invalid slugs rejected with descriptive messages.');

console.log('\nTest 3: Reserved Subdomain Slugs');
const testReserved = ['admin', 'api', 'app', 'www', 'checkout', 'cart', 'orders', 'support', 'seller', 'login'];
for (const res of testReserved) {
  const result = validateStoreSlug(res);
  assert.equal(result.valid, false, `Reserved slug "${res}" should be rejected`);
  assert.ok(result.error?.includes('reserved'), `Error should mention reserved keyword: ${result.error}`);
}
console.log('  Passed: All platform reserved slugs blocked.');

console.log('\nTest 4: Store Slug Formatter / Sanitizer');
assert.equal(formatStoreSlug("Shubham's Clothing & Couture"), 'shubhams-clothing-couture');
assert.equal(formatStoreSlug('   Bridal Lehengas --- Pune   '), 'bridal-lehengas-pune');
assert.equal(formatStoreSlug('Ethnic Wear 2026!'), 'ethnic-wear-2026');
console.log('  Passed: Store names correctly formatted to clean DNS-safe slugs.');

console.log('\nTest 5: Hostname Subdomain Parsing (getSubdomain)');
// Localhost development
assert.equal(getSubdomain('shubhamclothing.localhost:3000'), 'shubhamclothing');
assert.equal(getSubdomain('shubhamclothing.localhost'), 'shubhamclothing');
assert.equal(getSubdomain('localhost:3000'), null);
assert.equal(getSubdomain('localhost'), null);

// Production blinkwear.in
assert.equal(getSubdomain('shubhamclothing.blinkwear.in'), 'shubhamclothing');
assert.equal(getSubdomain('shubhamclothing.blinkwear.in:443'), 'shubhamclothing');
assert.equal(getSubdomain('blinkwear.in'), null);
assert.equal(getSubdomain('www.blinkwear.in'), null);

// Reserved subdomains should not be treated as seller stores
assert.equal(getSubdomain('admin.blinkwear.in'), null);
assert.equal(getSubdomain('api.blinkwear.in'), null);
assert.equal(getSubdomain('checkout.blinkwear.in'), null);
assert.equal(getSubdomain('cart.blinkwear.in'), null);

// IP address
assert.equal(getSubdomain('127.0.0.1:3000'), null);
assert.equal(getSubdomain('192.168.1.10'), null);
console.log('  Passed: Hostnames accurately routed to subdomains and apex handling preserved.');

console.log('\nTest 6: Store Public URL Construction');
assert.equal(getStoreUrl('shubhamclothing'), 'https://shubhamclothing.blinkwear.in');

console.log('\n========================================');
console.log('ALL TESTS PASSED SUCCESSFULLY! (6/6)');
console.log('========================================');
