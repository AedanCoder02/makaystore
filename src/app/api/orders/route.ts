import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { sendMembershipWelcomeEmail, sendMembershipContractEmail } from '@/lib/email';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id            TEXT PRIMARY KEY,
      customer_id   TEXT,
      customer_email TEXT,
      items         JSONB NOT NULL DEFAULT '[]',
      subtotal      NUMERIC(10,2) DEFAULT 0,
      shipping_cost NUMERIC(10,2) DEFAULT 0,
      total         NUMERIC(10,2) DEFAULT 0,
      shipping_address JSONB,
      shipping_method  TEXT DEFAULT 'standard',
      payment_id    TEXT,
      status        TEXT DEFAULT 'pending',
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

// GET — customer's own orders
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureTable();

  const rows = await sql`
    SELECT * FROM orders
    WHERE customer_id = ${userId}
    ORDER BY created_at DESC
  `;
  return NextResponse.json(rows);
}

const TIER_THRESHOLDS = [
  { tier: 'vip',    min: 1500 },
  { tier: 'gold',   min: 700  },
  { tier: 'silver', min: 300  },
  { tier: 'bronze', min: 100  },
  { tier: 'free',   min: 0    },
];

async function updateMembershipTier(userId: string) {
  try {
    const result = await sql`
      SELECT COALESCE(SUM(total), 0)::numeric AS lifetime_spend
      FROM orders WHERE customer_id = ${userId}
    `;
    const spend = parseFloat(result[0]?.lifetime_spend ?? '0');
    const tier = TIER_THRESHOLDS.find(t => spend >= t.min)?.tier ?? 'free';

    await sql`
      INSERT INTO user_profiles (clerk_id, membership_tier)
      VALUES (${userId}, ${tier})
      ON CONFLICT (clerk_id) DO UPDATE SET membership_tier = ${tier}, updated_at = NOW()
    `;
  } catch {
    // non-fatal — profile update failure shouldn't block order creation
  }
}

// POST — create order from storefront checkout
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  await ensureTable();

  const locale = req.cookies.get('NEXT_LOCALE')?.value ?? 'es';
  const body = await req.json();
  const { items, subtotal, shipping_cost, total, shipping_address, shipping_method, payment_id, customer_email, payment_methods } = body;

  if (!items || total === undefined) {
    return NextResponse.json({ error: 'items and total required' }, { status: 400 });
  }

  const id = `ORD-${Date.now()}`;
  const row = await sql`
    INSERT INTO orders
      (id, customer_id, customer_email, items, subtotal, shipping_cost, total,
       shipping_address, shipping_method, payment_id, payment_methods, status)
    VALUES
      (${id}, ${userId ?? null}, ${customer_email ?? null},
       ${JSON.stringify(items)}, ${subtotal ?? 0}, ${shipping_cost ?? 0}, ${total},
       ${JSON.stringify(shipping_address ?? {})}, ${shipping_method ?? 'standard'},
       ${payment_id ?? null}, ${JSON.stringify(payment_methods ?? [])}, 'pending')
    RETURNING *
  `;

  if (userId) {
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
    for (const item of (items as Array<{ productId?: string; category?: string; duration?: string }>) ) {
      const pid = String(item.productId ?? '');
      if (pid.startsWith('membership-')) {
        const fromId = pid.replace('membership-', '');
        if (tierPriority[fromId] !== undefined && (tierPriority[fromId] ?? 0) > (tierPriority[highestTier] ?? -1)) {
          highestTier = fromId;
          if (item.duration) membershipDuration = item.duration;
        }
      }
    }
    if (highestTier) {
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

      // Send membership emails (non-fatal)
      if (customer_email) {
        const emailData = {
          to: customer_email,
          name: (shipping_address as { name?: string })?.name ?? customer_email,
          tier: highestTier,
          duration: membershipDuration,
          amount: total,
          orderId: id,
          expiresAt: expiresAt.toISOString(),
          locale,
        };
        Promise.all([
          sendMembershipWelcomeEmail(emailData).catch(() => {}),
          sendMembershipContractEmail(emailData).catch(() => {}),
        ]);
      }
    }
  }

  return NextResponse.json(row[0], { status: 201 });
}
