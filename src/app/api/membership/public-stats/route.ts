import { NextResponse } from 'next/server';
import sql from '@/lib/db';

// Public — no auth needed. Returns aggregate counts for the membership page hero stats.
export async function GET() {
  const [members, allies, events] = await Promise.all([
    sql`SELECT COUNT(*) AS count FROM user_profiles WHERE membership_tier IS NOT NULL AND membership_tier != 'free'`.catch(() => [{ count: 0 }]),
    sql`SELECT COUNT(*) AS count FROM allies WHERE active = true`.catch(() => [{ count: 0 }]),
    sql`SELECT COUNT(*) AS count FROM events WHERE event_date >= NOW()`.catch(() => [{ count: 0 }]),
  ]);

  return NextResponse.json({
    members: Number(members[0]?.count ?? 0),
    allies:  Number(allies[0]?.count  ?? 0),
    events:  Number(events[0]?.count  ?? 0),
  });
}
