-- ============================================================================
-- Blinkwear Production Schema Synchronization
-- Fixes missing tables and columns reported by Admin Panel and Web Storefront
-- ============================================================================

BEGIN;

-- 1. BANNERS: Add cta_text, start_at, end_at and ensure alignment with cta_label
ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS cta_text TEXT,
  ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_at TIMESTAMPTZ;

-- Backfill cta_text from cta_label if cta_text is null
UPDATE public.banners
SET cta_text = cta_label
WHERE cta_text IS NULL AND cta_label IS NOT NULL;

-- Keep cta_label and cta_text in sync via trigger
CREATE OR REPLACE FUNCTION public.sync_banner_cta()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cta_text IS NOT NULL AND NEW.cta_label IS NULL THEN
    NEW.cta_label = NEW.cta_text;
  ELSIF NEW.cta_label IS NOT NULL AND NEW.cta_text IS NULL THEN
    NEW.cta_text = NEW.cta_label;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_banner_cta ON public.banners;
CREATE TRIGGER trg_sync_banner_cta
  BEFORE INSERT OR UPDATE ON public.banners
  FOR EACH ROW EXECUTE FUNCTION public.sync_banner_cta();


-- 2. CATEGORIES: Add show_in_strip
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS show_in_strip BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS categories_strip_idx
  ON public.categories(show_in_strip, is_active, sort_order);


-- 3. HOMEPAGE BLOCKS TABLE
CREATE TABLE IF NOT EXISTS public.homepage_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_type TEXT NOT NULL CHECK (
    block_type IN ('product_row', 'category_tiles', 'occasion_tiles', 'banner_group', 'trust_strip', 'seller_cta')
  ),
  title TEXT NOT NULL,
  subtitle TEXT,
  view_all_href TEXT,
  source_type TEXT NOT NULL DEFAULT 'rule' CHECK (
    source_type IN ('rule', 'category', 'curated')
  ),
  source_rule TEXT CHECK (
    source_rule IS NULL OR source_rule IN ('newest', 'featured', 'trending_rentals', 'popular_buys')
  ),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  curated_product_ids UUID[] NOT NULL DEFAULT '{}',
  banner_ids UUID[] NOT NULL DEFAULT '{}',
  custom_tiles JSONB NOT NULL DEFAULT '[]'::jsonb,
  item_limit INT NOT NULL DEFAULT 10 CHECK (item_limit > 0 AND item_limit <= 50),
  city_filter TEXT NOT NULL DEFAULT 'all' CHECK (city_filter IN ('all', 'Pune', 'Bhopal')),
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT homepage_blocks_schedule_check CHECK (end_at IS NULL OR start_at IS NULL OR end_at >= start_at)
);

CREATE INDEX IF NOT EXISTS homepage_blocks_active_order_idx
  ON public.homepage_blocks(is_active, sort_order);

ALTER TABLE public.homepage_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active homepage blocks are viewable by everyone" ON public.homepage_blocks;
CREATE POLICY "Active homepage blocks are viewable by everyone"
  ON public.homepage_blocks FOR SELECT TO anon, authenticated
  USING (
    is_active = true
    AND (start_at IS NULL OR start_at <= now())
    AND (end_at IS NULL OR end_at >= now())
  );

DROP POLICY IF EXISTS "Admins can manage homepage blocks" ON public.homepage_blocks;
CREATE POLICY "Admins can manage homepage blocks"
  ON public.homepage_blocks FOR ALL TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

GRANT SELECT ON public.homepage_blocks TO anon, authenticated;


-- 4. TRUST BADGES VALIDATION FUNCTION & SITE THEME SETTINGS TABLE
CREATE OR REPLACE FUNCTION public.validate_trust_badges(badges jsonb)
RETURNS boolean AS $$
DECLARE
  elem jsonb;
  valid_icons text[] := ARRAY['shield-check', 'truck', 'check-circle', 'sparkles', 'badge-check', 'tag', 'heart', 'lock'];
