import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client_id = req.nextUrl.searchParams.get('client_id');
  if (!client_id) return NextResponse.json({ error: 'client_id required' }, { status: 400 });

  const rows = await sql`
    SELECT dollar_balance, wallet_points FROM user_profiles WHERE clerk_id = ${client_id}
  `;
  if (!rows.length) return NextResponse.json({ dollar_balance: 0, wallet_points: 0 });
  return NextResponse.json({
    dollar_balance: Number(rows[0].dollar_balance ?? 0),
    wallet_points: Number(rows[0].wallet_points ?? 0),
  });
}
