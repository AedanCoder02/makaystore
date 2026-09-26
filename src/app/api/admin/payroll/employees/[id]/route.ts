import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

async function assertAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  return (user?.publicMetadata?.role as string) === 'admin';
}

const EDITABLE_FIELDS = [
  'full_name', 'department', 'position', 'email', 'phone', 'start_date',
  'weekly_wage', 'commission_pct', 'commission_fixed', 'linked_seller_id', 'status', 'notes',
] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await assertAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;

  const body = await req.json() as Record<string, unknown>;
  const updates: Record<string, unknown> = {};
  for (const key of EDITABLE_FIELDS) {
    if (key in body) updates[key] = body[key];
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
  }

  const setClauses = Object.keys(updates).map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = Object.values(updates) as (string | number | boolean | null)[];

  const rows = await sql.unsafe(
    `UPDATE payroll_employees SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [Number(id), ...values] as any[]
  );
  if (rows.length === 0) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await assertAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  await sql`DELETE FROM payroll_employees WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
