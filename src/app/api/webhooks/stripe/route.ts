import { NextRequest, NextResponse } from 'next/server';
import { ensurePaymentSchema } from '@/lib/payments';
import { getStripe, settleStripeIntent } from '@/lib/stripe';

// Stripe webhook (event: payment_intent.succeeded). Settles orders even if the customer closed the tab.
export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: 'Not configured' }, { status: 503 });

  const signature = req.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(await req.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    await ensurePaymentSchema();
    await settleStripeIntent(event.data.object);
  }
  return NextResponse.json({ received: true });
}
