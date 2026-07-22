import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profiles = await sql`SELECT id, wallet_points FROM user_profiles WHERE clerk_id = ${userId}`;
  if (!profiles.length) return NextResponse.json({ points: 0, transactions: [] });

  const profile = profiles[0];
  const transactions = await sql`
    SELECT id, type, points, order_id, description, created_at
    FROM wallet_transactions
    WHERE user_id = ${profile.id}
    ORDER BY created_at DESC
    LIMIT 50
  `;

  return NextResponse.json({ points: profile.wallet_points, transactions });
}
