import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  return (user?.publicMetadata?.role as string) === 'admin';
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const profileId = req.nextUrl.searchParams.get('profile_id');
  if (!profileId) return NextResponse.json({ error: 'profile_id required' }, { status: 400 });

  const rows = await sql`
    SELECT id, principal, interest_rate, issued_at, due_date, status, notes, created_at
    FROM credit_lines
    WHERE user_id = ${parseInt(profileId)}
    ORDER BY created_at DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { profile_id, principal, interest_rate, due_date, notes } = await req.json() as {
    profile_id: number;
    principal: number;
    interest_rate?: number;
    due_date: string;
    notes?: string;
  };

  if (!profile_id || !principal || principal <= 0 || !due_date) {
    return NextResponse.json({ error: 'profile_id, principal, and due_date are required' }, { status: 400 });
  }

  const rate = interest_rate ?? 0.05;

  await sql`
    INSERT INTO credit_lines (user_id, principal, interest_rate, due_date, notes)
    VALUES (${profile_id}, ${principal}, ${rate}, ${due_date}, ${notes ?? null})
  `;

  await sql`
    UPDATE user_profiles
    SET dollar_balance = COALESCE(dollar_balance, 0) + ${principal}, updated_at = NOW()
    WHERE id = ${profile_id}
  `;

  const rows = await sql`SELECT dollar_balance FROM user_profiles WHERE id = ${profile_id}`;
  return NextResponse.json({ dollar_balance: Number(rows[0]?.dollar_balance ?? 0) });
}
