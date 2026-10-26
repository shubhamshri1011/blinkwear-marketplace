/**
 * Validates that the required Supabase environment variables are present.
 *
 * Throws a descriptive error naming the missing variable instead of
 * propagating a cryptic "@supabase/ssr: supabaseKey is required" crash
 * deep inside library code.
 *
 * Call this once at the top of every Supabase client factory so that
 * misconfigured deployments fail early with actionable output.
 */
export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || url.trim() === '') {
    throw new Error(
      '[BlinkWear] Missing environment variable: NEXT_PUBLIC_SUPABASE_URL\n' +
        'Add it to .env.local (local dev) or to the Vercel project environment variables ' +
        'for Production, Preview, and Development scopes.\n' +
        'See README.md § Environment Configuration for the full list.'
    );
  }

  if (!anonKey || anonKey.trim() === '') {
    throw new Error(
      '[BlinkWear] Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY\n' +
        'Add it to .env.local (local dev) or to the Vercel project environment variables ' +
        'for Production, Preview, and Development scopes.\n' +
        'See README.md § Environment Configuration for the full list.'
    );
  }

  return { url, anonKey };
}

/**
 * Returns true when both Supabase env vars are present and non-empty.
 * Use this for graceful degradation in API routes during static builds.
 */
export function hasSupabaseEnv(): boolean {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim())
  );
}
