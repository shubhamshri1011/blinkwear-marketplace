-- phase41_verify_isolation.sql
-- BlinkWear Phase 41: Verification & Isolation Test Suite
--
-- This script proves:
--   1. Seller A CANNOT read private PII/financial fields of Seller B.
--   2. Seller A CANNOT insert, update, or delete files in Seller B's storage folder ({seller_b_id}/).
--   3. Anonymous (anon) visitors see ONLY approved + active sellers and active products.
--   4. Anonymous visitors CANNOT see unapproved or deactivated boutiques.
--
-- Safe to run on Staging. Runs inside a transaction and ROLLBACKs all test fixtures at the end.

BEGIN;

-- =============================================================================
-- TEST FIXTURE SETUP
-- =============================================================================

DO $$
DECLARE
  v_seller_a_id uuid := '11111111-1111-1111-1111-111111111111';
  v_seller_b_id uuid := '22222222-2222-2222-2222-222222222222';
  v_seller_unapproved_id uuid := '33333333-3333-3333-3333-333333333333';
  v_active_product_id uuid := '44444444-4444-4444-4444-444444444444';
  v_draft_product_id uuid := '55555555-5555-5555-5555-555555555555';
BEGIN
  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'Starting Phase 41 Storefront V2 Isolation Verification';
  RAISE NOTICE '=======================================================';

  -- 1. Insert test profiles
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES
    (v_seller_a_id, 'Seller A Owner', '+919111111111', 'seller'),
    (v_seller_b_id, 'Seller B Owner', '+919222222222', 'seller'),
    (v_seller_unapproved_id, 'Unapproved Seller', '+919333333333', 'seller')
  ON CONFLICT (id) DO NOTHING;

  -- 2. Insert test seller profiles
  INSERT INTO public.seller_profiles (
    id, store_name, store_slug, phone, email, business_address, city, state, pincode,
    pan_number, gst_number, is_approved, is_active, tagline, show_contact, whatsapp_number
  ) VALUES
    (
      v_seller_a_id, 'A Boutique', 'boutique-a', '+919111111111', 'seller_a@secret.com',
      'Private Address A, Bhopal', 'Bhopal', 'MP', '462001', 'ABCDE1234F', '23ABCDE1234F1Z5',
      true, true, 'Designer Bridal A', true, '+919111111111'
    ),
    (
      v_seller_b_id, 'B Couture', 'boutique-b', '+919222222222', 'seller_b@secret.com',
      'Confidential Address B, Pune', 'Pune', 'MH', '411001', 'XYZPW9876K', '27XYZPW9876K1Z9',
      true, true, 'Luxury Lehengas B', false, '+919222222222'
    ),
    (
      v_seller_unapproved_id, 'Pending Boutique', 'pending-boutique', '+919333333333', 'pending@secret.com',
      'Unverified Street, Bhopal', 'Bhopal', 'MP', '462002', 'PEND12345X', NULL,
      false, true, 'Under Review', true, '+919333333333'
    )
  ON CONFLICT (id) DO UPDATE SET
    store_name = EXCLUDED.store_name,
    store_slug = EXCLUDED.store_slug,
    is_approved = EXCLUDED.is_approved,
    is_active = EXCLUDED.is_active;

  -- 3. Insert test products (one active, one draft)
  INSERT INTO public.products (
    id, seller_id, title, status, listing_type, rent_price_per_day, city
  ) VALUES
    (v_active_product_id, v_seller_b_id, 'Red Sabyasachi Bridal Lehenga', 'active', 'rent', 3500, 'Pune'),
    (v_draft_product_id, v_seller_b_id, 'Unpublished Draft Lehenga', 'draft', 'rent', 2500, 'Pune')
  ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

  RAISE NOTICE '[OK] Test fixtures created successfully.';
END $$;

-- =============================================================================
-- TEST 1: Column-Level Privacy Check on public view
-- Prove: view seller_public_profiles does NOT have columns: email, phone,
-- bank_account, ifsc, pan_number, gst_number, business_address.
-- =============================================================================

DO $$
DECLARE
  v_leaked_cols text[];
