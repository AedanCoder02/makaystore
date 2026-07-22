import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

async function assertAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  return (user?.publicMetadata?.role as string) === 'admin';
}

export async function GET() {
  if (!(await assertAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const rows = await sql`SELECT * FROM allies ORDER BY display_order ASC, id ASC`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!(await assertAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json() as {
    name: string; logo_url?: string; description?: string;
    discount_percent: number; discount_code: string;
    min_tier: string; display_order?: number;
  };

  const rows = await sql`
    INSERT INTO allies (name, logo_url, description, discount_percent, discount_code, min_tier, display_order)
    VALUES (
      ${body.name}, ${body.logo_url ?? ''}, ${body.description ?? ''},
      ${body.discount_percent}, ${body.discount_code}, ${body.min_tier},
      ${body.display_order ?? 0}
    )
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
