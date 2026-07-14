import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await sql`SELECT * FROM product_stock ORDER BY updated_at DESC`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { product_id, quantity } = await req.json();
  if (!product_id || quantity === undefined) {
    return NextResponse.json({ error: 'product_id and quantity required' }, { status: 400 });
  }

  const row = await sql`
    INSERT INTO product_stock (product_id, quantity, updated_by)
    VALUES (${product_id}, ${quantity}, ${userId})
    ON CONFLICT (product_id) DO UPDATE
    SET quantity = EXCLUDED.quantity,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
    RETURNING *
  `;
  return NextResponse.json(row[0]);
}
