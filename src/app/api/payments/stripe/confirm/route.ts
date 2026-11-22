import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { ensurePaymentSchema } from '@/lib/payments';
import { getStripe, settleStripeIntent } from '@/lib/stripe';

// POST { orderId } — called after confirmCardPayment. Re-reads the PaymentIntent from Stripe; never trusts the client.
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: 'Pagos con tarjeta no configurados' }, { status: 503 });

  const { orderId } = (await req.json()) as { orderId?: string };
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

  await ensurePaymentSchema();
  const rows = await sql`SELECT payment_provider_ref, payment_status FROM orders WHERE id = ${orderId}`;
  const order = rows[0];
  if (!order?.payment_provider_ref) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (order.payment_status === 'paid') return NextResponse.json({ paid: true });

  const pi = await stripe.paymentIntents.retrieve(order.payment_provider_ref as string);
  const paid = await settleStripeIntent(pi);
  return NextResponse.json({ paid, status: pi.status }, { status: paid ? 200 : 402 });
}
