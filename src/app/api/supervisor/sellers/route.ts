import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await sql`
    CREATE TABLE IF NOT EXISTS activities (
      id SERIAL PRIMARY KEY,
      seller_id TEXT NOT NULL,
      type TEXT NOT NULL,
      note TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  const client = await clerkClient();
  const result = await client.users.getUserList({ limit: 200 });
  const sellers = result.data.filter((u) => {
    const role = u.publicMetadata?.role as string;
    return role === 'seller' || role === 'worker';
  });

  const todayActivities = await sql`
    SELECT seller_id, type, created_at
    FROM activities
    WHERE created_at::date = CURRENT_DATE
    ORDER BY created_at ASC
  `;

  const sellerData = sellers.map((u) => {
    const events = todayActivities.filter((a) => a.seller_id === u.id);
    const lastClockIn = [...events].reverse().find((e) => e.type === 'clock-in');
    const lastClockOut = [...events].reverse().find((e) => e.type === 'clock-out');
    const clockedIn =
      !!lastClockIn &&
      (!lastClockOut ||
        new Date(lastClockOut.created_at as string) < new Date(lastClockIn.created_at as string));
    return {
      workerId: u.id,
      name: u.fullName ?? u.firstName ?? u.emailAddresses[0]?.emailAddress ?? 'Seller',
      email: u.emailAddresses[0]?.emailAddress ?? '',
      clockedIn,
      clockedInToday: clockedIn,
      startTime: lastClockIn?.created_at ?? null,
      taskCount: 0,
    };
  });

  return NextResponse.json(sellerData);
}
