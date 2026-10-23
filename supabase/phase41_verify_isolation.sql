-- phase41_verify_isolation.sql
-- BlinkWear Phase 41 & 41b: Multi-Tenant Storefront Isolation & Hardening Test Suite
--
-- This script validates:
--   1. Seller cannot self-approve or tamper with privileged status/verification fields.
--   2. Subdomain slug format constraint and trademark/system reserved blocklist trigger.
--   3. Storage folder write isolation (Seller A cannot upload to Seller B's folder).
--   4. Storage folder read isolation (Seller B cannot enumerate/list Seller A's objects).
--   5. Unapproved boutique hidden from anonymous public visitors and competitors.
--   6. Unapproved boutique OWNER can preview their own store via get_store_by_slug.
--   7. Contact details (WhatsApp & Instagram) properly redacted when show_contact is disabled.
--   8. Logo and banner URLs strictly enforced to Supabase Storage HTTPS URLs.
--
-- Safe to run on Staging. Runs completely inside a transaction and ROLLBACKs at the end.

BEGIN;

-- =============================================================================
-- TEST FIXTURE SETUP (Run as postgres/admin)
-- =============================================================================

DO $$
DECLARE
  v_seller_a_id uuid := '11111111-1111-1111-1111-111111111111';
  v_seller_b_id uuid := '22222222-2222-2222-2222-222222222222';
  v_seller_unapproved_id uuid := '33333333-3333-3333-3333-333333333333';
  v_active_product_id uuid := '44444444-4444-4444-4444-444444444444';
BEGIN
  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'Starting Phase 41 & 41b Multi-Tenant Isolation Tests';
  RAISE NOTICE '=======================================================';

  -- 1. Create test user profiles in profiles table
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES
    (v_seller_a_id, 'Seller A Owner', '+919111111111', 'seller'),
    (v_seller_b_id, 'Seller B Owner', '+919222222222', 'seller'),
    (v_seller_unapproved_id, 'Unapproved Seller', '+919333333333', 'seller')
  ON CONFLICT (id) DO NOTHING;

  -- 2. Create test seller profiles
  INSERT INTO public.seller_profiles (
    id, store_name, store_slug, phone, email, business_address, city, state, pincode,
    pan_number, gst_number, is_approved, is_active, is_verified, verification_status,
    tagline, show_contact, whatsapp_number, instagram_handle
  ) VALUES
    (
      v_seller_a_id, 'A Boutique', 'boutique-a', '+919111111111', 'seller_a@secret.com',
      'Private Address A, Bhopal', 'Bhopal', 'MP', '462001', 'ABCDE1234F', '23ABCDE1234F1Z5',
      true, true, true, 'verified', 'Designer Bridal A', true, '+919111111111', 'boutique_a'
    ),
    (
      v_seller_b_id, 'B Couture', 'boutique-b', '+919222222222', 'seller_b@secret.com',
      'Confidential Address B, Pune', 'Pune', 'MH', '411001', 'XYZPW9876K', '27XYZPW9876K1Z9',
      true, true, false, 'unverified', 'Luxury Lehengas B', false, '+919222222222', 'b_couture'
    ),
    (
      v_seller_unapproved_id, 'Pending Boutique', 'pending-boutique', '+919333333333', 'pending@secret.com',
      'Unverified Street, Bhopal', 'Bhopal', 'MP', '462002', 'PEND12345X', NULL,
      false, true, false, 'unverified', 'Under Review', true, '+919333333333', 'pending_boutique'
    )
  ON CONFLICT (id) DO UPDATE SET
    store_name = EXCLUDED.store_name,
    store_slug = EXCLUDED.store_slug,
    is_approved = EXCLUDED.is_approved,
    is_active = EXCLUDED.is_active;

  -- 3. Create test product for Boutique B
  INSERT INTO public.products (
    id, seller_id, title, status, listing_type, rent_price_per_day, city
  ) VALUES
    (v_active_product_id, v_seller_b_id, 'Red Bridal Lehenga', 'active', 'rent', 3500, 'Pune')
  ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

  RAISE NOTICE '[OK] Test fixtures initialized.';
END $$;

-- =============================================================================
-- TEST 1: Privileged Field Mutation Protection
-- Prove: Non-admin authenticated seller CANNOT modify is_approved or verification fields.
-- =============================================================================

DO $$
DECLARE
  v_caught boolean := false;
BEGIN
  -- Simulate authenticated seller A session
  SET LOCAL ROLE authenticated;
  SET LOCAL "request.jwt.claims" = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';
  SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';
  SET LOCAL "request.jwt.claim.role" = 'authenticated';

  BEGIN
    -- Unapproved seller trying to self-approve
    UPDATE public.seller_profiles
    SET is_approved = true
    WHERE id = '11111111-1111-1111-1111-111111111111';
  EXCEPTION WHEN OTHERS THEN
    v_caught := true;
  END;

  RESET ROLE;

  IF NOT v_caught THEN
    RAISE EXCEPTION '[FAIL] Test 1: Authenticated seller was able to update is_approved without admin privilege!';
  ELSE
    RAISE NOTICE '[PASS] Test 1: Seller update of is_approved / verification fields was successfully rejected.';
  END IF;
END $$;

-- =============================================================================
-- TEST 2: Subdomain Slug Enforcement & Reserved Blocklist
-- Prove: CHECK constraint rejects invalid chars/length; Trigger rejects reserved slugs.
-- =============================================================================

DO $$
DECLARE
  v_invalid_format_caught boolean := false;
  v_reserved_caught boolean := false;
BEGIN
  -- 2a. Invalid format (contains uppercase or illegal symbol or too short)
  BEGIN
    UPDATE public.seller_profiles
    SET store_slug = 'AB'
    WHERE id = '11111111-1111-1111-1111-111111111111';
  EXCEPTION WHEN check_violation THEN
    v_invalid_format_caught := true;
  END;

  IF NOT v_invalid_format_caught THEN
    RAISE EXCEPTION '[FAIL] Test 2a: Store slug check constraint failed to reject "AB" (<3 chars)!';
  ELSE
    RAISE NOTICE '[PASS] Test 2a: Store slug format constraint correctly rejected invalid format.';
  END IF;

  -- 2b. Reserved system or trademark blocklist
  BEGIN
    UPDATE public.seller_profiles
    SET store_slug = 'sabyasachi'
    WHERE id = '11111111-1111-1111-1111-111111111111';
  EXCEPTION WHEN OTHERS THEN
    v_reserved_caught := true;
  END;

  IF NOT v_reserved_caught THEN
    RAISE EXCEPTION '[FAIL] Test 2b: Slug blocklist trigger failed to reject trademark slug "sabyasachi"!';
  ELSE
    RAISE NOTICE '[PASS] Test 2b: Slug blocklist trigger successfully rejected reserved/trademark slug.';
  END IF;
END $$;

-- =============================================================================
-- TEST 3: Storage Folder Isolation (Insert / Write)
-- Prove: Seller A cannot write files into Seller B's storage folder.
-- =============================================================================

DO $$
DECLARE
  v_write_blocked boolean := false;
BEGIN
  -- Act as Seller A
  SET LOCAL ROLE authenticated;
  SET LOCAL "request.jwt.claims" = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';
  SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';
  SET LOCAL "request.jwt.claim.role" = 'authenticated';

  BEGIN
    -- Attempt write to competitor Seller B folder
    INSERT INTO storage.objects (bucket_id, name, owner)
    VALUES ('store-assets', '22222222-2222-2222-2222-222222222222/malicious_banner.png', '11111111-1111-1111-1111-111111111111');
  EXCEPTION WHEN OTHERS THEN
    v_write_blocked := true;
  END;

  RESET ROLE;

  IF NOT v_write_blocked THEN
    RAISE EXCEPTION '[FAIL] Test 3: Seller A was able to write an object into Seller B storage folder!';
  ELSE
    RAISE NOTICE '[PASS] Test 3: Storage write isolation enforced. Cross-tenant folder upload was blocked.';
  END IF;
END $$;

-- =============================================================================
-- TEST 4: Storage Listing Isolation (Select / Read objects)
-- Prove: Seller B cannot list objects from Seller A's folder via storage.objects.
-- =============================================================================

DO $$
DECLARE
  v_listed_count int;
BEGIN
  -- As admin, insert a test file for Seller A
  INSERT INTO storage.objects (bucket_id, name, owner)
  VALUES ('store-assets', '11111111-1111-1111-1111-111111111111/logo.png', '11111111-1111-1111-1111-111111111111')
  ON CONFLICT DO NOTHING;

  -- Act as Seller B
  SET LOCAL ROLE authenticated;
  SET LOCAL "request.jwt.claims" = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';
  SET LOCAL "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';
  SET LOCAL "request.jwt.claim.role" = 'authenticated';

  -- Attempt to query / enumerate Seller A's objects
  SELECT count(*) INTO v_listed_count
  FROM storage.objects
  WHERE bucket_id = 'store-assets'
    AND name LIKE '11111111-1111-1111-1111-111111111111/%';

  RESET ROLE;

  IF v_listed_count > 0 THEN
    RAISE EXCEPTION '[FAIL] Test 4: Seller B was able to view/list Seller A storage objects! Count: %', v_listed_count;
  ELSE
    RAISE NOTICE '[PASS] Test 4: Storage enumeration isolation verified. Competitors cannot list other sellers assets.';
  END IF;
END $$;

-- =============================================================================
-- TEST 5: Anonymous Visitor Isolation (Unapproved Storefront)
-- Prove: Anon cannot discover or view unapproved or inactive boutiques.
-- =============================================================================

DO $$
DECLARE
  v_view_count int;
  v_rpc_count int;
BEGIN
  SET LOCAL ROLE anon;
  SET LOCAL "request.jwt.claims" = '{"role": "anon"}';
  SET LOCAL "request.jwt.claim.role" = 'anon';

  SELECT count(*) INTO v_view_count
  FROM public.seller_public_profiles
  WHERE store_slug = 'pending-boutique';

  SELECT count(*) INTO v_rpc_count
  FROM public.get_store_by_slug('pending-boutique');

  RESET ROLE;

  IF v_view_count > 0 OR v_rpc_count > 0 THEN
    RAISE EXCEPTION '[FAIL] Test 5: Unapproved boutique exposed to anonymous visitor! view: %, rpc: %', v_view_count, v_rpc_count;
  ELSE
    RAISE NOTICE '[PASS] Test 5: Unapproved boutiques are strictly hidden from anonymous marketplace visitors.';
  END IF;
END $$;

-- =============================================================================
-- TEST 6: Store Owner Preview vs. Competitor Isolation
-- Prove: Store OWNER can preview their own unapproved store; Competitors cannot.
-- =============================================================================

DO $$
DECLARE
  v_owner_rpc_count int;
  v_competitor_rpc_count int;
BEGIN
  -- 6a. As the unapproved store owner
  SET LOCAL ROLE authenticated;
  SET LOCAL "request.jwt.claims" = '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}';
  SET LOCAL "request.jwt.claim.sub" = '33333333-3333-3333-3333-333333333333';
  SET LOCAL "request.jwt.claim.role" = 'authenticated';

  SELECT count(*) INTO v_owner_rpc_count
  FROM public.get_store_by_slug('pending-boutique');

  -- 6b. As competitor Seller A
  SET LOCAL "request.jwt.claims" = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';
  SET LOCAL "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';

  SELECT count(*) INTO v_competitor_rpc_count
  FROM public.get_store_by_slug('pending-boutique');

  RESET ROLE;

  IF v_owner_rpc_count <> 1 THEN
    RAISE EXCEPTION '[FAIL] Test 6a: Store owner could not preview their unapproved boutique! Count: %', v_owner_rpc_count;
  ELSIF v_competitor_rpc_count <> 0 THEN
    RAISE EXCEPTION '[FAIL] Test 6b: Competitor could preview an unapproved boutique! Count: %', v_competitor_rpc_count;
  ELSE
    RAISE NOTICE '[PASS] Test 6: Store owner preview enabled while remaining 100%% isolated from competitors.';
  END IF;
END $$;

-- =============================================================================
-- TEST 7: Contact Redaction & Verification Badge Accuracy
-- Prove: Boutique B with show_contact=false redacts whatsapp & instagram;
--        is_verified is TRUE ONLY when is_verified=true AND verification_status='verified'.
-- =============================================================================

DO $$
DECLARE
  v_whatsapp text;
  v_instagram text;
  v_verified_a boolean;
  v_verified_b boolean;
BEGIN
  SELECT whatsapp_number, instagram_handle, is_verified
  INTO v_whatsapp, v_instagram, v_verified_b
  FROM public.seller_public_profiles
  WHERE store_slug = 'boutique-b';

  SELECT is_verified INTO v_verified_a
  FROM public.seller_public_profiles
  WHERE store_slug = 'boutique-a';

  IF v_whatsapp IS NOT NULL OR v_instagram IS NOT NULL THEN
    RAISE EXCEPTION '[FAIL] Test 7a: Contact information leaked when show_contact is false! WA: %, IG: %', v_whatsapp, v_instagram;
  ELSIF v_verified_a IS NOT TRUE THEN
    RAISE EXCEPTION '[FAIL] Test 7b: Boutique A was not marked as verified!';
  ELSIF v_verified_b IS TRUE THEN
    RAISE EXCEPTION '[FAIL] Test 7c: Boutique B without verified status was marked verified!';
  ELSE
    RAISE NOTICE '[PASS] Test 7: Contact redaction and verified badge logic confirmed accurate.';
  END IF;
END $$;

-- =============================================================================
-- TEST 8: Logo & Banner URL Constraints
-- Prove: Insecure HTTP URLs and Base64 URIs are rejected.
-- =============================================================================

DO $$
DECLARE
  v_rejected_base64 boolean := false;
  v_rejected_insecure boolean := false;
BEGIN
  -- Attempt base64 update
  BEGIN
    UPDATE public.seller_profiles
    SET logo_url = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
    WHERE id = '11111111-1111-1111-1111-111111111111';
  EXCEPTION WHEN check_violation THEN
    v_rejected_base64 := true;
  END;

  -- Attempt non-Supabase storage URL
  BEGIN
    UPDATE public.seller_profiles
    SET logo_url = 'http://attacker-controlled.com/malware.png'
    WHERE id = '11111111-1111-1111-1111-111111111111';
  EXCEPTION WHEN check_violation THEN
    v_rejected_insecure := true;
  END;

  IF NOT (v_rejected_base64 AND v_rejected_insecure) THEN
    RAISE EXCEPTION '[FAIL] Test 8: Malformed logo URL was not rejected! base64: %, insecure: %', v_rejected_base64, v_rejected_insecure;
  ELSE
    RAISE NOTICE '[PASS] Test 8: Logo URL constraint enforces trusted Supabase Storage HTTPS URLs.';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'ALL PHASE 41 & 41b ISOLATION & SECURITY TESTS PASSED!';
  RAISE NOTICE '=======================================================';
END $$;

-- Rollback entire transaction to leave database untouched
ROLLBACK;
