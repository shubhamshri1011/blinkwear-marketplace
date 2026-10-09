import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function cleanServerEnv(value: string | undefined): string {
  let cleaned = value?.trim() ?? '';
  const first = cleaned[0];
  if ((first === '"' || first === "'") && cleaned[cleaned.length - 1] === first) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function POST(req: NextRequest) {
  let signatureVerified = false;
  try {
    const supabaseUrl = cleanServerEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const serviceKey = cleanServerEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
    const cfSecretKey = cleanServerEnv(process.env.CF_SECRET_KEY);
    const missingEnv = [
      !supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
      !serviceKey ? 'SUPABASE_SERVICE_ROLE_KEY' : null,
      !cfSecretKey ? 'CF_SECRET_KEY' : null,
    ].filter((name): name is string => name !== null);

    if (missingEnv.length > 0) {
      console.error('[Cashfree Webhook] Missing server environment variables.', { names: missingEnv });
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
      console.error('[Cashfree Webhook] Signature verification failed.');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }
    signatureVerified = true;

    const supabase = createClient(supabaseUrl, serviceKey);

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.warn('[Cashfree Webhook] Signed request had invalid JSON; ignored.');
      return NextResponse.json({ status: 'OK' }, { status: 200 });
    }

    const eventValue = payload?.type ?? payload?.event;
    const eventType = typeof eventValue === 'string' ? eventValue : '';
    const orderData = payload.data?.order;
    const paymentData = payload.data?.payment;

    const cashfreeOrderId = orderData?.order_id || payload.order_id;
    const paymentStatus = paymentData?.payment_status || payload.payment_status;
    const cfPaymentId = paymentData?.cf_payment_id || payload.cf_payment_id;
    const paymentAmount = Number(paymentData?.payment_amount || orderData?.order_amount || 0);
    const paymentCurrency = paymentData?.payment_currency || orderData?.order_currency || '';

    const knownEvents = new Set([
      'PAYMENT_SUCCESS_WEBHOOK',
      'PAYMENT_FAILED_WEBHOOK',
      'PAYMENT_USER_DROPPED_WEBHOOK',
      'REFUND_STATUS_WEBHOOK',
    ]);

    if (!knownEvents.has(eventType)) {
      console.info('[Cashfree Webhook] Signed event ignored.', {
        eventType: eventType || 'missing',
        hasOrderId: Boolean(cashfreeOrderId),
      });
      return NextResponse.json({ status: 'OK' }, { status: 200 });
    }

    if (!cashfreeOrderId) {
      console.info('[Cashfree Webhook] Signed event has no order ID; ignored.', { eventType });
      return NextResponse.json({ status: 'OK' }, { status: 200 });
    }

    console.log(`[Cashfree Webhook] Event: ${eventType}, Order: ${cashfreeOrderId}, Status: ${paymentStatus}`);

    // Handle Refund Status Webhook
    if (eventType === 'REFUND_STATUS_WEBHOOK') {
      const refundData = payload.data?.refund || payload.refund;
      const refOrderId = refundData?.order_id || cashfreeOrderId;
      const refStatus = refundData?.refund_status;
      const refAmount = Number(refundData?.refund_amount || 0);
      const refundId = refundData?.refund_id || refundData?.cf_refund_id;

      console.log('[Cashfree Webhook] Refund event received.', { status: refStatus, amount: refAmount });

      if (refOrderId) {
        if (refStatus === 'SUCCESS') {
          const { error } = await supabase
            .from('rental_bookings')
            .update({
              deposit_refund_status: 'refunded',
              deposit_refund_amount: refAmount,
              deposit_refunded_at: new Date().toISOString(),
              ...(refundId ? { deposit_refund_id: refundId } : {}),
            })
            .eq('cashfree_order_id', refOrderId);
          if (error) console.error('[Cashfree Webhook] Refund status update failed.', { code: error.code });
        } else if (refStatus === 'FAILED') {
          const { error } = await supabase
            .from('rental_bookings')
            .update({
              deposit_refund_status: 'failed',
            })
            .eq('cashfree_order_id', refOrderId);
          if (error) console.error('[Cashfree Webhook] Refund failure update failed.', { code: error.code });
        } else {
          console.info('[Cashfree Webhook] Refund status ignored.', { status: refStatus ?? 'missing' });
        }
      } else {
        console.info('[Cashfree Webhook] Refund event has no order ID; ignored.');
      }
      return NextResponse.json({ status: 'OK', message: 'Refund status recorded' }, { status: 200 });
    }

    if (eventType !== 'PAYMENT_SUCCESS_WEBHOOK') {
      if (['FAILED', 'USER_DROPPED', 'CANCELLED'].includes(paymentStatus)) {
        const { data: failAttempt, error: lookupError } = await supabase
          .from('payment_attempts')
          .select('id, status')
          .eq('cashfree_order_id', cashfreeOrderId)
          .single();

        if (lookupError || !failAttempt) {
          console.info('[Cashfree Webhook] Signed failure event has no matching attempt; ignored.');
          return NextResponse.json({ status: 'OK' }, { status: 200 });
        }

        if (failAttempt && failAttempt.status !== 'paid') {
          const { error } = await supabase
            .from('payment_attempts')
            .update({ status: 'failed' })
            .eq('id', failAttempt.id);
          if (error) console.error('[Cashfree Webhook] Failed to record payment failure.', { code: error.code });
        }
      }
      return NextResponse.json({ status: 'OK' }, { status: 200 });
    }

    if (paymentStatus !== 'SUCCESS') {
      console.info('[Cashfree Webhook] Success event did not contain a successful payment; ignored.');
      return NextResponse.json({ status: 'OK' }, { status: 200 });
    }

    // Currency guard: only accept INR payments
    if (paymentCurrency && paymentCurrency !== 'INR') {
      console.error('[Cashfree Webhook] Signed payment event had unsupported currency; ignored.', { currency: paymentCurrency });
      return NextResponse.json({ status: 'OK' }, { status: 200 });
    }

    // Lookup payment attempt
    const { data: attempt, error: attemptErr } = await supabase
      .from('payment_attempts')
      .select('id, buyer_id, amount, status, booking_type, rental_booking_id, order_id')
      .eq('cashfree_order_id', cashfreeOrderId)
      .single();

    if (attemptErr || !attempt) {
      console.info('[Cashfree Webhook] Signed payment event has no matching attempt; ignored.');
      return NextResponse.json({ status: 'OK' }, { status: 200 });
    }

    // Amount verification guard
    if (paymentAmount > 0 && Math.abs(paymentAmount - Number(attempt.amount)) > 0.05) {
      console.error('[Cashfree Webhook] Signed payment amount mismatch; ignored.');
      return NextResponse.json({ status: 'OK' }, { status: 200 });
    }

    if (!cfPaymentId) {
      console.info('[Cashfree Webhook] Signed payment event has no Cashfree payment ID; ignored.');
      return NextResponse.json({ status: 'OK' }, { status: 200 });
    }

    // The finalization RPC owns the transaction lock and marks the attempt paid
    // only after creating the order/booking, so a retry can recover failures.
    const { error: paymentUpdateError } = await supabase
      .from('payment_attempts')
      .update({ cashfree_payment_id: String(cfPaymentId) })
      .eq('id', attempt.id);

    if (paymentUpdateError) {
      console.error('[Cashfree Webhook] Failed to store verified payment ID.', { code: paymentUpdateError.code });
      return NextResponse.json({ status: 'OK' }, { status: 200 });
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
        console.error('[Cashfree Webhook] Rental finalization failed.', {
          code: rpcErr.code ?? 'unknown',
          message: rpcErr.message?.slice(0, 300) ?? 'unknown error',
        });
        return NextResponse.json({ status: 'OK' }, { status: 200 });
      }

      console.log(`[Cashfree Webhook] Confirmed rental booking: ${bookingId}`);
    } else {
      const { data: orderId, error: rpcErr } = await supabase.rpc('create_paid_order', {
        p_payment_attempt_id: attempt.id,
      });

      if (rpcErr) {
        console.error('[Cashfree Webhook] Buy finalization failed.', {
          code: rpcErr.code ?? 'unknown',
          message: rpcErr.message?.slice(0, 300) ?? 'unknown error',
        });
        return NextResponse.json({ status: 'OK' }, { status: 200 });
      }

      console.log(`[Cashfree Webhook] Confirmed buy order: ${orderId}`);
    }

    return NextResponse.json({ status: 'OK' }, { status: 200 });
  } catch (err: any) {
    console.error('[Cashfree Webhook] Request handling failed.', {
      phase: signatureVerified ? 'signed-event-processing' : 'signature-validation',
      errorType: err instanceof Error ? err.name : 'unknown',
    });
    return signatureVerified
      ? NextResponse.json({ status: 'OK' }, { status: 200 })
      : NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }
}
