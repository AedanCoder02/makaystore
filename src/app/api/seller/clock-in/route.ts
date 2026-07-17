import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await sql`
    CREATE TABLE IF NOT EXISTS activities (
      id          SERIAL PRIMARY KEY,
      seller_id   TEXT NOT NULL,
      type        TEXT NOT NULL,
      note        TEXT,
      status      TEXT DEFAULT 'pending',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  const existing = await sql`
    SELECT id FROM activities
    WHERE seller_id = ${userId}
      AND type = 'clock-in'
      AND created_at::date = CURRENT_DATE
      AND status = 'pending'
    LIMIT 1
  `;

  if (existing.length > 0) {
    return NextResponse.json({ error: 'Already clocked in today' }, { status: 409 });
  }

  const row = await sql`
    INSERT INTO activities (seller_id, type, note)
    VALUES (${userId}, 'clock-in', NULL)
    RETURNING *
  `;

  return NextResponse.json(row[0]);
}
