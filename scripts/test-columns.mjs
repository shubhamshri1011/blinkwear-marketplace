import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

// Check profiles table (which is public readable)
const { data: profs, error: profErr } = await supabase.from('profiles').select('*').limit(1);
console.log('profiles query:', profErr ? profErr : (profs[0] ? Object.keys(profs[0]) : 'empty table'));

// Check seller_public_profiles view
const { data: spp, error: sppErr } = await supabase.from('seller_public_profiles').select('*').limit(1);
console.log('seller_public_profiles query:', sppErr ? sppErr : (spp[0] ? Object.keys(spp[0]) : 'empty view'));

// Test individual columns on seller_profiles using RPC or select with specific columns
const testCols = [
  'id', 'store_name', 'store_slug', 'is_verified', 'verification_status', 'is_active',
  'city', 'state', 'phone', 'email', 'tagline', 'store_description',
  'logo_url', 'banner_url', 'accent_palette', 'whatsapp_number', 'instagram_handle',
  'store_hours', 'speciality_tags', 'show_about', 'show_contact', 'diwali_theme',
  'is_approved', 'pan_number', 'kyc_docs'
];

console.log('\nTesting which columns exist on seller_profiles:');
for (const col of testCols) {
  const { error } = await supabase.from('seller_profiles').select(col).limit(0);
  if (error && error.message.includes('does not exist')) {
    console.log(`❌ Column DOES NOT EXIST: ${col}`);
  } else if (error && error.code === '42501') {
    // Permission denied on table means column existence cannot be checked anonymously directly,
    // let's see if error mentions the column specifically
    console.log(`🔒 Permission 42501 on column: ${col}`);
  } else if (!error) {
    console.log(`✓ Column EXISTS: ${col}`);
  } else {
    console.log(`? Column ${col}: ${error.message}`);
  }
}
