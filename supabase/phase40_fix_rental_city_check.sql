-- ============================================================================
-- PHASE 40 - Fix rental city check to use delivery_address from metadata
-- ============================================================================
-- Problem (phase28): v_buyer_city was loaded exclusively from profiles.city.
-- A buyer whose profile.city is NULL (new signup, city not yet set) would
-- always fail the city-match check with "Your city: unspecified", even if
-- they provided a valid Bhopal/Pune delivery address at checkout.
--
-- Fix: resolve v_buyer_city as:
--   lower(trim(COALESCE(
--     v_meta -> 'delivery_address' ->> 'city',   -- from checkout form (primary)
--     profiles.city                               -- profile fallback
--   )))
-- and compare against lower(trim(v_product.city)).
--
-- Everything else (stock lock, overlap check, idempotency, amount check,
-- INSERT, cart cleanup, UPDATE payment_attempts) is preserved exactly.
-- create_paid_order is NOT touched.
-- ============================================================================

DROP FUNCTION IF EXISTS public.create_paid_rental_booking(uuid);

CREATE OR REPLACE FUNCTION public.create_paid_rental_booking(p_payment_attempt_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
  v_attempt        record;
  v_meta           jsonb;
  v_items          jsonb;
  v_item           jsonb;
  v_product        record;
  v_settings       record;
  v_booking_id     uuid;
  v_first_id       uuid;
  v_start_date     date;
  v_end_date       date;
  v_product_id     uuid;
  v_selected_size  text;
  v_selected_color text;
  v_rental_days    int;
  v_rent_per_day   numeric(10,2);
  v_rental_amount  numeric(10,2);
  v_security_deposit numeric(10,2);
  v_deposit_pct    numeric(5,2);
  v_delivery_charge numeric(10,2);
  v_pickup_return  numeric(10,2);
  v_buyer_fee_pct  numeric(5,2);
  v_buyer_fee      numeric(10,2);
  v_seller_comm_pct numeric(5,2);
  v_seller_comm    numeric(10,2);
  v_seller_payout  numeric(10,2);
  v_total_item     numeric(10,2);
  v_total_all      numeric(10,2);
  v_buyer_city     text;
  v_profile_city   text;
  v_is_available   boolean;
  v_cf_order_id    text;
  v_cf_payment_id  text;
BEGIN
  -- Lock the payment attempt row for atomicity
  SELECT * INTO v_attempt FROM public.payment_attempts WHERE id = p_payment_attempt_id FOR UPDATE;
  IF v_attempt IS NULL THEN RAISE EXCEPTION 'Payment attempt not found.'; END IF;

  -- Idempotency: already processed
  IF v_attempt.status = 'paid' AND v_attempt.rental_booking_id IS NOT NULL THEN
    RETURN v_attempt.rental_booking_id;
  END IF;

  IF v_attempt.cashfree_order_id IS NULL OR v_attempt.cashfree_payment_id IS NULL THEN
    RAISE EXCEPTION 'Cashfree payment has not been verified.';
  END IF;

  v_meta          := COALESCE(v_attempt.metadata, '{}'::jsonb);
  v_cf_order_id   := v_attempt.cashfree_order_id;
  v_cf_payment_id := v_attempt.cashfree_payment_id;

  -- Load platform settings once
  SELECT * INTO v_settings FROM public.platform_settings WHERE id = 1;

  v_buyer_fee_pct   := COALESCE((v_meta->>'buyer_platform_fee_percentage')::numeric, v_settings.buyer_platform_fee_percentage);
  v_seller_comm_pct := COALESCE((v_meta->>'seller_commission_percentage')::numeric, v_settings.seller_commission_percentage);

  -- Resolve buyer city:
  --   1st choice: delivery_address.city captured at checkout (set by mobile/web)
  --   2nd choice: profiles.city (fallback for legacy / profile-only flow)
  SELECT city INTO v_profile_city FROM public.profiles WHERE id = v_attempt.buyer_id;
  v_buyer_city := lower(trim(COALESCE(
    v_meta -> 'delivery_address' ->> 'city',
    v_profile_city
  )));

  -- Resolve items array: multi-item format has meta->rental_items; fall back to single-item meta
  v_items := v_meta->'rental_items';
  IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
    -- Single-item compat: reconstruct an array with one element from flat meta
    v_items := jsonb_build_array(jsonb_build_object(
      'product_id',           v_meta->>'product_id',
      'rental_start_date',    v_meta->>'rental_start_date',
      'rental_end_date',      v_meta->>'rental_end_date',
      'selected_size',        v_meta->>'selected_size',
      'selected_color',       v_meta->>'selected_color',
      'delivery_charge',      v_meta->'delivery_charge',
      'pickup_return_charge', v_meta->'pickup_return_charge',
      'security_deposit',     v_meta->'security_deposit',
      'buyer_platform_fee',   v_meta->'buyer_platform_fee'
    ));
  END IF;

  -- ── Validate total amount matches sum across all items ────────────────────
  v_total_all := 0;
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
  LOOP
    v_product_id     := (v_item->>'product_id')::uuid;
    v_start_date     := (v_item->>'rental_start_date')::date;
    v_end_date       := (v_item->>'rental_end_date')::date;

    SELECT * INTO v_product FROM public.products WHERE id = v_product_id;
    IF v_product IS NULL THEN RAISE EXCEPTION 'Product % not found.', v_product_id; END IF;
    IF v_product.status <> 'active' THEN RAISE EXCEPTION 'Product % is not active.', v_product_id; END IF;

    -- City match: compare normalised buyer city against normalised product city
    IF v_buyer_city IS NULL OR v_product.city IS NULL
       OR v_buyer_city <> lower(trim(v_product.city)) THEN
      RAISE EXCEPTION 'Rental only available in listing city (%). Your delivery city: %.',
        v_product.city, COALESCE(v_buyer_city, 'unspecified');
    END IF;

    v_rental_days      := v_end_date - v_start_date + 1;
    v_rent_per_day     := v_product.rent_price_per_day;
    v_rental_amount    := v_rent_per_day * v_rental_days;
    v_security_deposit := COALESCE(NULLIF(v_item->>'security_deposit','')::numeric,
                                   COALESCE(v_product.security_deposit, 0));
    v_delivery_charge  := COALESCE(NULLIF(v_item->>'delivery_charge','')::numeric,
                                   COALESCE(v_product.delivery_charge, v_settings.default_delivery_charge));
    v_pickup_return    := COALESCE(NULLIF(v_item->>'pickup_return_charge','')::numeric,
                                   v_settings.pickup_return_charge);
    v_buyer_fee        := COALESCE(NULLIF(v_item->>'buyer_platform_fee','')::numeric,
                                   ROUND((v_rental_amount * v_buyer_fee_pct) / 100.0, 2));

    v_total_item := v_rental_amount + v_security_deposit + v_delivery_charge + v_pickup_return + v_buyer_fee;
    v_total_all  := v_total_all + v_total_item;
  END LOOP;

  IF ABS(v_total_all - v_attempt.amount) > 1.0 THEN
    RAISE EXCEPTION 'Amount mismatch: expected %, got %.', v_attempt.amount, v_total_all;
  END IF;

  -- ── Create a booking for each item ───────────────────────────────────────
  v_first_id := NULL;
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
  LOOP
    v_product_id     := (v_item->>'product_id')::uuid;
    v_start_date     := (v_item->>'rental_start_date')::date;
    v_end_date       := (v_item->>'rental_end_date')::date;
    v_selected_size  := v_item->>'selected_size';
    v_selected_color := v_item->>'selected_color';

    SELECT * INTO v_product FROM public.products WHERE id = v_product_id FOR UPDATE;

    -- Availability check (re-check under lock)
    SELECT NOT EXISTS (
      SELECT 1 FROM public.rental_bookings
      WHERE product_id = v_product_id
        AND status NOT IN ('cancelled', 'payment_failed')
        AND daterange(rental_start_date, rental_end_date, '[]') &&
            daterange(v_start_date, v_end_date, '[]')
    ) INTO v_is_available;
    IF NOT v_is_available THEN
      RAISE EXCEPTION 'Product % has overlapping bookings for requested dates.', v_product_id;
    END IF;

    v_rental_days      := v_end_date - v_start_date + 1;
    v_rent_per_day     := v_product.rent_price_per_day;
    v_rental_amount    := v_rent_per_day * v_rental_days;
    v_security_deposit := COALESCE(NULLIF(v_item->>'security_deposit','')::numeric,
                                   COALESCE(v_product.security_deposit, 0));
    v_deposit_pct      := CASE WHEN v_rent_per_day > 0
                               THEN ROUND(v_security_deposit / NULLIF(v_rental_amount,0) * 100, 2)
                               ELSE 0 END;
    v_delivery_charge  := COALESCE(NULLIF(v_item->>'delivery_charge','')::numeric,
                                   COALESCE(v_product.delivery_charge, v_settings.default_delivery_charge));
    v_pickup_return    := COALESCE(NULLIF(v_item->>'pickup_return_charge','')::numeric,
                                   v_settings.pickup_return_charge);
    v_buyer_fee        := COALESCE(NULLIF(v_item->>'buyer_platform_fee','')::numeric,
                                   ROUND((v_rental_amount * v_buyer_fee_pct) / 100.0, 2));
    v_seller_comm      := ROUND((v_rental_amount * v_seller_comm_pct) / 100.0, 2);
    v_seller_payout    := v_rental_amount - v_seller_comm;
    v_total_item       := v_rental_amount + v_security_deposit + v_delivery_charge + v_pickup_return + v_buyer_fee;

    INSERT INTO public.rental_bookings (
      buyer_id,
      seller_id,
      product_id,
      rental_start_date,
      rental_end_date,
      rent_per_day,
      rental_amount,
      security_deposit,
      security_deposit_percentage,
      delivery_charge,
      pickup_return_charge,
      buyer_platform_fee_percentage,
      buyer_platform_fee,
      seller_commission_percentage,
      seller_commission_amount,
      seller_payout_amount,
      total_charged,
      selected_size,
      selected_color,
      status,
      payment_status,
      payment_method,
      cashfree_order_id,
      cashfree_payment_id,
      deposit_refund_status,
      delivery_address_snapshot
    ) VALUES (
      v_attempt.buyer_id,
      v_product.seller_id,
      v_product_id,
      v_start_date,
      v_end_date,
      v_rent_per_day,
      v_rental_amount,
      v_security_deposit,
      v_deposit_pct,
      v_delivery_charge,
      v_pickup_return,
      v_buyer_fee_pct,
      v_buyer_fee,
      v_seller_comm_pct,
      v_seller_comm,
      v_seller_payout,
      v_total_item,
      v_selected_size,
      v_selected_color,
      'confirmed',
      'paid',
      'cashfree',
      v_cf_order_id,
      v_cf_payment_id,
      CASE WHEN v_security_deposit > 0 THEN 'pending' ELSE 'not_applicable' END,
      COALESCE((v_attempt.metadata->'delivery_address'), (v_meta->'delivery_address'), '{}'::jsonb)
    ) RETURNING id INTO v_booking_id;

    -- Remove the rented item from buyer cart
    DELETE FROM public.cart_items
    WHERE user_id = v_attempt.buyer_id
      AND product_id = v_product_id
      AND purchase_type = 'rent';

    IF v_first_id IS NULL THEN v_first_id := v_booking_id; END IF;
  END LOOP;

  -- Mark payment attempt as paid (store first booking ID for single-item compat)
  UPDATE public.payment_attempts
  SET status = 'paid', rental_booking_id = v_first_id
  WHERE id = p_payment_attempt_id;

  RETURN v_first_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_paid_rental_booking(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_paid_rental_booking(uuid) TO service_role;
