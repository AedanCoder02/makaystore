import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await sql`
    SELECT e.*,
      COALESCE((SELECT SUM(quantity) FROM event_tickets WHERE event_id = e.id), 0)::int AS tickets_sold
    FROM events e WHERE e.id = ${Number(id)}
  `;
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { title, description, event_date, location, image_url, price, capacity, status } = body;

  const row = await sql`
    UPDATE events SET
      title       = COALESCE(${title ?? null}, title),
      description = COALESCE(${description ?? null}, description),
      event_date  = COALESCE(${event_date ?? null}, event_date),
      location    = COALESCE(${location ?? null}, location),
      image_url   = COALESCE(${image_url ?? null}, image_url),
      price       = COALESCE(${price !== undefined ? Number(price) : null}, price),
      capacity    = COALESCE(${capacity !== undefined ? Number(capacity) : null}, capacity),
      status      = COALESCE(${status ?? null}, status),
      updated_at  = NOW()
    WHERE id = ${Number(id)}
    RETURNING *
  `;
  if (!row[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await sql`DELETE FROM events WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
