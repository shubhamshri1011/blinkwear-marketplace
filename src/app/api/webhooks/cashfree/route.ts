import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cfSecretKey = process.env.CF_SECRET_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!serviceKey || !cfSecretKey) {
      console.error('[Cashfree Webhook] Missing server credentials (CF_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY).');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const rawBody = await req.text();

    // Verify Cashfree webhook signature (mandatory headers)
    const signature = req.headers.get('x-webhook-signature');
    const timestamp = req.headers.get('x-webhook-timestamp');

    if (!signature || !timestamp) {
      console.error('[Cashfree Webhook] Missing signature or timestamp headers.');
      return NextResponse.json({ error: 'Missing webhook signature headers' }, { status: 401 });
    }

    // Timestamp freshness verification (reject if older than 5 minutes)
    const tsNum = Number(timestamp);
    if (!Number.isFinite(tsNum) || tsNum <= 0) {
      console.error('[Cashfree Webhook] Invalid timestamp format.');
      return NextResponse.json({ error: 'Invalid webhook timestamp' }, { status: 401 });
    }

    const now = Date.now();
    const tsMs = tsNum < 1e11 ? tsNum * 1000 : tsNum;
    const ageMs = Math.abs(now - tsMs);
    const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

    if (ageMs > MAX_AGE_MS) {
      console.error(`[Cashfree Webhook] Webhook timestamp expired: age ${Math.round(ageMs / 1000)}s.`);
      return NextResponse.json({ error: 'Webhook timestamp expired' }, { status: 401 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', cfSecretKey)
      .update(timestamp + rawBody)
      .digest('base64');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
    const signatureBuffer = Buffer.from(signature, 'utf-8');

    if (
      expectedBuffer.length !== signatureBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
    ) {
      console.error('[Cashfree Webhook] Invalid webhook signature detected.');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const eventType = payload.type || payload.event;
    const orderData = payload.data?.order;
    const paymentData = payload.data?.payment;

    const cashfreeOrderId = orderData?.order_id || payload.order_id;
    const paymentStatus = paymentData?.payment_status || payload.payment_status;
    const cfPaymentId = paymentData?.cf_payment_id || payload.cf_payment_id;
    const paymentAmount = Number(paymentData?.payment_amount || orderData?.order_amount || 0);
    const paymentCurrency = paymentData?.payment_currency || orderData?.order_currency || '';

    if (!cashfreeOrderId) {
      return NextResponse.json({ message: 'No cashfree_order_id found in event' }, { status: 200 });
    }

    console.log(`[Cashfree Webhook] Event: ${eventType}, Order: ${cashfreeOrderId}, Status: ${paymentStatus}`);

    // Handle Refund Status Webhook
    if (eventType === 'REFUND_STATUS_WEBHOOK') {
      const refundData = payload.data?.refund || payload.refund;
      const refOrderId = refundData?.order_id || cashfreeOrderId;
      const refStatus = refundData?.refund_status;
      const refAmount = Number(refundData?.refund_amount || 0);
      const refundId = refundData?.refund_id || refundData?.cf_refund_id;

      console.log(`[Cashfree Webhook] Refund event: order ${refOrderId}, status ${refStatus}, amount ${refAmount}`);

      if (refOrderId) {
        if (refStatus === 'SUCCESS') {
          await supabase
            .from('rental_bookings')
            .update({
              deposit_refund_status: 'refunded',
              deposit_refund_amount: refAmount,
              deposit_refunded_at: new Date().toISOString(),
              ...(refundId ? { deposit_refund_id: refundId } : {}),
            })
            .eq('cashfree_order_id', refOrderId);
        } else if (refStatus === 'FAILED') {
          await supabase
            .from('rental_bookings')
            .update({
              deposit_refund_status: 'failed',
            })
            .eq('cashfree_order_id', refOrderId);
        }
      }
      return NextResponse.json({ status: 'OK', message: 'Refund status recorded' }, { status: 200 });
    }

    // Only process successful payment events
    if (eventType !== 'PAYMENT_SUCCESS_WEBHOOK' && paymentStatus !== 'SUCCESS') {
      // Handle failure statuses
      if (['FAILED', 'USER_DROPPED', 'CANCELLED'].includes(paymentStatus)) {
        const { data: failAttempt } = await supabase
          .from('payment_attempts')
          .select('id, status')
          .eq('cashfree_order_id', cashfreeOrderId)
          .single();

        if (failAttempt && failAttempt.status !== 'paid') {
          await supabase
            .from('payment_attempts')
            .update({ status: 'failed' })
            .eq('id', failAttempt.id);
          console.log(`[Cashfree Webhook] Marked payment attempt as failed: ${failAttempt.id}`);
        }
      }
      return NextResponse.json({ status: 'OK' }, { status: 200 });
    }

    // Currency guard: only accept INR payments
    if (paymentCurrency && paymentCurrency !== 'INR') {
      console.error(`[Cashfree Webhook] Unexpected currency: ${paymentCurrency}`);
      return NextResponse.json({ error: 'Unsupported currency' }, { status: 400 });
    }

    // Lookup payment attempt
    const { data: attempt, error: attemptErr } = await supabase
      .from('payment_attempts')
      .select('id, buyer_id, amount, status, booking_type, rental_booking_id, order_id')
      .eq('cashfree_order_id', cashfreeOrderId)
      .single();

    if (attemptErr || !attempt) {
      console.warn(`[Cashfree Webhook] Payment attempt not found for order: ${cashfreeOrderId}`);
      return NextResponse.json({ message: 'Attempt not found, ignored' }, { status: 200 });
    }

    // Amount verification guard
    if (paymentAmount > 0 && Math.abs(paymentAmount - Number(attempt.amount)) > 0.05) {
      console.error(
        `[Cashfree Webhook] Amount mismatch: paid ${paymentAmount} vs attempt ${attempt.amount}`
      );
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
    }

    // Atomic idempotency: only one webhook can mark this as paid.
    // UPDATE ... WHERE status <> 'paid' RETURNING id ensures:
    //   - If already paid → 0 rows returned → skip re-processing
    //   - If not yet paid → 1 row returned → proceed with order creation
    const { data: updatedRows } = await supabase
      .from('payment_attempts')
      .update({
        status: 'paid',
        ...(cfPaymentId ? { cashfree_payment_id: String(cfPaymentId) } : {}),
      })
      .eq('id', attempt.id)
      .neq('status', 'paid')
      .select('id');

    if (!updatedRows || updatedRows.length === 0) {
      // Already paid by a concurrent webhook — idempotent success
      return NextResponse.json({ message: 'Already reconciled' }, { status: 200 });
    }

    // Follow-up writes: only run because we atomically claimed the attempt above
    if (attempt.booking_type === 'rental') {
      const { data: bookingId, error: rpcErr } = await supabase.rpc(
        'create_paid_rental_booking',
        {
          p_payment_attempt_id: attempt.id,
        }
      );

      if (rpcErr) {
        console.error('[Cashfree Webhook] Error creating rental booking:', rpcErr);
        return NextResponse.json({ error: rpcErr.message }, { status: 500 });
      }

      console.log(`[Cashfree Webhook] Confirmed rental booking: ${bookingId}`);
    } else {
      const { data: orderId, error: rpcErr } = await supabase.rpc('create_paid_order', {
        p_payment_attempt_id: attempt.id,
      });

      if (rpcErr) {
        console.error('[Cashfree Webhook] Error creating buy order:', rpcErr);
        return NextResponse.json({ error: rpcErr.message }, { status: 500 });
      }

      console.log(`[Cashfree Webhook] Confirmed buy order: ${orderId}`);
    }

    return NextResponse.json({ status: 'OK' }, { status: 200 });
  } catch (err: any) {
    console.error('[Cashfree Webhook Exception]', err);
    return NextResponse.json({ error: 'Internal webhook error' }, { status: 500 });
  }
}
