import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id          SERIAL PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT,
      event_date  TIMESTAMPTZ,
      location    TEXT,
      image_url   TEXT,
      price       NUMERIC(10,2) DEFAULT 0,
      capacity    INTEGER DEFAULT 100,
      status      TEXT DEFAULT 'active',
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS event_tickets (
      id             SERIAL PRIMARY KEY,
      event_id       INTEGER REFERENCES events(id) ON DELETE CASCADE,
      customer_id    TEXT,
      customer_name  TEXT,
      customer_email TEXT,
      quantity       INTEGER DEFAULT 1,
      total_paid     NUMERIC(10,2) DEFAULT 0,
      purchased_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

// GET — public listing of active events
export async function GET() {
  await ensureTables();
  const rows = await sql`
    SELECT e.*,
      COALESCE((SELECT SUM(quantity) FROM event_tickets WHERE event_id = e.id), 0)::int AS tickets_sold
    FROM events e
    WHERE e.status = 'active'
    ORDER BY e.event_date ASC
  `;
  return NextResponse.json(rows);
}

// POST — admin creates event
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureTables();

  const { title, description, event_date, location, image_url, price, capacity } = await req.json();
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  const row = await sql`
    INSERT INTO events (title, description, event_date, location, image_url, price, capacity)
    VALUES (${title}, ${description ?? ''}, ${event_date ?? null}, ${location ?? ''}, ${image_url ?? ''}, ${Number(price ?? 0)}, ${Number(capacity ?? 100)})
    RETURNING *
  `;
  return NextResponse.json(row[0], { status: 201 });
}
