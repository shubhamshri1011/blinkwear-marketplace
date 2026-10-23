// scripts/diagnose-supabase.mjs
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

const url = env['NEXT_PUBLIC_SUPABASE_URL'];
const key = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

console.log('--- Testing Supabase Connection & Schema Queries ---');
console.log('Supabase URL:', url);

const supabase = createClient(url, key);

// Test 1: Check public schema access
const { data: catData, error: catErr } = await supabase.from('categories').select('id, name, slug').limit(2);
if (catErr) {
  console.error('❌ Categories query failed:', catErr);
} else {
  console.log('✓ Categories query succeeded:', catData.length, 'categories found');
}

// Test 2: Check products table
const { data: prodData, error: prodErr } = await supabase.from('products').select('id, title, status').limit(2);
if (prodErr) {
  console.error('❌ Products query failed:', prodErr);
} else {
  console.log('✓ Products query succeeded:', prodData.length, 'products found');
}

// Test 3: Check seller_profiles columns
const { data: spData, error: spErr } = await supabase.from('seller_profiles').select('id, store_name, store_slug, is_approved, is_active').limit(1);
if (spErr) {
  console.error('❌ seller_profiles query failed:', spErr);
} else {
  console.log('✓ seller_profiles query succeeded:', spData ? spData.length : 0, 'rows found');
}

// Test 4: Check if new columns exist on seller_profiles
const { data: newCols, error: newColsErr } = await supabase
  .from('seller_profiles')
  .select('id, store_hours, speciality_tags, show_about, show_how_it_works, show_reviews, show_contact, diwali_theme, accent_palette')
  .limit(1);

if (newColsErr) {
  console.error('❌ New Storefront V2 columns missing on seller_profiles:', newColsErr.message);
} else {
  console.log('✓ Storefront V2 columns EXIST on seller_profiles');
}

// Test 5: Check RPC check_store_slug_available
const { data: rpcData, error: rpcErr } = await supabase.rpc('check_store_slug_available', {
  p_slug: 'test-slug',
  p_seller_id: '00000000-0000-0000-0000-000000000000'
});
if (rpcErr) {
  console.error('❌ RPC check_store_slug_available failed or missing:', rpcErr.message);
} else {
  console.log('✓ RPC check_store_slug_available succeeded:', rpcData);
}

// Test 6: Check slug_blocklist table
const { data: blData, error: blErr } = await supabase.from('slug_blocklist').select('slug').limit(2);
if (blErr) {
  console.error('❌ Table slug_blocklist missing or inaccessible:', blErr.message);
} else {
  console.log('✓ Table slug_blocklist exists:', blData.length, 'records found');
}