BEGIN
  IF jsonb_typeof(badges) IS DISTINCT FROM 'array' THEN
    RETURN false;
  END IF;
  IF jsonb_array_length(badges) > 4 THEN
    RETURN false;
  END IF;
  FOR elem IN SELECT * FROM jsonb_array_elements(badges) LOOP
    IF jsonb_typeof(elem) IS DISTINCT FROM 'object' THEN
      RETURN false;
    END IF;
    IF NOT (elem ? 'icon' AND elem ? 'title' AND elem ? 'description') THEN
      RETURN false;
    END IF;
    IF NOT (elem->>'icon' = ANY(valid_icons)) THEN
      RETURN false;
    END IF;
    IF length(elem->>'title') < 1 OR length(elem->>'title') > 60 THEN
      RETURN false;
    END IF;
    IF length(elem->>'description') > 120 THEN
      RETURN false;
    END IF;
  END LOOP;
  RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE TABLE IF NOT EXISTS public.site_theme_settings (
  is_singleton BOOLEAN PRIMARY KEY DEFAULT true CHECK (is_singleton = true),
  accent_color TEXT NOT NULL DEFAULT '#F97316' CHECK (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  logo_url TEXT CHECK (
    logo_url IS NULL OR (
      logo_url ~ '^https://[a-z0-9]{20}\.supabase\.co/storage/v1/object/public/'
      AND length(logo_url) <= 500
    )
  ),
  trust_badges JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_theme_trust_badges_check CHECK (public.validate_trust_badges(trust_badges))
);

ALTER TABLE public.site_theme_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Site theme settings viewable by everyone" ON public.site_theme_settings;
CREATE POLICY "Site theme settings viewable by everyone"
  ON public.site_theme_settings FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage site theme settings" ON public.site_theme_settings;
CREATE POLICY "Admins can manage site theme settings"
  ON public.site_theme_settings FOR ALL TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

GRANT SELECT ON public.site_theme_settings TO anon, authenticated;

-- Seed default initial theme if missing
INSERT INTO public.site_theme_settings (is_singleton, accent_color, logo_url, trust_badges)
VALUES (
  true,
  '#F97316',
  NULL,
  '[
    {"icon": "shield-check", "title": "100% Sanitized Garments", "description": "Every piece professionally dry-cleaned & sanitized"},
    {"icon": "truck", "title": "Doorstep Delivery & Return", "description": "Available across Pune & Bhopal"},
    {"icon": "check-circle", "title": "Deposit Refunded", "description": "Deposit refunded after quality check"}
  ]'::jsonb
) ON CONFLICT (is_singleton) DO NOTHING;


-- 5. CANCELLATION POLICIES: Add admin panel columns
ALTER TABLE public.cancellation_policies
  ADD COLUMN IF NOT EXISTS cancel_before_dispatch_refund_pct NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  ADD COLUMN IF NOT EXISTS cancel_before_dispatch_charge_pct NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS cancel_after_dispatch_refund_pct NUMERIC(5,2) NOT NULL DEFAULT 80.00,
  ADD COLUMN IF NOT EXISTS cancel_after_dispatch_charge_pct NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  ADD COLUMN IF NOT EXISTS cancel_after_delivery_refund_pct NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS cancel_after_delivery_charge_pct NUMERIC(5,2) NOT NULL DEFAULT 100.00;

-- Sync initial values
UPDATE public.cancellation_policies
SET 
  cancel_before_dispatch_refund_pct = COALESCE(before_acceptance_refund_pct, 100.00),
  cancel_before_dispatch_charge_pct = COALESCE(before_acceptance_charge_pct, 0.00),
  cancel_after_dispatch_refund_pct = COALESCE(after_acceptance_refund_pct, 80.00),
  cancel_after_dispatch_charge_pct = COALESCE(after_acceptance_charge_pct, 20.00),
  cancel_after_delivery_refund_pct = 0.00,
  cancel_after_delivery_charge_pct = 100.00
WHERE id = 1;


-- 6. STORAGE BUCKET: banner-videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('banner-videos', 'banner-videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public can view banner videos" ON storage.objects;
CREATE POLICY "Public can view banner videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banner-videos');

DROP POLICY IF EXISTS "Admins can upload banner videos" ON storage.objects;
CREATE POLICY "Admins can upload banner videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'banner-videos'
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
      )
      OR auth.role() = 'service_role'
    )
  );

DROP POLICY IF EXISTS "Admins can update banner videos" ON storage.objects;
CREATE POLICY "Admins can update banner videos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'banner-videos'
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
      )
      OR auth.role() = 'service_role'
    )
  );

DROP POLICY IF EXISTS "Admins can delete banner videos" ON storage.objects;
CREATE POLICY "Admins can delete banner videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'banner-videos'
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
      )
      OR auth.role() = 'service_role'
    )
  );

COMMIT;
