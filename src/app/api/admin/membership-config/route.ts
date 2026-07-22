import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

async function assertAdmin() {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  if ((user?.publicMetadata?.role as string) !== 'admin') return null;
  return userId;
}

export async function GET() {
  if (!(await assertAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const rows = await sql`SELECT * FROM membership_tier_config ORDER BY discount_percent ASC`;
  return NextResponse.json(rows);
}

export async function PATCH(req: NextRequest) {
  if (!(await assertAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json() as { tier: string; discount_percent: number }[];
  if (!Array.isArray(body)) return NextResponse.json({ error: 'Expected array' }, { status: 400 });

  for (const { tier, discount_percent } of body) {
    if (typeof tier !== 'string' || typeof discount_percent !== 'number') continue;
    await sql`
      UPDATE membership_tier_config
      SET discount_percent = ${discount_percent}
      WHERE tier = ${tier}
    `;
  }

  const rows = await sql`SELECT * FROM membership_tier_config ORDER BY discount_percent ASC`;
  return NextResponse.json(rows);
}
