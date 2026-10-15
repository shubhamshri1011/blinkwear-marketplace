-- phase38_seller_store_subdomains.sql
-- BlinkWear Phase 38: Free Seller Mini-Stores on Subdomains
-- 
-- Adds store_slug to seller_profiles with format validation and unique index,
-- updates public.seller_public_profiles view, and creates RPCs for public storefront
-- retrieval and slug availability verification.
--
-- DO NOT EXECUTE DIRECTLY ON PRODUCTION — FOR CODE REVIEW AND MANUAL APPLICATION.

-- 1. Add store_slug column to seller_profiles if not present
ALTER TABLE public.seller_profiles 
  ADD COLUMN IF NOT EXISTS store_slug text;

-- 2. Add format and reserved names CHECK constraint
ALTER TABLE public.seller_profiles
  DROP CONSTRAINT IF EXISTS seller_profiles_store_slug_format_check;

ALTER TABLE public.seller_profiles
  ADD CONSTRAINT seller_profiles_store_slug_format_check CHECK (
    store_slug IS NULL OR (
      length(store_slug) >= 3 AND
      length(store_slug) <= 63 AND
      store_slug ~ '^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$' AND
      store_slug NOT LIKE '%--%' AND
      store_slug NOT IN (
        'admin', 'api', 'app', 'www', 'store', 'shop', 'blog', 'help', 'support',
        'auth', 'login', 'register', 'dashboard', 'checkout', 'cart', 'orders',
        'profile', 'seller', 'sellers', 'mail', 'status', 'test', 'dev', 'stage',
        'staging', 'preview', 'static', 'assets', 'cdn', 'terms', 'privacy',
        'about', 'contact', 'blinkwear', 'marketplace', 'compliance', 'ops',
        'internal', 'root', 'web', 'portal', 'account', 'pay', 'payments',
        'rent', 'rental', 'rentals', 'buy', 'order', 'tracking', 'delivery'
      )
    )
  );

-- 3. Case-insensitive unique index for store_slug
CREATE UNIQUE INDEX IF NOT EXISTS seller_profiles_store_slug_lower_idx 
  ON public.seller_profiles (LOWER(store_slug)) 
  WHERE store_slug IS NOT NULL;

-- 4. Backfill existing active seller profiles if store_slug is null
DO $$
DECLARE
  rec RECORD;
  v_base_slug text;
  v_candidate_slug text;
  v_counter int;
  v_exists boolean;
BEGIN
  FOR rec IN 
    SELECT id, store_name 
    FROM public.seller_profiles 
    WHERE store_slug IS NULL
  LOOP
    -- Generate base slug: lowercase, replace non-alphanumeric with hyphens, trim hyphens
    v_base_slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(rec.store_name, '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g'));
    
    -- If too short or empty, fallback with seller id snippet
    IF length(v_base_slug) < 3 THEN
      v_base_slug := 'boutique-' || substr(replace(rec.id::text, '-', ''), 1, 6);
    END IF;

    -- If longer than 50 chars, trim
    IF length(v_base_slug) > 50 THEN
      v_base_slug := substr(v_base_slug, 1, 50);
      v_base_slug := REGEXP_REPLACE(v_base_slug, '-+$', '');
    END IF;

    v_candidate_slug := v_base_slug;
    v_counter := 1;

    LOOP
      SELECT EXISTS (
        SELECT 1 FROM public.seller_profiles 
        WHERE LOWER(store_slug) = v_candidate_slug AND id <> rec.id
      ) INTO v_exists;

      EXIT WHEN NOT v_exists;

      v_counter := v_counter + 1;
      v_candidate_slug := v_base_slug || '-' || v_counter;
    END LOOP;

    UPDATE public.seller_profiles
    SET store_slug = v_candidate_slug
    WHERE id = rec.id;
  END LOOP;
END $$;

-- 5. Update public.seller_public_profiles view to include store_slug
DROP VIEW IF EXISTS public.seller_public_profiles;

