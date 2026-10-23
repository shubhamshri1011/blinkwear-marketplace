-- phase41b_hardening.sql
-- BlinkWear Phase 41B: Security Hardening & Storefront V2 Refinement
--
-- DO NOT RUN DIRECTLY ON PRODUCTION. Apply to Staging first for review.
--
-- Highlights:
--   1. Protect seller_profiles: sellers cannot alter is_approved, is_active, is_verified, verification_status, kyc_docs.
--   2. DB-level slug regex check, unique lowercase index, and brand/reserved slug blocklist table + trigger.
--   3. Storage RLS: seller-own-folder SELECT policy (prevents listing competitor folders).
--   4. Column constraints: HTTPS store-assets URLs, max 8 speciality tags, length limits.
--   5. Gate instagram_handle with show_contact in public view & RPC.
--   6. Allow store owner to preview unapproved store while isolating from public.

-- =============================================================================
-- 1. Protect Privileged Fields in seller_profiles
-- =============================================================================

CREATE OR REPLACE FUNCTION public.protect_seller_profile_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Service role, postgres superuser, or verified admins may edit anything
  IF auth.uid() IS NULL 
     OR current_user IN ('postgres', 'service_role')
     OR (auth.jwt() ->> 'role') = 'service_role'
     OR current_setting('request.jwt.claim.role', true) = 'service_role'
     OR public.is_current_user_admin()
  THEN
    RETURN NEW;
  END IF;

  -- Normal sellers cannot alter their approval, active, or verification state
  IF NEW.is_approved IS DISTINCT FROM OLD.is_approved THEN
    RAISE EXCEPTION 'Only an admin or service role can change seller approval status.';
  END IF;

  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    RAISE EXCEPTION 'Only an admin or service role can change seller active status.';
  END IF;

  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
    RAISE EXCEPTION 'Only an admin or service role can change seller verification flag.';
  END IF;

  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
    RAISE EXCEPTION 'Only an admin or service role can change seller verification status.';
  END IF;

  IF NEW.verified_at IS DISTINCT FROM OLD.verified_at THEN
    RAISE EXCEPTION 'Only an admin or service role can change seller verified timestamp.';
  END IF;

  IF NEW.kyc_docs IS DISTINCT FROM OLD.kyc_docs THEN
    RAISE EXCEPTION 'Only an admin or service role can alter verified KYC documents.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_seller_profile_privileged_fields ON public.seller_profiles;
CREATE TRIGGER trg_protect_seller_profile_privileged_fields
BEFORE UPDATE ON public.seller_profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_seller_profile_privileged_fields();

-- =============================================================================
-- 2. DB-Level Store Slug Enforcement & Brand Blocklist
-- =============================================================================

-- 2a. Strict Regex Check (3 to 30 characters, lowercase alphanumeric and hyphens, no trailing/leading hyphen)
ALTER TABLE public.seller_profiles
  DROP CONSTRAINT IF EXISTS seller_profiles_store_slug_format;

ALTER TABLE public.seller_profiles
  ADD CONSTRAINT seller_profiles_store_slug_format CHECK (
    store_slug IS NULL OR store_slug ~ '^[a-z0-9]([a-z0-9-]{1,28})[a-z0-9]$'
  );

-- 2b. Unique index on LOWER(store_slug)
CREATE UNIQUE INDEX IF NOT EXISTS idx_seller_profiles_lower_store_slug
  ON public.seller_profiles (LOWER(store_slug))
  WHERE store_slug IS NOT NULL;

-- 2c. Brand & Reserved Slugs Blocklist Table
CREATE TABLE IF NOT EXISTS public.slug_blocklist (
  slug text PRIMARY KEY,
  reason text NOT NULL DEFAULT 'reserved',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.slug_blocklist ENABLE ROW LEVEL SECURITY;

-- Allow public read of blocklist so client validation can query availability
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'slug_blocklist' AND policyname = 'slug_blocklist_read'
  ) THEN
    CREATE POLICY slug_blocklist_read ON public.slug_blocklist FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

