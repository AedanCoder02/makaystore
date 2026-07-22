import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await currentUser();
  if ((user?.publicMetadata?.role as string) !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { profile_id, points, description } = await req.json() as {
    profile_id: number;
    points: number;
    description?: string;
  };

  if (!profile_id || !points || points <= 0) return NextResponse.json({ error: 'Invalid params' }, { status: 400 });

  await sql`
    INSERT INTO wallet_transactions (user_id, type, points, description)
    VALUES (${profile_id}, 'admin_credit', ${points}, ${description ?? 'Admin credit'})
  `;
  await sql`
    UPDATE user_profiles SET wallet_points = wallet_points + ${points}, updated_at = NOW()
    WHERE id = ${profile_id}
  `;

  const rows = await sql`SELECT wallet_points FROM user_profiles WHERE id = ${profile_id}`;
  return NextResponse.json({ wallet_points: rows[0]?.wallet_points ?? 0 });
}
