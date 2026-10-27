-- ============================================================================
-- Phase 43: Video & Photo Support for Banners (Multi-Format Merchandising)
-- Path: marketplace-web/supabase/phase43_banner_video_support.sql
-- ============================================================================
-- ADDITIVE ONLY: Zero renames, zero drops.
-- Allows banners to be either images (photos) or videos (MP4, WebM).
-- Supports desktop video, optional mobile video, and image poster/fallback.
-- ============================================================================

BEGIN;

-- 1. Ensure placement, mobile_image_url, and alt_text columns exist
ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS placement TEXT NOT NULL DEFAULT 'hero_carousel',
  ADD COLUMN IF NOT EXISTS mobile_image_url TEXT,
  ADD COLUMN IF NOT EXISTS alt_text TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'banners_placement_check'
  ) THEN
    ALTER TABLE public.banners
      ADD CONSTRAINT banners_placement_check
      CHECK (placement IN ('hero_carousel', 'top_strip', 'mid_tiles', 'category_banner'));
  END IF;
END $$;

-- 2. Add media_type and video columns (Additive)
ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS mobile_video_url TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'banners_media_type_check'
  ) THEN
    ALTER TABLE public.banners
      ADD CONSTRAINT banners_media_type_check
      CHECK (media_type IN ('image', 'video'));
  END IF;
END $$;

-- 3. Storage Bucket for Banner Videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('banner-videos', 'banner-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read policy for banner videos
DROP POLICY IF EXISTS "Public can view banner videos" ON storage.objects;
CREATE POLICY "Public can view banner videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banner-videos');

-- Admin write policies for banner videos
DROP POLICY IF EXISTS "Admins can upload banner videos" ON storage.objects;
CREATE POLICY "Admins can upload banner videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'banner-videos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can update banner videos" ON storage.objects;
CREATE POLICY "Admins can update banner videos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'banner-videos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can delete banner videos" ON storage.objects;
CREATE POLICY "Admins can delete banner videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'banner-videos'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

COMMIT;
