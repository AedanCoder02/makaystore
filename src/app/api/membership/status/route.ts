import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await sql`
    SELECT membership_tier, membership_expires_at, membership_started_at, membership_duration
    FROM user_profiles
    WHERE clerk_id = ${userId}
    LIMIT 1
  `;

  const profile = rows[0];
  if (!profile) {
    return NextResponse.json({ tier: 'free', duration: null, expires_at: null, days_remaining: null, expiry_warning: false });
  }

  const tier = profile.membership_tier ?? 'free';
  const expiresAt = profile.membership_expires_at as Date | null;
  const duration = profile.membership_duration as string | null;

  let daysRemaining: number | null = null;
  let expiryWarning = false;

  if (expiresAt) {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    expiryWarning = daysRemaining <= 14;
  }

  return NextResponse.json({
    tier,
    duration,
    expires_at: expiresAt ? expiresAt.toISOString() : null,
    days_remaining: daysRemaining,
    expiry_warning: expiryWarning,
  });
}
