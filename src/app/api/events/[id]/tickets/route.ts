import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

// GET — attendees list (admin only, not enforced here — keep simple)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await sql`
    SELECT * FROM event_tickets WHERE event_id = ${Number(id)} ORDER BY purchased_at DESC
  `;
  return NextResponse.json(rows);
}

// POST — purchase ticket
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  const { id } = await params;

  const { customer_name, customer_email, quantity = 1 } = await req.json();
  if (!customer_name || !customer_email) {
    return NextResponse.json({ error: 'customer_name and customer_email required' }, { status: 400 });
  }

  // Check capacity
  const event = await sql`SELECT * FROM events WHERE id = ${Number(id)}`;
  if (!event[0]) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const sold = await sql`SELECT COALESCE(SUM(quantity),0)::int AS total FROM event_tickets WHERE event_id = ${Number(id)}`;
  const remaining = event[0].capacity - sold[0].total;
  if (quantity > remaining) return NextResponse.json({ error: `Only ${remaining} tickets remaining` }, { status: 409 });

  const total_paid = Number(event[0].price) * quantity;

  const row = await sql`
    INSERT INTO event_tickets (event_id, customer_id, customer_name, customer_email, quantity, total_paid)
    VALUES (${Number(id)}, ${userId ?? null}, ${customer_name}, ${customer_email}, ${quantity}, ${total_paid})
    RETURNING *
  `;
  return NextResponse.json(row[0], { status: 201 });
}
