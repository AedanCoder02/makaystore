import sql from '@/lib/db';
import { sendMembershipWelcomeEmail, sendMembershipContractEmail } from '@/lib/email';
import { ensurePaymentSchema, type PaymentStatus } from '@/lib/payments';
import { ensureEventsSchema, parseEventProductId } from '@/lib/events';

const TIER_THRESHOLDS = [
  { tier: 'vip',    min: 1500 },
  { tier: 'gold',   min: 700  },
  { tier: 'silver', min: 300  },
  { tier: 'bronze', min: 100  },
  { tier: 'free',   min: 0    },
];

async function updateMembershipTier(userId: string) {
  try {
    // Only settled orders count. Legacy rows (payment_status NULL) predate payment tracking and keep counting.
    const result = await sql`
      SELECT COALESCE(SUM(total), 0)::numeric AS lifetime_spend
      FROM orders
      WHERE customer_id = ${userId}
        AND (payment_status IS NULL OR payment_status IN ('paid', 'verified'))
    `;
    const spend = parseFloat(result[0]?.lifetime_spend ?? '0');
    const tier = TIER_THRESHOLDS.find(t => spend >= t.min)?.tier ?? 'free';

    await sql`
      INSERT INTO user_profiles (clerk_id, membership_tier)
      VALUES (${userId}, ${tier})
      ON CONFLICT (clerk_id) DO UPDATE SET membership_tier = ${tier}, updated_at = NOW()
    `;
  } catch {
    // non-fatal — profile update failure shouldn't block order fulfillment
  }
}

/**
 * Runs the post-payment side effects that used to run at order creation:
 * membership tier, wallet points, membership product upgrade and emails.
 * Idempotent: `fulfilled_at` is claimed atomically, so webhooks + redirects can both call it.
 */
export async function fulfillOrder(orderId: string): Promise<void> {
  const claimed = await sql`
    UPDATE orders SET fulfilled_at = NOW(), updated_at = NOW()
    WHERE id = ${orderId} AND fulfilled_at IS NULL
    RETURNING *
  `;
  const order = claimed[0];
  if (!order) return;

  const userId = order.customer_id as string | null;
  const id = order.id as string;
  const total = Number(order.total);
  const items = (typeof order.items === 'string' ? JSON.parse(order.items) : order.items) ?? [];
  const shippingAddress = (typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address) ?? {};
  const customerEmail = order.customer_email as string | null;

  // Issue event tickets bought through checkout (guests included).
  const ticketItems = (items as Array<{ productId?: string; quantity?: number; price?: number }>)
    .map(i => ({ eventId: parseEventProductId(String(i.productId ?? '')), qty: Number(i.quantity ?? 1), price: Number(i.price ?? 0) }))
    .filter((t): t is { eventId: number; qty: number; price: number } => t.eventId !== null);
  if (ticketItems.length) {
    await ensureEventsSchema();
    const name = String((shippingAddress as { name?: string })?.name ?? customerEmail ?? '');
    for (const t of ticketItems) {
      await sql`
        INSERT INTO event_tickets (event_id, customer_id, customer_name, customer_email, quantity, total_paid, order_id)
        VALUES (${t.eventId}, ${userId}, ${name}, ${customerEmail}, ${t.qty}, ${t.price * t.qty}, ${id})
      `.catch(e => console.error('[fulfillOrder] ticket insert failed', id, e));
    }
  }

  if (!userId) return;
  const locale = (order.locale as string | null) ?? 'es';

  await updateMembershipTier(userId);

  // Credit wallet points based on admin-configured rate
  try {
    const cfgRows = await sql`SELECT pts_per_dollar FROM wallet_config WHERE id = 1`;
    const pts_per_dollar = Number(cfgRows[0]?.pts_per_dollar ?? 10);
    const pointsEarned = Math.floor(total * pts_per_dollar);
    if (pointsEarned > 0) {
      const profRows = await sql`SELECT id FROM user_profiles WHERE clerk_id = ${userId}`;
      if (profRows.length) {
        const pid = profRows[0].id as number;
        await sql`INSERT INTO wallet_transactions (user_id, type, points, order_id, description) VALUES (${pid}, 'earn', ${pointsEarned}, ${id}, 'Points earned from purchase')`;
        await sql`UPDATE user_profiles SET wallet_points = wallet_points + ${pointsEarned}, updated_at = NOW() WHERE id = ${pid}`;
      }
    }
  } catch {
    // non-fatal
  }

  // Check if any item is a membership product and upgrade directly
  const tierPriority: Record<string, number> = { free: 0, bronze: 1, silver: 2, gold: 3, vip: 4 };
  let highestTier = '';
  let membershipDuration = 'anual';
  for (const item of items as Array<{ productId?: string; duration?: string }>) {
    const pid = String(item.productId ?? '');
    if (pid.startsWith('membership-')) {
      const fromId = pid.replace('membership-', '');
      if (tierPriority[fromId] !== undefined && (tierPriority[fromId] ?? 0) > (tierPriority[highestTier] ?? -1)) {
        highestTier = fromId;
        if (item.duration) membershipDuration = item.duration;
      }
    }
  }
  if (!highestTier) return;

  const durationMonths: Record<string, number> = { trimestral: 3, semestral: 6, anual: 12 };
  const months = durationMonths[membershipDuration] ?? 12;
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + months);

  await sql`
    INSERT INTO user_profiles (clerk_id, membership_tier, membership_started_at, membership_expires_at, membership_duration)
    VALUES (${userId}, ${highestTier}, NOW(), ${expiresAt.toISOString()}, ${membershipDuration})
    ON CONFLICT (clerk_id) DO UPDATE SET
      membership_tier = ${highestTier},
      membership_started_at = NOW(),
      membership_expires_at = ${expiresAt.toISOString()},
      membership_duration = ${membershipDuration},
      updated_at = NOW()
  `.catch(() => {});

  if (customerEmail) {
    const emailData = {
      to: customerEmail,
      name: (shippingAddress as { name?: string })?.name ?? customerEmail,
      tier: highestTier,
      duration: membershipDuration,
      amount: total,
      orderId: id,
      expiresAt: expiresAt.toISOString(),
      locale,
    };
    await Promise.all([
      sendMembershipWelcomeEmail(emailData).catch(() => {}),
      sendMembershipContractEmail(emailData).catch(() => {}),
    ]);
  }
}

/**
 * Marks a gateway order as paid (only from `awaiting_payment`) and fulfills it.
 * Returns true when the order is now settled.
 */
export async function markOrderPaid(orderId: string, providerRef: string): Promise<boolean> {
  await ensurePaymentSchema();
  const rows = await sql`
    UPDATE orders
    SET payment_status = 'paid', status = 'confirmed', payment_id = ${providerRef}, updated_at = NOW()
    WHERE id = ${orderId} AND payment_status = 'awaiting_payment'
    RETURNING id
  `;
  const current = rows[0]
    ? 'paid'
    : ((await sql`SELECT payment_status FROM orders WHERE id = ${orderId}`)[0]?.payment_status as PaymentStatus | undefined);
  if (current === 'paid') {
    await fulfillOrder(orderId);
    return true;
  }
  return false;
}
