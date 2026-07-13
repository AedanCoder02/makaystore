import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

async function getOrCreateProfile(clerkId: string) {
  const rows = await sql`SELECT * FROM user_profiles WHERE clerk_id = ${clerkId}`;
  if (rows.length > 0) return rows[0];
  const created = await sql`
    INSERT INTO user_profiles (clerk_id) VALUES (${clerkId}) RETURNING *
  `;
  return created[0];
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const profile = await getOrCreateProfile(userId);
  return NextResponse.json(profile);
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { bio, avatar_url } = body;

  await getOrCreateProfile(userId);

  if (bio !== undefined && avatar_url !== undefined) {
    await sql`UPDATE user_profiles SET bio = ${bio}, avatar_url = ${avatar_url}, updated_at = NOW() WHERE clerk_id = ${userId}`;
  } else if (bio !== undefined) {
    await sql`UPDATE user_profiles SET bio = ${bio}, updated_at = NOW() WHERE clerk_id = ${userId}`;
  } else if (avatar_url !== undefined) {
    await sql`UPDATE user_profiles SET avatar_url = ${avatar_url}, updated_at = NOW() WHERE clerk_id = ${userId}`;
  } else {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
  }

  const updated = await sql`SELECT * FROM user_profiles WHERE clerk_id = ${userId}`;
  return NextResponse.json(updated[0]);
}
