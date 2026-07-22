import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

async function assertAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  return (user?.publicMetadata?.role as string) === 'admin';
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await assertAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const allyId = parseInt(id, 10);
  if (isNaN(allyId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await req.json() as Partial<{
    name: string; logo_url: string; description: string;
    discount_percent: number; discount_code: string;
    min_tier: string; active: boolean; display_order: number;
  }>;

  await sql`
    UPDATE allies SET
      name            = COALESCE(${body.name ?? null}, name),
      logo_url        = COALESCE(${body.logo_url ?? null}, logo_url),
      description     = COALESCE(${body.description ?? null}, description),
      discount_percent= COALESCE(${body.discount_percent ?? null}, discount_percent),
      discount_code   = COALESCE(${body.discount_code ?? null}, discount_code),
      min_tier        = COALESCE(${body.min_tier ?? null}, min_tier),
      active          = COALESCE(${body.active ?? null}, active),
      display_order   = COALESCE(${body.display_order ?? null}, display_order)
    WHERE id = ${allyId}
  `;
  const rows = await sql`SELECT * FROM allies WHERE id = ${allyId}`;
  return NextResponse.json(rows[0] ?? {});
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await assertAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const allyId = parseInt(id, 10);
  if (isNaN(allyId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  await sql`DELETE FROM allies WHERE id = ${allyId}`;
  return NextResponse.json({ ok: true });
}
