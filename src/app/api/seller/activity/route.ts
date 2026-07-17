import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
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

  const rows = await sql`
    SELECT id, type, note, status, created_at
    FROM activities
    WHERE seller_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 50
  `;

  const todayRows = rows.filter(
    (r) => new Date(r.created_at as string).toDateString() === new Date().toDateString()
  );

  const lastClockIn = todayRows.find((r) => r.type === 'clock-in');
  const lastClockOut = todayRows.find((r) => r.type === 'clock-out');
  const clockedIn =
    !!lastClockIn &&
    (!lastClockOut ||
      new Date(lastClockOut.created_at as string) < new Date(lastClockIn.created_at as string));

  let hoursWorked = 0;
  const clockIns = todayRows.filter((r) => r.type === 'clock-in');
  const clockOuts = todayRows.filter((r) => r.type === 'clock-out');
  clockIns.forEach((ci) => {
    const co = clockOuts.find(
      (co) => new Date(co.created_at as string) > new Date(ci.created_at as string)
    );
    const endTime = co ? new Date(co.created_at as string) : new Date();
    hoursWorked += (endTime.getTime() - new Date(ci.created_at as string).getTime()) / 3600000;
  });

  return NextResponse.json({
    clockedIn,
    clockInTime: lastClockIn?.created_at ?? null,
    hoursWorked: Math.round(hoursWorked * 10) / 10,
    todaySessions: clockIns.length,
    log: rows,
  });
}
