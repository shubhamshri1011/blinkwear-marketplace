-- ============================================================================
-- Phase 43 Rollback: Revert Banner Video & Photo Support
-- Path: marketplace-web/supabase/phase43_rollback.sql
-- ============================================================================

BEGIN;

ALTER TABLE public.banners DROP CONSTRAINT IF EXISTS banners_media_type_check;
ALTER TABLE public.banners DROP COLUMN IF EXISTS media_type;
ALTER TABLE public.banners DROP COLUMN IF EXISTS video_url;
ALTER TABLE public.banners DROP COLUMN IF EXISTS mobile_video_url;

DROP POLICY IF EXISTS "Admins can delete banner videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update banner videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload banner videos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view banner videos" ON storage.objects;

-- Note: Direct SQL deletion from storage.buckets is blocked by Supabase's
-- internal storage.protect_delete() trigger to prevent orphaned files.
-- Dropping the policies above fully revokes all access. To delete the bucket
-- completely, delete 'banner-videos' via the Supabase Dashboard under Storage.

COMMIT;
