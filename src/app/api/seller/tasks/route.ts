import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await sql`
    SELECT id, title, description, priority, status, created_at
    FROM tasks
    WHERE assigned_to = ${userId}
    ORDER BY
      CASE status WHEN 'pending' THEN 0 WHEN 'in-progress' THEN 1 ELSE 2 END,
      created_at DESC
    LIMIT 20
  `.catch(() => []);

  return NextResponse.json(rows);
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, status } = await req.json();
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });

  await sql`
    UPDATE tasks SET status = ${status}
    WHERE id = ${Number(id)} AND assigned_to = ${userId}
  `;

  return NextResponse.json({ ok: true });
}
