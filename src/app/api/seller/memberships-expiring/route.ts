import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await sql`
    SELECT
      clerk_id,
      membership_tier,
      membership_expires_at,
      membership_duration,
      EXTRACT(DAY FROM (membership_expires_at - NOW()))::int AS days_remaining
    FROM user_profiles
    WHERE
      membership_expires_at IS NOT NULL
      AND membership_tier NOT IN ('free', 'member')
      AND membership_expires_at > NOW()
      AND membership_expires_at <= NOW() + INTERVAL '14 days'
    ORDER BY membership_expires_at ASC
  `;

  return NextResponse.json(rows);
}