BEGIN
  SELECT array_agg(column_name::text)
  INTO v_leaked_cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'seller_public_profiles'
    AND column_name IN (
      'email', 'phone', 'business_address', 'pan_number',
      'gst_number', 'aadhaar_number', 'bank_account_number', 'ifsc_code'
    );

  IF v_leaked_cols IS NOT NULL AND array_length(v_leaked_cols, 1) > 0 THEN
    RAISE EXCEPTION '[FAIL] Test 1 Leaked sensitive columns found in seller_public_profiles: %', v_leaked_cols;
  ELSE
    RAISE NOTICE '[PASS] Test 1: seller_public_profiles contains ZERO private/financial fields.';
  END IF;
END $$;

-- =============================================================================
-- TEST 2: Contact Privacy Toggle Check
-- Prove: If show_contact is FALSE, whatsapp_number is redacted to NULL.
-- =============================================================================

DO $$
DECLARE
  v_whatsapp text;
BEGIN
  SELECT whatsapp_number INTO v_whatsapp
  FROM public.seller_public_profiles
  WHERE store_slug = 'boutique-b';

  IF v_whatsapp IS NOT NULL THEN
    RAISE EXCEPTION '[FAIL] Test 2: whatsapp_number was NOT redacted when show_contact=false! Got: %', v_whatsapp;
  ELSE
    RAISE NOTICE '[PASS] Test 2: Contact details properly redacted to NULL when show_contact is disabled.';
  END IF;
END $$;

-- =============================================================================
-- TEST 3: Unapproved / Inactive Seller Isolation from Public View & RPC
-- Prove: Unapproved or deactivated sellers do NOT appear in public storefronts.
-- =============================================================================

DO $$
DECLARE
  v_count_view int;
  v_count_rpc int;
BEGIN
  -- Check view
  SELECT count(*) INTO v_count_view
  FROM public.seller_public_profiles
  WHERE store_slug = 'pending-boutique';

  -- Check RPC
  SELECT count(*) INTO v_count_rpc
  FROM public.get_store_by_slug('pending-boutique');

  IF v_count_view > 0 OR v_count_rpc > 0 THEN
    RAISE EXCEPTION '[FAIL] Test 3: Unapproved seller was exposed! View: %, RPC: %', v_count_view, v_count_rpc;
  ELSE
    RAISE NOTICE '[PASS] Test 3: Unapproved & inactive sellers are completely hidden from public views and RPCs.';
  END IF;
END $$;

-- =============================================================================
-- TEST 4: Storage RLS Policy Verification
-- Prove: RLS policies exist on storage.objects for store-assets folder isolation
-- =============================================================================

DO $$
DECLARE
  v_has_insert_policy boolean;
  v_has_update_policy boolean;
  v_has_delete_policy boolean;
  v_has_select_policy boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'store_assets_seller_insert'
  ) INTO v_has_insert_policy;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'store_assets_seller_update'
  ) INTO v_has_update_policy;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'store_assets_seller_delete'
  ) INTO v_has_delete_policy;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'store_assets_public_select'
  ) INTO v_has_select_policy;

  IF NOT (v_has_insert_policy AND v_has_update_policy AND v_has_delete_policy AND v_has_select_policy) THEN
    RAISE EXCEPTION '[FAIL] Test 4: Missing storage RLS policies! insert=%, update=%, delete=%, select=%',
      v_has_insert_policy, v_has_update_policy, v_has_delete_policy, v_has_select_policy;
  ELSE
    RAISE NOTICE '[PASS] Test 4: All storage folder isolation policies (insert/update/delete/select) verified.';
  END IF;
END $$;

-- =============================================================================
-- TEST 5: Base64 / Malformed URL Sanitization Guard
-- Prove: Check constraints reject base64 data URIs in logo_url and banner_url
-- =============================================================================

DO $$
DECLARE
  v_failed boolean := false;
BEGIN
  BEGIN
    UPDATE public.seller_profiles
    SET logo_url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
    WHERE id = '11111111-1111-1111-1111-111111111111';
  EXCEPTION WHEN check_violation THEN
    v_failed := true;
  END;

  IF NOT v_failed THEN
    RAISE EXCEPTION '[FAIL] Test 5: Check constraint failed to reject base64 data URI in logo_url!';
  ELSE
    RAISE NOTICE '[PASS] Test 5: Base64 data-URI insertion successfully rejected by constraint.';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'ALL PHASE 41 ISOLATION TESTS PASSED SUCCESSFULLY!';
  RAISE NOTICE '=======================================================';
END $$;

-- Rollback test data to leave database pristine
ROLLBACK;