-- Populate reserved system subdomains & luxury brand trademarks
INSERT INTO public.slug_blocklist (slug, reason)
VALUES
  ('admin', 'reserved_system'),
  ('api', 'reserved_system'),
  ('app', 'reserved_system'),
  ('www', 'reserved_system'),
  ('store', 'reserved_system'),
  ('shop', 'reserved_system'),
  ('blog', 'reserved_system'),
  ('help', 'reserved_system'),
  ('support', 'reserved_system'),
  ('auth', 'reserved_system'),
  ('login', 'reserved_system'),
  ('register', 'reserved_system'),
  ('dashboard', 'reserved_system'),
  ('checkout', 'reserved_system'),
  ('cart', 'reserved_system'),
  ('orders', 'reserved_system'),
  ('profile', 'reserved_system'),
  ('seller', 'reserved_system'),
  ('sellers', 'reserved_system'),
  ('mail', 'reserved_system'),
  ('status', 'reserved_system'),
  ('test', 'reserved_system'),
  ('dev', 'reserved_system'),
  ('stage', 'reserved_system'),
  ('staging', 'reserved_system'),
  ('preview', 'reserved_system'),
  ('static', 'reserved_system'),
  ('assets', 'reserved_system'),
  ('cdn', 'reserved_system'),
  ('terms', 'reserved_system'),
  ('privacy', 'reserved_system'),
  ('about', 'reserved_system'),
  ('contact', 'reserved_system'),
  ('blinkwear', 'trademark'),
  ('marketplace', 'reserved_system'),
  ('compliance', 'reserved_system'),
  ('ops', 'reserved_system'),
  ('internal', 'reserved_system'),
  ('root', 'reserved_system'),
  ('web', 'reserved_system'),
  ('portal', 'reserved_system'),
  ('account', 'reserved_system'),
  ('pay', 'reserved_system'),
  ('payments', 'reserved_system'),
  ('rent', 'reserved_system'),
  ('rental', 'reserved_system'),
  ('rentals', 'reserved_system'),
  ('buy', 'reserved_system'),
  ('order', 'reserved_system'),
  ('tracking', 'reserved_system'),
  ('delivery', 'reserved_system'),
  -- Protected fashion / luxury brands
  ('sabyasachi', 'trademark'),
  ('manishmalhotra', 'trademark'),
  ('taruntahiliani', 'trademark'),
  ('anitadongre', 'trademark'),
  ('abujanisandeepkhosla', 'trademark'),
  ('ritukumar', 'trademark'),
  ('gucci', 'trademark'),
  ('louisvuitton', 'trademark'),
  ('chanel', 'trademark'),
  ('dior', 'trademark'),
  ('prada', 'trademark'),
  ('zara', 'trademark'),
  ('rolex', 'trademark')
ON CONFLICT (slug) DO NOTHING;

-- 2d. Trigger on seller_profiles to reject blocklisted slugs
CREATE OR REPLACE FUNCTION public.check_seller_slug_blocklist()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.store_slug IS NOT NULL THEN
    NEW.store_slug := LOWER(TRIM(NEW.store_slug));

    IF EXISTS (
      SELECT 1 FROM public.slug_blocklist
      WHERE LOWER(slug) = NEW.store_slug
    ) THEN
      RAISE EXCEPTION 'Subdomain "%" is reserved or trademarked and cannot be used.', NEW.store_slug;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_seller_slug_blocklist ON public.seller_profiles;
CREATE TRIGGER trg_check_seller_slug_blocklist
BEFORE INSERT OR UPDATE OF store_slug ON public.seller_profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_seller_slug_blocklist();

-- =============================================================================
-- 3. Storage Security: Folder-Isolated SELECT & Removal of ALTER TABLE RLS
-- =============================================================================

-- Drop overly broad public select on storage.objects if it exists
DROP POLICY IF EXISTS store_assets_public_select ON storage.objects;

-- Sellers can only list/browse files in their OWN folder: {auth.uid()}/...
-- (Public image downloads via CDN URLs still work because the bucket itself has public=true)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'store_assets_seller_select'
  ) THEN
    CREATE POLICY store_assets_seller_select
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'store-assets'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- =============================================================================
-- 4. Tighten URL, Tag, and Length Checks
-- =============================================================================

-- 4a. Store Name Length (2 to 60 characters)
ALTER TABLE public.seller_profiles
  DROP CONSTRAINT IF EXISTS seller_profiles_store_name_length;
ALTER TABLE public.seller_profiles
  ADD CONSTRAINT seller_profiles_store_name_length CHECK (
    store_name IS NULL OR (length(trim(store_name)) >= 2 AND length(store_name) <= 60)
  );

