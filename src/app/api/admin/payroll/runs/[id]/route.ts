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
  const { status } = await req.json() as { status: string };
  if (status !== 'finalized') return NextResponse.json({ error: 'Solo se puede finalizar' }, { status: 400 });

  const rows = await sql`
    UPDATE payroll_runs SET status = 'finalized', finalized_at = NOW()
    WHERE id = ${Number(id)} RETURNING *
  `;
  if (rows.length === 0) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await assertAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;

  const [run] = await sql`SELECT status FROM payroll_runs WHERE id = ${Number(id)}`;
  if (run?.status === 'finalized') {
    return NextResponse.json({ error: 'No se puede eliminar una nómina finalizada' }, { status: 400 });
  }

  await sql`DELETE FROM payroll_runs WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
