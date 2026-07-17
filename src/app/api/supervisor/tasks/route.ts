import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id          SERIAL PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT,
      assigned_to TEXT,
      status      TEXT DEFAULT 'pending',
      priority    TEXT DEFAULT 'medium',
      created_by  TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensureTable();

  const rows = await sql`
    SELECT id, title, description, assigned_to, status, priority, created_by, created_at
    FROM tasks
    ORDER BY created_at DESC
    LIMIT 50
  `;

  const mapped = rows.map((r) => ({
    id: String(r.id),
    name: r.title,
    assignedTo: r.assigned_to ?? '',
    dueTime: new Date(r.created_at as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    priority: r.priority === 'high' ? 'High' : r.priority === 'low' ? 'Low' : 'Medium',
    status: r.status === 'in-progress' ? 'in-progress' : r.status === 'done' ? 'done' : 'todo',
  }));

  return NextResponse.json(mapped);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensureTable();

  const { title, description, assigned_to, priority } = await req.json();
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  const row = await sql`
    INSERT INTO tasks (title, description, assigned_to, priority, created_by)
    VALUES (${title}, ${description ?? ''}, ${assigned_to ?? ''}, ${priority ?? 'medium'}, ${userId})
    RETURNING *
  `;

  return NextResponse.json(row[0], { status: 201 });
}
