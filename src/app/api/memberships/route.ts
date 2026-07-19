import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

// Membership tier definitions (single source of truth)
export const MEMBERSHIP_TIERS = [
  { key: 'bronze', label: 'Bronze Club',  price: 49,  description: 'Entry-level beach club membership. Early drop access, 5% credit back.', color: '#CD7F32' },
  { key: 'silver', label: 'Silver Club',  price: 99,  description: 'Priority event tickets, 10% credit back, Bronze perks included.',         color: '#A8A9AD' },
  { key: 'gold',   label: 'Gold Club',    price: 199, description: 'VIP event access, 15% credit back, personal stylist, Silver perks.',      color: '#D4AF37' },
  { key: 'vip',    label: 'VIP Club',     price: 399, description: 'All perks, exclusive collections, 20% credit back, complimentary alterations.', color: '#D4A574' },
];

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS membership_sales (
      id           SERIAL PRIMARY KEY,
      seller_id    TEXT,
      customer_id  TEXT,
      customer_email TEXT,
      customer_name  TEXT,
      tier         TEXT NOT NULL,
      price        NUMERIC(10,2),
      payment_method TEXT DEFAULT 'cash',
      notes        TEXT,
      sold_at      TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

// GET — membership products list (for sell flow)
export async function GET() {
  return NextResponse.json(MEMBERSHIP_TIERS);
}

// POST — sell a membership (seller → customer)
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureTable();

  const { tier, customer_id, customer_email, customer_name, payment_method, notes, price } = await req.json();

  const tierDef = MEMBERSHIP_TIERS.find(t => t.key === tier);
  if (!tierDef) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
  if (!customer_email && !customer_id) return NextResponse.json({ error: 'customer_email or customer_id required' }, { status: 400 });

  const finalPrice = price ?? tierDef.price;

  // Record the sale
  const sale = await sql`
    INSERT INTO membership_sales (seller_id, customer_id, customer_email, customer_name, tier, price, payment_method, notes)
    VALUES (${userId}, ${customer_id ?? null}, ${customer_email ?? null}, ${customer_name ?? null}, ${tier}, ${finalPrice}, ${payment_method ?? 'cash'}, ${notes ?? ''})
    RETURNING *
  `;

  // Upgrade the customer's tier if they have a profile
  if (customer_id) {
    await sql`
      INSERT INTO user_profiles (clerk_id, membership_tier)
      VALUES (${customer_id}, ${tier})
      ON CONFLICT (clerk_id) DO UPDATE SET membership_tier = ${tier}, updated_at = NOW()
    `.catch(() => {});
  }

  return NextResponse.json(sale[0], { status: 201 });
}
