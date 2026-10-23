-- ============================================================================
-- PHASE 39 - Fix Buy Order RPC Amount Calculation
-- ============================================================================
-- Problem: Buy orders were previously including pickup_return_charge (settings default 70)
-- in the total verification calculation in create_paid_order, even though buy checkouts
-- and create-cashfree-order do not charge pickup/return fees for purchases.
-- This caused ABS(total - a.amount) > 0.05 to fail for every buy order after payment.
--
-- Solution: In create_paid_order, enforce pickup := 0 for buy orders, matching
-- create-cashfree-order amount calculation (subtotal + delivery + fee).
-- ============================================================================

DROP FUNCTION IF EXISTS public.create_paid_order(uuid);

CREATE OR REPLACE FUNCTION public.create_paid_order(p_payment_attempt_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  a record;
  meta jsonb;
  settings record;
  o uuid;
  item record;
  product record;
  subtotal numeric(10,2) := 0;
  delivery numeric(10,2) := 0;
  pickup numeric(10,2) := 0;
  fee numeric(10,2) := 0;
  total numeric(10,2);
  unit_price numeric(10,2);
  item_delivery numeric(10,2);
  item_fee numeric(10,2);
  commission numeric(10,2);
  updated_count int;
BEGIN
  -- Lock payment attempt row for atomicity
  SELECT * INTO a
  FROM public.payment_attempts
  WHERE id = p_payment_attempt_id
  FOR UPDATE;

  IF a IS NULL THEN
    RAISE EXCEPTION 'Payment attempt not found.';
  END IF;

  -- Idempotency check: already paid and created
  IF a.status = 'paid' AND a.order_id IS NOT NULL THEN
    RETURN a.order_id;
  END IF;

  IF a.cashfree_order_id IS NULL OR a.cashfree_payment_id IS NULL THEN
    RAISE EXCEPTION 'Cashfree payment has not been verified.';
  END IF;

  meta := COALESCE(a.metadata, '{}'::jsonb);
  SELECT * INTO settings FROM public.platform_settings WHERE id = 1;

  IF meta->>'checkout_type' = 'direct' THEN
    SELECT * INTO product
    FROM public.products
    WHERE id = (meta->'direct_item'->>'product_id')::uuid
    FOR UPDATE;

    IF product IS NULL OR product.status <> 'active' THEN
      RAISE EXCEPTION 'Product is no longer available.';
    END IF;
    IF product.seller_id IS NULL THEN
      RAISE EXCEPTION 'Product has no seller.';
    END IF;
    IF product.stock_quantity < (meta->'direct_item'->>'quantity')::int THEN
      RAISE EXCEPTION 'Insufficient stock.';
    END IF;

    unit_price := COALESCE(product.discount_price, product.sale_price);
    IF unit_price IS NULL THEN
      RAISE EXCEPTION 'Product has no purchase price.';
    END IF;

    subtotal := unit_price * (meta->'direct_item'->>'quantity')::int;
    delivery := COALESCE(product.delivery_charge, settings.default_delivery_charge, 70);
  ELSE
    -- CART CHECKOUT: Strictly filter by purchase_type = 'buy'
    FOR item IN
      SELECT ci.*, p.title, p.seller_id, p.status, p.stock_quantity, p.discount_price, p.sale_price, p.delivery_charge
      FROM public.cart_items ci
      JOIN public.products p ON p.id = ci.product_id
      WHERE ci.user_id = a.buyer_id
        AND ci.purchase_type = 'buy'
      FOR UPDATE OF p
    LOOP
      IF item.status <> 'active' OR item.seller_id IS NULL OR item.stock_quantity < item.quantity THEN
        RAISE EXCEPTION 'Cart item "%" is no longer available in the requested quantity.', item.title;
      END IF;

      unit_price := COALESCE(item.discount_price, item.sale_price);
      IF unit_price IS NULL THEN
        RAISE EXCEPTION 'Product "%" has no purchase price.', item.title;
      END IF;

      subtotal := subtotal + unit_price * item.quantity;
      delivery := delivery + COALESCE(item.delivery_charge, settings.default_delivery_charge, 70);
    END LOOP;

    IF subtotal = 0 THEN
      RAISE EXCEPTION 'Cart has no purchase items ready for order creation.';
    END IF;
  END IF;

  -- Buy orders do not have pickup/return charges (pickup := 0)
  pickup := 0;
  fee := COALESCE((meta->>'buyer_platform_fee')::numeric, 0);
  total := ROUND(subtotal + delivery + fee, 2);

  IF ABS(total - a.amount) > 0.05 THEN
    RAISE EXCEPTION 'Charged amount (%) does not match current total (%).', a.amount, total;
  END IF;

  -- Create order record
  INSERT INTO public.orders (
    buyer_id, status, payment_status, payment_method, order_total, subtotal,
    buyer_platform_fee, total_delivery_charge, pickup_return_charge,
    cashfree_order_id, cashfree_payment_id, delivery_address_snapshot
  ) VALUES (
    a.buyer_id, 'pending', 'paid', 'cashfree', total, subtotal,
    fee, delivery, pickup, a.cashfree_order_id, a.cashfree_payment_id,
    COALESCE(meta->'delivery_address', '{}'::jsonb)
  ) RETURNING id INTO o;

  IF meta->>'checkout_type' = 'direct' THEN
    commission := ROUND(subtotal * COALESCE(settings.seller_commission_percentage, 0) / 100.0, 2);
    INSERT INTO public.order_items (
      order_id, seller_id, product_id, product_title, purchase_type, quantity,
      unit_price, security_deposit, selected_size, selected_color, line_total,
      delivery_charge, buyer_platform_fee, seller_commission_percentage,
      seller_commission_amount, seller_payout_amount
    ) VALUES (
      o, product.seller_id, product.id, product.title, 'buy',
      (meta->'direct_item'->>'quantity')::int, unit_price, NULL,
      meta->'direct_item'->>'selected_size', meta->'direct_item'->>'selected_color', subtotal,
      delivery, fee, COALESCE(settings.seller_commission_percentage, 0), commission, subtotal - commission
    );

    UPDATE public.products
    SET stock_quantity = stock_quantity - (meta->'direct_item'->>'quantity')::int
    WHERE id = product.id AND stock_quantity >= (meta->'direct_item'->>'quantity')::int;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count = 0 THEN
      RAISE EXCEPTION 'Insufficient stock for product.';
    END IF;
  ELSE
    FOR item IN
      SELECT ci.*, p.title, p.seller_id, p.discount_price, p.sale_price, p.delivery_charge
      FROM public.cart_items ci
      JOIN public.products p ON p.id = ci.product_id
      WHERE ci.user_id = a.buyer_id
        AND ci.purchase_type = 'buy'
    LOOP
      unit_price := COALESCE(item.discount_price, item.sale_price);
      item_delivery := COALESCE(item.delivery_charge, settings.default_delivery_charge, 70);
      item_fee := CASE WHEN subtotal > 0 THEN ROUND((unit_price * item.quantity / subtotal) * fee, 2) ELSE 0 END;
      commission := ROUND((unit_price * item.quantity) * COALESCE(settings.seller_commission_percentage, 0) / 100.0, 2);

      INSERT INTO public.order_items (
        order_id, seller_id, product_id, product_title, purchase_type, quantity,
        unit_price, security_deposit, selected_size, selected_color, line_total,
        delivery_charge, buyer_platform_fee, seller_commission_percentage,
        seller_commission_amount, seller_payout_amount
      ) VALUES (
        o, item.seller_id, item.product_id, item.title, 'buy', item.quantity,
        unit_price, NULL, item.selected_size, item.selected_color, unit_price * item.quantity,
        item_delivery, item_fee, COALESCE(settings.seller_commission_percentage, 0),
        commission, (unit_price * item.quantity) - commission
      );

      UPDATE public.products
      SET stock_quantity = stock_quantity - item.quantity
      WHERE id = item.product_id AND stock_quantity >= item.quantity;

      GET DIAGNOSTICS updated_count = ROW_COUNT;
      IF updated_count = 0 THEN
        RAISE EXCEPTION 'Insufficient stock for product "%".', item.title;
      END IF;
    END LOOP;

    -- Clean up ONLY purchased 'buy' items from cart
    DELETE FROM public.cart_items
    WHERE user_id = a.buyer_id
      AND purchase_type = 'buy';
  END IF;

  -- Record order_id on payment attempt
  UPDATE public.payment_attempts
  SET status = 'paid', order_id = o
  WHERE id = a.id;

  RETURN o;
END;
$$;

REVOKE ALL ON FUNCTION public.create_paid_order(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_paid_order(uuid) TO service_role;
