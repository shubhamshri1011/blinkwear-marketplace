import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const cfSecretKey = process.env.CF_SECRET_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Verify Cashfree webhook signature if secret key & signature headers are present
    const signature = req.headers.get('x-webhook-signature');
    const timestamp = req.headers.get('x-webhook-timestamp');

    if (cfSecretKey && signature && timestamp) {
      const expectedSignature = crypto
        .createHmac('sha256', cfSecretKey)
        .update(timestamp + rawBody)
        .digest('base64');

      if (expectedSignature !== signature) {
        console.error('[Cashfree Webhook] Invalid webhook signature detected.');
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

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

    if (!cashfreeOrderId) {
      return NextResponse.json({ message: 'No cashfree_order_id found in event' }, { status: 200 });
    }

    console.log(`[Cashfree Webhook] Event: ${eventType}, Order: ${cashfreeOrderId}, Status: ${paymentStatus}`);

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

    // Idempotency: If already paid and confirmed, return success immediately
    if (attempt.status === 'paid') {
      return NextResponse.json({ message: 'Already reconciled' }, { status: 200 });
    }

    if (paymentStatus === 'SUCCESS') {
      // Amount verification guard
      if (paymentAmount > 0 && Math.abs(paymentAmount - Number(attempt.amount)) > 0.05) {
        console.error(
          `[Cashfree Webhook] Amount mismatch: paid ${paymentAmount} vs attempt ${attempt.amount}`
        );
        return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
      }

      // Update payment attempt with payment ID
      if (cfPaymentId) {
        await supabase
          .from('payment_attempts')
          .update({
            cashfree_payment_id: String(cfPaymentId),
          })
          .eq('id', attempt.id);
      }

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
    } else if (['FAILED', 'USER_DROPPED', 'CANCELLED'].includes(paymentStatus)) {
      await supabase
        .from('payment_attempts')
        .update({ status: 'failed' })
        .eq('id', attempt.id);
      console.log(`[Cashfree Webhook] Marked payment attempt as failed: ${attempt.id}`);
    }

    return NextResponse.json({ status: 'OK' }, { status: 200 });
  } catch (err: any) {
    console.error('[Cashfree Webhook Exception]', err);
    return NextResponse.json({ error: 'Internal webhook error' }, { status: 500 });
  }
}
