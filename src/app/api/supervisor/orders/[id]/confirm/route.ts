import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Ensure columns exist (idempotent)
  await sql`ALTER TABLE seller_orders ADD COLUMN IF NOT EXISTS payment_confirmed BOOLEAN DEFAULT FALSE`.catch(() => {});
  await sql`ALTER TABLE seller_orders ADD COLUMN IF NOT EXISTS confirmed_by TEXT`.catch(() => {});
  await sql`ALTER TABLE seller_orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ`.catch(() => {});

  const row = await sql`
    UPDATE seller_orders
    SET payment_confirmed = TRUE,
        confirmed_by      = ${userId},
        confirmed_at      = NOW()
    WHERE id = ${Number(id)}
    RETURNING id, payment_confirmed, confirmed_at
  `;

  if (!row.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row[0]);
}
