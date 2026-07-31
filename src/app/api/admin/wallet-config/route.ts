import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  if ((user?.publicMetadata?.role as string) !== 'admin') return null;
  return userId;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const rows = await sql`SELECT pts_per_dollar, default_credit_interest FROM wallet_config WHERE id = 1`;
  return NextResponse.json(rows[0] ?? { pts_per_dollar: 10, default_credit_interest: 0.05 });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { pts_per_dollar, default_credit_interest } = await req.json() as {
    pts_per_dollar: number;
    default_credit_interest: number;
  };

  await sql`
    INSERT INTO wallet_config (id, pts_per_dollar, default_credit_interest, updated_at)
    VALUES (1, ${pts_per_dollar}, ${default_credit_interest}, NOW())
    ON CONFLICT (id) DO UPDATE SET
      pts_per_dollar = EXCLUDED.pts_per_dollar,
      default_credit_interest = EXCLUDED.default_credit_interest,
      updated_at = NOW()
  `;

  const rows = await sql`SELECT pts_per_dollar, default_credit_interest FROM wallet_config WHERE id = 1`;
  return NextResponse.json(rows[0]);
}
