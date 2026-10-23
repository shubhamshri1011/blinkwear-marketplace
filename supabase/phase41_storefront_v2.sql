-- phase41_storefront_v2.sql
-- BlinkWear Phase 41: Seller Mini-Store V2 — Image upload, Premium Storefront, Customization Panel
--
-- Changes:
--   1. Add new branding/customization columns to seller_profiles
--   2. Configure storage bucket 'store-assets' (public read, allowed MIME types, 5MB limit)
--   3. Storage RLS policies: authenticated seller folder isolation {seller_id}/
--   4. Update seller_public_profiles view (approved & active sellers only, zero PII exposure)
--   5. Update get_store_by_slug RPC (approved & active sellers only)
--   6. Sanitize existing base64/data-URI values and enforce URL validity constraints
--
-- STAGING FIRST. Do NOT run directly on production.
-- DO NOT EXECUTE — manual review and apply required.

-- =============================================================================
-- 1. Add new columns to seller_profiles
-- =============================================================================

ALTER TABLE public.seller_profiles
  ADD COLUMN IF NOT EXISTS tagline            text,
  ADD COLUMN IF NOT EXISTS accent_palette     text DEFAULT 'emerald',
  ADD COLUMN IF NOT EXISTS whatsapp_number    text,
  ADD COLUMN IF NOT EXISTS instagram_handle   text,
  ADD COLUMN IF NOT EXISTS store_hours        text,
  ADD COLUMN IF NOT EXISTS speciality_tags    text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS show_about         boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_how_it_works  boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_reviews       boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_contact       boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS diwali_theme       boolean NOT NULL DEFAULT false;

-- Length / format constraints
ALTER TABLE public.seller_profiles
  DROP CONSTRAINT IF EXISTS seller_profiles_tagline_length;
ALTER TABLE public.seller_profiles
  ADD CONSTRAINT seller_profiles_tagline_length CHECK (tagline IS NULL OR length(tagline) <= 120);

ALTER TABLE public.seller_profiles
  DROP CONSTRAINT IF EXISTS seller_profiles_store_description_length;
ALTER TABLE public.seller_profiles
  ADD CONSTRAINT seller_profiles_store_description_length CHECK (store_description IS NULL OR length(store_description) <= 1000);

ALTER TABLE public.seller_profiles
  DROP CONSTRAINT IF EXISTS seller_profiles_whatsapp_format;
ALTER TABLE public.seller_profiles
  ADD CONSTRAINT seller_profiles_whatsapp_format CHECK (
    whatsapp_number IS NULL OR whatsapp_number ~ '^[+]?[0-9]{10,15}$'
  );

ALTER TABLE public.seller_profiles
  DROP CONSTRAINT IF EXISTS seller_profiles_instagram_format;
ALTER TABLE public.seller_profiles
  ADD CONSTRAINT seller_profiles_instagram_format CHECK (
    instagram_handle IS NULL OR instagram_handle ~ '^[a-zA-Z0-9_.]{1,30}$'
  );

ALTER TABLE public.seller_profiles
  DROP CONSTRAINT IF EXISTS seller_profiles_accent_palette;
ALTER TABLE public.seller_profiles
  ADD CONSTRAINT seller_profiles_accent_palette CHECK (
    accent_palette IS NULL OR accent_palette IN (
      'emerald', 'rose', 'violet', 'amber', 'sky', 'fuchsia', 'gold', 'maroon'
    )
  );

-- =============================================================================
-- 2. Sanitize existing base64 / data-URI values in logo_url / banner_url
--    (reset to NULL — safely handles legacy base64 junk without breaking rows)
-- =============================================================================

UPDATE public.seller_profiles
SET logo_url = NULL
WHERE logo_url IS NOT NULL
  AND (
    logo_url LIKE 'data:%'
    OR logo_url LIKE 'blob:%'
    OR length(logo_url) > 2000
    OR logo_url NOT LIKE 'http%'
  );

UPDATE public.seller_profiles
SET banner_url = NULL
WHERE banner_url IS NOT NULL
  AND (
    banner_url LIKE 'data:%'
    OR banner_url LIKE 'blob:%'
    OR length(banner_url) > 2000
    OR banner_url NOT LIKE 'http%'
  );

-- Enforce clean URL constraints on future writes
ALTER TABLE public.seller_profiles
  DROP CONSTRAINT IF EXISTS seller_profiles_logo_url_check;
ALTER TABLE public.seller_profiles
  ADD CONSTRAINT seller_profiles_logo_url_check CHECK (
    logo_url IS NULL OR (logo_url LIKE 'http%' AND length(logo_url) <= 2000)
  );

ALTER TABLE public.seller_profiles
  DROP CONSTRAINT IF EXISTS seller_profiles_banner_url_check;
ALTER TABLE public.seller_profiles
  ADD CONSTRAINT seller_profiles_banner_url_check CHECK (
    banner_url IS NULL OR (banner_url LIKE 'http%' AND length(banner_url) <= 2000)
  );

