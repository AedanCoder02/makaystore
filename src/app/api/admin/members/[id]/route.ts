import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await currentUser();
  if ((user?.publicMetadata?.role as string) !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const profileId = parseInt(id, 10);
  if (isNaN(profileId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await req.json() as { membership_tier?: string; discount_override?: number | null };

  if (body.membership_tier !== undefined && body.discount_override !== undefined) {
    await sql`
      UPDATE user_profiles
      SET membership_tier = ${body.membership_tier}, discount_override = ${body.discount_override}, updated_at = NOW()
      WHERE id = ${profileId}
    `;
  } else if (body.membership_tier !== undefined) {
    await sql`UPDATE user_profiles SET membership_tier = ${body.membership_tier}, updated_at = NOW() WHERE id = ${profileId}`;
  } else if (body.discount_override !== undefined) {
    await sql`UPDATE user_profiles SET discount_override = ${body.discount_override}, updated_at = NOW() WHERE id = ${profileId}`;
  }

  const rows = await sql`SELECT id, clerk_id, membership_tier, discount_override, wallet_points FROM user_profiles WHERE id = ${profileId}`;
  return NextResponse.json(rows[0] ?? {});
}