-- 4b. Store Hours Length (max 100 characters)
ALTER TABLE public.seller_profiles
  DROP CONSTRAINT IF EXISTS seller_profiles_store_hours_length;
ALTER TABLE public.seller_profiles
  ADD CONSTRAINT seller_profiles_store_hours_length CHECK (
    store_hours IS NULL OR length(store_hours) <= 100
  );

-- 4c. Speciality Tags Limit (maximum 8 items)
ALTER TABLE public.seller_profiles
  DROP CONSTRAINT IF EXISTS seller_profiles_speciality_tags_count;
ALTER TABLE public.seller_profiles
  ADD CONSTRAINT seller_profiles_speciality_tags_count CHECK (
    speciality_tags IS NULL OR cardinality(speciality_tags) <= 8
  );

-- 4d. Strict HTTPS Supabase Storage URL check for logo and banner
ALTER TABLE public.seller_profiles
  DROP CONSTRAINT IF EXISTS seller_profiles_logo_url_check;
ALTER TABLE public.seller_profiles
  ADD CONSTRAINT seller_profiles_logo_url_check CHECK (
    logo_url IS NULL OR (
      logo_url LIKE 'https://%supabase.co/storage/v1/object/public/store-assets/%'
      AND length(logo_url) <= 500
    )
  );

ALTER TABLE public.seller_profiles
  DROP CONSTRAINT IF EXISTS seller_profiles_banner_url_check;
ALTER TABLE public.seller_profiles
  ADD CONSTRAINT seller_profiles_banner_url_check CHECK (
    banner_url IS NULL OR (
      banner_url LIKE 'https://%supabase.co/storage/v1/object/public/store-assets/%'
      AND length(banner_url) <= 500
    )
  );

-- =============================================================================
-- 5. Rebuild Views & Functions: Gate Instagram & Allow Owner Preview
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
  -- Contact details only exposed if show_contact is enabled
  CASE WHEN sp.show_contact THEN sp.whatsapp_number ELSE NULL END AS whatsapp_number,
  CASE WHEN sp.show_contact THEN sp.instagram_handle ELSE NULL END AS instagram_handle,
  sp.store_hours,
  sp.speciality_tags,
  sp.show_about,
  sp.show_how_it_works,
  sp.show_reviews,
  sp.show_contact,
  sp.diwali_theme,
  -- Verified status: strictly checks admin verification flag & status
  (COALESCE(sp.is_verified, false) = true AND sp.verification_status = 'verified') AS is_verified,
  sp.created_at
FROM public.seller_profiles sp
WHERE sp.store_name IS NOT NULL
  AND sp.store_name <> ''
  AND COALESCE(sp.is_approved, false) = true
  AND COALESCE(sp.is_active, true) = true;

GRANT SELECT ON public.seller_public_profiles TO anon, authenticated;

-- Update get_store_by_slug RPC:
-- 1. General visitors only see approved & active boutiques.
-- 2. Store owners can preview their OWN boutique before approval.
-- 3. Admins can preview any boutique.
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
    sp.logo_url,
    sp.banner_url,
    sp.accent_palette,
    CASE WHEN sp.show_contact THEN sp.whatsapp_number ELSE NULL END AS whatsapp_number,
    CASE WHEN sp.show_contact THEN sp.instagram_handle ELSE NULL END AS instagram_handle,
    sp.store_hours,
    sp.speciality_tags,
    sp.show_about,
    sp.show_how_it_works,
    sp.show_reviews,
    sp.show_contact,
    sp.diwali_theme,
    (COALESCE(sp.is_verified, false) = true AND sp.verification_status = 'verified') AS is_verified,
    sp.created_at
  FROM public.seller_profiles sp
  WHERE LOWER(sp.store_slug) = LOWER(p_slug)
    AND sp.store_name IS NOT NULL
    AND sp.store_name <> ''
    AND (
      -- Public: store must be approved and active
      (COALESCE(sp.is_approved, false) = true AND COALESCE(sp.is_active, true) = true)
      -- Store owner preview: seller can view their own boutique prior to approval
      OR (auth.uid() IS NOT NULL AND sp.id = auth.uid())
      -- Admin: can view any boutique
      OR public.is_current_user_admin()
    )
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_store_by_slug(text) TO anon, authenticated;

-- =============================================================================
-- END phase41b_hardening.sql
-- =============================================================================
