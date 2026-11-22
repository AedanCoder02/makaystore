import Stripe from 'stripe';
import sql from '@/lib/db';
import { markOrderPaid } from '@/lib/orderFulfillment';

let client: Stripe | null = null;

/** Server-side Stripe client, or null when STRIPE_SECRET_KEY is not set. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!client) client = new Stripe(key);
  return client;
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Marks the linked order paid when the PaymentIntent really succeeded for that order's amount.
 * Used by both the post-payment confirm call and the Stripe webhook.
 */
export async function settleStripeIntent(pi: Stripe.PaymentIntent): Promise<boolean> {
  const orderId = pi.metadata?.order_id;
  if (!orderId || pi.status !== 'succeeded') return false;

  const rows = await sql`SELECT total, payment_provider_ref FROM orders WHERE id = ${orderId}`;
  const order = rows[0];
  if (!order) return false;
  if (order.payment_provider_ref && order.payment_provider_ref !== pi.id) return false;
  if (pi.currency !== 'usd' || pi.amount_received !== toCents(Number(order.total))) return false;

  return markOrderPaid(orderId, pi.id);
}