CREATE VIEW public.seller_public_profiles AS
SELECT 
  id,
  store_name,
  store_slug,
  store_description,
  logo_url,
  banner_url,
  city,
  is_verified,
  verification_status
FROM public.seller_profiles
WHERE is_active = true AND is_verified = true;

ALTER VIEW public.seller_public_profiles SET (security_invoker = false);
GRANT SELECT ON public.seller_public_profiles TO anon, authenticated;

-- 6. RPC: Public storefront lookup by store_slug (Safe, zero private data exposure)
CREATE OR REPLACE FUNCTION public.get_store_by_slug(p_slug text)
RETURNS TABLE (
  id uuid,
  store_name text,
  store_slug text,
  store_description text,
  logo_url text,
  banner_url text,
  city text,
  is_verified boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    store_name,
    store_slug,
    store_description,
    logo_url,
    banner_url,
    city,
    is_verified
  FROM public.seller_profiles
  WHERE LOWER(store_slug) = LOWER(TRIM(p_slug))
    AND is_active = true
    AND is_verified = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_store_by_slug(text) TO anon, authenticated;

-- 7. RPC: Check store slug availability and format validity
CREATE OR REPLACE FUNCTION public.check_store_slug_available(
  p_slug text,
  p_seller_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean text;
  v_taken boolean;
  v_reserved text[] := ARRAY[
    'admin', 'api', 'app', 'www', 'store', 'shop', 'blog', 'help', 'support',
    'auth', 'login', 'register', 'dashboard', 'checkout', 'cart', 'orders',
    'profile', 'seller', 'sellers', 'mail', 'status', 'test', 'dev', 'stage',
    'staging', 'preview', 'static', 'assets', 'cdn', 'terms', 'privacy',
    'about', 'contact', 'blinkwear', 'marketplace', 'compliance', 'ops',
    'internal', 'root', 'web', 'portal', 'account', 'pay', 'payments',
    'rent', 'rental', 'rentals', 'buy', 'order', 'tracking', 'delivery'
  ];
BEGIN
  v_clean := LOWER(TRIM(COALESCE(p_slug, '')));
  
  IF length(v_clean) < 3 THEN
    RETURN jsonb_build_object('available', false, 'reason', 'Subdomain slug must be at least 3 characters long');
  END IF;

  IF length(v_clean) > 63 THEN
    RETURN jsonb_build_object('available', false, 'reason', 'Subdomain slug cannot exceed 63 characters');
  END IF;

  IF NOT (v_clean ~ '^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$') OR v_clean LIKE '%--%' THEN
    RETURN jsonb_build_object('available', false, 'reason', 'Slug can only contain lowercase letters, numbers, and single hyphens (cannot start or end with a hyphen)');
  END IF;

  IF v_clean = ANY(v_reserved) THEN
    RETURN jsonb_build_object('available', false, 'reason', 'This subdomain name is reserved for platform services');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.seller_profiles
    WHERE LOWER(store_slug) = v_clean
      AND (p_seller_id IS NULL OR id <> p_seller_id)
  ) INTO v_taken;

  IF v_taken THEN
    RETURN jsonb_build_object('available', false, 'reason', 'This subdomain is already taken by another boutique');
  END IF;

  RETURN jsonb_build_object('available', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_store_slug_available(text, uuid) TO anon, authenticated;

-- 8. Update get_seller_storefront RPC to include store_slug
CREATE OR REPLACE FUNCTION public.get_seller_storefront(p_seller_id uuid)
RETURNS TABLE (
  id uuid,
  store_name text,
  store_slug text,
  store_description text,
  logo_url text,
  banner_url text,
  city text,
  state text,
  phone text,
  email text,
  is_verified boolean,
  verified_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    store_name,
    store_slug,
    store_description,
    logo_url,
    banner_url,
    city,
    state,
    NULL::text as phone,
    NULL::text as email,
    is_verified,
    verified_at
  FROM public.seller_profiles
  WHERE id = p_seller_id
    AND is_active = true
    AND is_verified = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_seller_storefront(uuid) TO anon, authenticated;