-- =============================================================================
-- 3. Storage Bucket Configuration: store-assets
-- =============================================================================

-- Ensure bucket exists with strict MIME and size limits
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-assets',
  'store-assets',
  true,
  5242880, -- 5 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Note: RLS on storage.objects is already enabled by default in Supabase.
-- Attempting to run 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY'
-- causes ERROR: 42501 because storage.objects is owned by supabase_storage_admin.

-- 3a. Public Read: anyone (anon + authenticated) can view images in store-assets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'store_assets_public_select'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY store_assets_public_select
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'store-assets');
    $policy$;
  END IF;
END $$;

-- 3b. Authenticated Seller INSERT: can only upload inside their own folder: {seller_id}/...
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'store_assets_seller_insert'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY store_assets_seller_insert
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'store-assets'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
    $policy$;
  END IF;
END $$;

-- 3c. Authenticated Seller UPDATE: can only update files in their own folder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'store_assets_seller_update'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY store_assets_seller_update
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'store-assets'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
    $policy$;
  END IF;
END $$;

-- 3d. Authenticated Seller DELETE: can only delete files in their own folder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'store_assets_seller_delete'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY store_assets_seller_delete
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'store-assets'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
    $policy$;
  END IF;
END $$;

-- =============================================================================
-- 4. Rebuild seller_public_profiles VIEW with safe columns & active filter
-- =============================================================================

DROP VIEW IF EXISTS public.seller_public_profiles;

CREATE VIEW public.seller_public_profiles AS
SELECT
  sp.id,
  sp.store_name,
  sp.store_slug,
  sp.store_description,
  sp.tagline,
  sp.city,
  sp.logo_url,
  sp.banner_url,
  sp.accent_palette,
  -- Contact details are only visible if the seller explicitly enabled show_contact
  CASE WHEN sp.show_contact THEN sp.whatsapp_number ELSE NULL END AS whatsapp_number,
  sp.instagram_handle,
  sp.store_hours,
  sp.speciality_tags,
  sp.show_about,
  sp.show_how_it_works,
  sp.show_reviews,
  sp.show_contact,
  sp.diwali_theme,
  -- Verified status derived from admin KYC approval
  COALESCE(sp.is_approved, false) AS is_verified,
  -- ZERO PII: bank_account, ifsc, pan, aadhaar, gst, phone, email, home address are NEVER exposed
  sp.created_at
FROM public.seller_profiles sp
WHERE sp.store_name IS NOT NULL
  AND sp.store_name <> ''
  AND COALESCE(sp.is_approved, false) = true
  AND COALESCE(sp.is_active, true) = true;

GRANT SELECT ON public.seller_public_profiles TO anon, authenticated;

-- =============================================================================
-- 5. Update get_store_by_slug RPC to enforce approved + active seller isolation
-- =============================================================================

DROP FUNCTION IF EXISTS public.get_store_by_slug(text);

CREATE OR REPLACE FUNCTION public.get_store_by_slug(p_slug text)
RETURNS TABLE (
  id                uuid,
  store_name        text,
  store_slug        text,
  store_description text,
  tagline           text,
  city              text,
  logo_url          text,
  banner_url        text,
  accent_palette    text,
  whatsapp_number   text,
  instagram_handle  text,
  store_hours       text,
  speciality_tags   text[],
  show_about        boolean,
  show_how_it_works boolean,
  show_reviews      boolean,
  show_contact      boolean,
  diwali_theme      boolean,
  is_verified       boolean,
  created_at        timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sp.id,
    sp.store_name,
    sp.store_slug,
    sp.store_description,
    sp.tagline,
    sp.city,
    -- Sanitize URL output against base64 junk
    CASE WHEN sp.logo_url LIKE 'http%' AND length(sp.logo_url) <= 2000 THEN sp.logo_url ELSE NULL END AS logo_url,
    CASE WHEN sp.banner_url LIKE 'http%' AND length(sp.banner_url) <= 2000 THEN sp.banner_url ELSE NULL END AS banner_url,
    sp.accent_palette,
    -- Contact details only returned if seller toggled show_contact ON
    CASE WHEN sp.show_contact THEN sp.whatsapp_number ELSE NULL END AS whatsapp_number,
    sp.instagram_handle,
    sp.store_hours,
    sp.speciality_tags,
    sp.show_about,
    sp.show_how_it_works,
    sp.show_reviews,
    sp.show_contact,
    sp.diwali_theme,
    COALESCE(sp.is_approved, false) AS is_verified,
    sp.created_at
  FROM public.seller_profiles sp
  WHERE LOWER(sp.store_slug) = LOWER(p_slug)
    AND sp.store_name IS NOT NULL
    AND sp.store_name <> ''
    AND COALESCE(sp.is_approved, false) = true
    AND COALESCE(sp.is_active, true) = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_store_by_slug(text) TO anon, authenticated;

-- =============================================================================
-- END phase41_storefront_v2.sql
-- =============================================================================
