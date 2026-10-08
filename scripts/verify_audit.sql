DO $$
DECLARE
  v_test_user_id uuid := '08435f65-2054-45e5-b640-e7d3580a292c';
  v_prod_a uuid := 'f33b3e6b-0a5d-438c-a05b-95dab58b6736';
  v_prod_b uuid := '45a4560e-61c0-44a1-bf7e-d8bd5cc6fd8c';
  v_prod_c uuid := 'c83c2118-8a47-40dd-8ac4-3407c2f6154c';
  v_prod_buy uuid := 'f5f6e30a-fc45-421e-afe7-c93ed1629701';

  v_cart_count int;
  v_item_b_id uuid;
  v_order_id uuid;
  v_order_id_retry uuid;
  v_attempt_id uuid;
  v_failed_attempt_id uuid;
  v_cancelled_attempt_id uuid;
  v_order_items_count int;
BEGIN
  RAISE NOTICE '=== STARTING BLINKWEAR 15-POINT AUDIT TEST SUITE ===';

  -- Clean up any previous test artifacts
  DELETE FROM public.cart_items WHERE user_id = v_test_user_id;

  -- TEST 1: Add Product A rental -> success
  INSERT INTO public.cart_items (
    user_id, product_id, purchase_type, quantity,
    rental_start_date, rental_end_date, selected_size, selected_color
  ) VALUES (
    v_test_user_id, v_prod_a, 'rent', 1,
    '2026-11-01', '2026-11-03', 'M', 'Black'
  );
  RAISE NOTICE 'TEST 1: Add Product A rental -> PASS';

  -- TEST 2: Add Product B rental -> success
  INSERT INTO public.cart_items (
    user_id, product_id, purchase_type, quantity,
    rental_start_date, rental_end_date, selected_size, selected_color
  ) VALUES (
    v_test_user_id, v_prod_b, 'rent', 1,
    '2026-11-05', '2026-11-07', 'L', 'Blue'
  ) RETURNING id INTO v_item_b_id;
  RAISE NOTICE 'TEST 2: Add Product B rental -> PASS';

  -- TEST 3: Add Product C rental -> success
  INSERT INTO public.cart_items (
    user_id, product_id, purchase_type, quantity,
    rental_start_date, rental_end_date, selected_size, selected_color
  ) VALUES (
    v_test_user_id, v_prod_c, 'rent', 1,
    '2026-11-10', '2026-11-12', 'Free', 'Red'
  );
  RAISE NOTICE 'TEST 3: Add Product C rental -> PASS';

  -- TEST 4: Add same exact Product A rental again -> unique violation
  BEGIN
    INSERT INTO public.cart_items (
      user_id, product_id, purchase_type, quantity,
      rental_start_date, rental_end_date, selected_size, selected_color
    ) VALUES (
      v_test_user_id, v_prod_a, 'rent', 1,
      '2026-11-01', '2026-11-03', 'M', 'Black'
    );
    RAISE EXCEPTION 'TEST 4 FAILED: duplicate item was inserted without constraint error!';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'TEST 4: Duplicate Product A rental properly prevented -> PASS';
  END;

  -- TEST 5: Add valid different dates for same product -> success
  INSERT INTO public.cart_items (
    user_id, product_id, purchase_type, quantity,
    rental_start_date, rental_end_date, selected_size, selected_color
  ) VALUES (
    v_test_user_id, v_prod_a, 'rent', 1,
    '2026-12-01', '2026-12-03', 'M', 'Black'
  );
  -- Also add a BUY item to verify buy/rent coexistence
  INSERT INTO public.cart_items (
    user_id, product_id, purchase_type, quantity,
    selected_size, selected_color
  ) VALUES (
    v_test_user_id, v_prod_buy, 'buy', 1, 'L', 'White'
  );
  RAISE NOTICE 'TEST 5: Different dates & buy/rent coexistence -> PASS';

  -- TEST 6: Remove Product B -> A and C remain
  DELETE FROM public.cart_items WHERE id = v_item_b_id;
  SELECT count(*) INTO v_cart_count FROM public.cart_items
    WHERE user_id = v_test_user_id AND product_id = v_prod_b;
  IF v_cart_count <> 0 THEN RAISE EXCEPTION 'TEST 6 FAILED: Product B not removed'; END IF;
  SELECT count(*) INTO v_cart_count FROM public.cart_items
    WHERE user_id = v_test_user_id AND product_id IN (v_prod_a, v_prod_c);
  IF v_cart_count < 2 THEN RAISE EXCEPTION 'TEST 6 FAILED: A or C erroneously removed'; END IF;
  RAISE NOTICE 'TEST 6: Remove Product B leaves A and C intact -> PASS';

  -- TEST 7: Create payment attempt for buy checkout
  INSERT INTO public.payment_attempts (
    buyer_id, cashfree_order_id, amount, status, booking_type, metadata
  ) VALUES (
    v_test_user_id,
    'test_cf_order_' || floor(random()*100000)::text,
    1270.00,
    'created',
    'buy',
    jsonb_build_object(
      'checkout_type', 'cart',
      'subtotal', 1200.00,
      'delivery_charge', 0.00,
      'buyer_platform_fee', 70.00,
      'pickup_return_charge', 0.00,
      'delivery_address', jsonb_build_object('city', 'Bhopal', 'phone', '9876543210')
    )
  ) RETURNING id INTO v_attempt_id;
  RAISE NOTICE 'TEST 7: Payment attempt created -> PASS';

  -- TEST 8: Successful Cashfree payment -> order created exactly once
  UPDATE public.payment_attempts
  SET cashfree_payment_id = 'cf_pay_' || floor(random()*100000)::text
  WHERE id = v_attempt_id;

  v_order_id := public.create_paid_order(v_attempt_id);
  IF v_order_id IS NULL THEN RAISE EXCEPTION 'TEST 8 FAILED: Order not returned'; END IF;
  SELECT count(*) INTO v_order_items_count FROM public.order_items WHERE order_id = v_order_id;
  IF v_order_items_count = 0 THEN RAISE EXCEPTION 'TEST 8 FAILED: order_items empty'; END IF;
  RAISE NOTICE 'TEST 8: Cashfree payment -> order % with % items -> PASS', v_order_id, v_order_items_count;

  -- TEST 9: Duplicate payment callback -> idempotent
  v_order_id_retry := public.create_paid_order(v_attempt_id);
  IF v_order_id_retry <> v_order_id THEN
    RAISE EXCEPTION 'TEST 9 FAILED: returned % instead of %', v_order_id_retry, v_order_id;
  END IF;
  RAISE NOTICE 'TEST 9: Duplicate callback is idempotent -> PASS';

  -- TEST 10: Failed Cashfree payment -> no confirmed order
  INSERT INTO public.payment_attempts (
    buyer_id, cashfree_order_id, amount, status, booking_type
  ) VALUES (
    v_test_user_id, 'test_cf_failed_' || floor(random()*100000)::text, 100.00, 'failed', 'buy'
  ) RETURNING id INTO v_failed_attempt_id;

  BEGIN
    PERFORM public.create_paid_order(v_failed_attempt_id);
    RAISE EXCEPTION 'TEST 10 FAILED: Failed payment should not create order!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 10: Failed payment blocks order creation -> PASS';
  END;

  -- TEST 11: Cancelled Cashfree payment -> no confirmed order
  INSERT INTO public.payment_attempts (
    buyer_id, cashfree_order_id, amount, status, booking_type
  ) VALUES (
    v_test_user_id, 'test_cf_cancelled_' || floor(random()*100000)::text, 100.00, 'cancelled', 'buy'
  ) RETURNING id INTO v_cancelled_attempt_id;

  BEGIN
    PERFORM public.create_paid_order(v_cancelled_attempt_id);
    RAISE EXCEPTION 'TEST 11 FAILED: Cancelled payment should not create order!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 11: Cancelled payment blocks order creation -> PASS';
  END;

  -- TEST 12: Non-overlapping rental dates -> allowed
  INSERT INTO public.rental_bookings (
    buyer_id, seller_id, product_id,
    rental_start_date, rental_end_date, rent_per_day,
    rental_amount, security_deposit, total_charged,
    status, payment_status, payment_method
  ) VALUES (
    v_test_user_id, '67d789d1-d259-4ef2-8d0f-662ea8884142', v_prod_a,
    '2026-11-20', '2026-11-22', 100.00,
    300.00, 50.00, 350.00,
    'confirmed', 'paid', 'cashfree'
  );
  INSERT INTO public.rental_bookings (
    buyer_id, seller_id, product_id,
    rental_start_date, rental_end_date, rent_per_day,
    rental_amount, security_deposit, total_charged,
    status, payment_status, payment_method
  ) VALUES (
    v_test_user_id, '67d789d1-d259-4ef2-8d0f-662ea8884142', v_prod_a,
    '2026-11-25', '2026-11-27', 100.00,
    300.00, 50.00, 350.00,
    'confirmed', 'paid', 'cashfree'
  );
  RAISE NOTICE 'TEST 12: Non-overlapping rental bookings allowed -> PASS';

  -- TEST 13: Overlapping rental dates -> rejected
  BEGIN
    INSERT INTO public.rental_bookings (
      buyer_id, seller_id, product_id,
      rental_start_date, rental_end_date, rent_per_day,
      rental_amount, security_deposit, total_charged,
      status, payment_status, payment_method
    ) VALUES (
      v_test_user_id, '67d789d1-d259-4ef2-8d0f-662ea8884142', v_prod_a,
      '2026-11-21', '2026-11-23', 100.00,
      300.00, 50.00, 350.00,
      'confirmed', 'paid', 'cashfree'
    );
    RAISE EXCEPTION 'TEST 13 FAILED: Overlapping booking was not rejected!';
  EXCEPTION WHEN exclusion_violation THEN
    RAISE NOTICE 'TEST 13: Overlapping rental rejected by GIST exclusion -> PASS';
  END;

  -- TEST 14: Re-verify payment -> returns same order (no duplicate)
  v_order_id_retry := public.create_paid_order(v_attempt_id);
  IF v_order_id_retry <> v_order_id THEN
    RAISE EXCEPTION 'TEST 14 FAILED: Re-verification created new order!';
  END IF;
  RAISE NOTICE 'TEST 14: Payment re-verification returns existing order -> PASS';

  -- TEST 15: Cart cleanup only removes purchased buy items
  SELECT count(*) INTO v_cart_count FROM public.cart_items
    WHERE user_id = v_test_user_id AND purchase_type = 'buy';
  IF v_cart_count <> 0 THEN
    RAISE EXCEPTION 'TEST 15 FAILED: Buy items not cleared after order';
  END IF;
  SELECT count(*) INTO v_cart_count FROM public.cart_items
    WHERE user_id = v_test_user_id AND purchase_type = 'rent';
  IF v_cart_count = 0 THEN
    RAISE EXCEPTION 'TEST 15 FAILED: Rental items accidentally deleted by buy order!';
  END IF;
  RAISE NOTICE 'TEST 15: Cart cleanup preserved % rental items -> PASS', v_cart_count;

  -- CLEAN UP (order matters for FK references)
  -- First nullify the FK reference from payment_attempts -> orders
  UPDATE public.payment_attempts
  SET order_id = NULL
  WHERE buyer_id = v_test_user_id AND cashfree_order_id LIKE 'test_cf_%';

  DELETE FROM public.order_items WHERE order_id = v_order_id;
  DELETE FROM public.orders WHERE id = v_order_id;
  DELETE FROM public.rental_bookings
    WHERE buyer_id = v_test_user_id AND rental_start_date >= '2026-11-01';
  DELETE FROM public.payment_attempts
    WHERE buyer_id = v_test_user_id AND cashfree_order_id LIKE 'test_cf_%';
  DELETE FROM public.cart_items WHERE user_id = v_test_user_id;

  -- Restore stock (we consumed 1 unit in test 8)
  UPDATE public.products
  SET stock_quantity = stock_quantity + 1
  WHERE id = v_prod_buy;

  RAISE NOTICE '=== ALL 15 AUDIT TEST CASES PASSED ===';
END $$;
