import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { status, title, assigned_to, priority } = await req.json();

  const row = await sql`
    UPDATE tasks
    SET
      status      = COALESCE(${status ?? null}, status),
      title       = COALESCE(${title ?? null}, title),
      assigned_to = COALESCE(${assigned_to ?? null}, assigned_to),
      priority    = COALESCE(${priority ?? null}, priority)
    WHERE id = ${Number(id)}
    RETURNING *
  `;

  if (!row.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await sql`DELETE FROM tasks WHERE id = ${Number(id)}`;
  return NextResponse.json({ deleted: true });
}
