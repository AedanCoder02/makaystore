import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await currentUser();
  if ((user?.publicMetadata?.role as string) !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Return all users who have a profile, with their tier + override
  const rows = await sql`
    SELECT
      up.id,
      up.clerk_id,
      up.membership_tier,
      up.discount_override,
      up.wallet_points,
      up.created_at
    FROM user_profiles up
    ORDER BY up.created_at DESC
    LIMIT 200
  `;
  return NextResponse.json(rows);
}
