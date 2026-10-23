import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

const { data, error } = await supabase.from('seller_profiles').select('*').limit(1);
if (error) {
  console.log('Error querying seller_profiles:', error);
} else {
  console.log('seller_profiles columns in DB:');
  if (data && data[0]) {
    console.log(Object.keys(data[0]));
  } else {
    console.log('No rows in seller_profiles, checking empty select');
  }
}

// Let's check profiles table
const { data: profData, error: profError } = await supabase.from('profiles').select('*').limit(1);
if (profError) {
  console.log('Error querying profiles:', profError);
} else {
  console.log('profiles columns in DB:');
  if (profData && profData[0]) {
    console.log(Object.keys(profData[0]));
  }
}
