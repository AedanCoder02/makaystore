import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const lastClockIn = await sql`
    SELECT id FROM activities
    WHERE seller_id = ${userId}
      AND type = 'clock-in'
      AND created_at::date = CURRENT_DATE
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (lastClockIn.length === 0) {
    return NextResponse.json({ error: 'Not clocked in' }, { status: 409 });
  }

  const row = await sql`
    INSERT INTO activities (seller_id, type, note)
    VALUES (${userId}, 'clock-out', NULL)
    RETURNING *
  `;

  return NextResponse.json(row[0]);
}
