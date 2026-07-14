import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await sql`
    SELECT * FROM seller_orders WHERE seller_id = ${userId} ORDER BY created_at DESC LIMIT 50
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { client_id, client_name, client_email, items, subtotal, payment_method, notes } = await req.json();

  if (!client_id || !items || !subtotal) {
    return NextResponse.json({ error: 'client_id, items, subtotal required' }, { status: 400 });
  }

  const row = await sql`
    INSERT INTO seller_orders (seller_id, client_id, client_name, client_email, items, subtotal, payment_method, notes)
    VALUES (${userId}, ${client_id}, ${client_name ?? ''}, ${client_email ?? ''}, ${JSON.stringify(items)}, ${subtotal}, ${payment_method ?? 'cash'}, ${notes ?? ''})
    RETURNING *
  `;
  return NextResponse.json(row[0]);
}
