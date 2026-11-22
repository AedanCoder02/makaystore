import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { ensurePaymentSchema, parseJsonArray } from '@/lib/payments';
import { getStripe, toCents } from '@/lib/stripe';

// POST { orderId } — creates (or reuses) the PaymentIntent for a card order. Amount comes from the DB, not the client.
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: 'Pagos con tarjeta no configurados' }, { status: 503 });

  const { orderId } = (await req.json()) as { orderId?: string };
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

  await ensurePaymentSchema();
  const rows = await sql`
    SELECT id, total, customer_email, payment_status, payment_methods, payment_provider_ref
    FROM orders WHERE id = ${orderId}
  `;
  const order = rows[0];
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const methods = parseJsonArray<{ method: string }>(order.payment_methods);
  if (methods[0]?.method !== 'stripe' || order.payment_status !== 'awaiting_payment') {
    return NextResponse.json({ error: 'El pedido no espera un pago con tarjeta' }, { status: 409 });
  }

  if (order.payment_provider_ref) {
    const existing = await stripe.paymentIntents.retrieve(order.payment_provider_ref as string);
    if (existing.status !== 'canceled' && existing.client_secret) {
      return NextResponse.json({ clientSecret: existing.client_secret });
    }
  }

  const intent = await stripe.paymentIntents.create(
    {
      amount: toCents(Number(order.total)),
      currency: 'usd',
      payment_method_types: ['card'],
      description: `Makay Guacuco ${order.id}`,
      receipt_email: (order.customer_email as string | null) ?? undefined,
      metadata: { order_id: order.id as string },
    },
    { idempotencyKey: `order-${order.id}` },
  );

  await sql`UPDATE orders SET payment_provider_ref = ${intent.id}, updated_at = NOW() WHERE id = ${order.id}`;
  return NextResponse.json({ clientSecret: intent.client_secret });
}
