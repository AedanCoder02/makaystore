import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id               SERIAL PRIMARY KEY,
      title            TEXT NOT NULL,
      description      TEXT,
      assigned_to      TEXT,
      assigned_to_name TEXT,
      status           TEXT DEFAULT 'pending',
      priority         TEXT DEFAULT 'medium',
      created_by       TEXT,
      created_at       TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  // Idempotent column add for existing tables
  await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to_name TEXT`.catch(() => {});
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await ensureTable();

  const rows = await sql`
    SELECT id, title, description, assigned_to, assigned_to_name, status, priority, created_by, created_at
    FROM tasks
    ORDER BY created_at DESC
    LIMIT 50
  `;

  // Resolve Clerk user IDs to display names when assigned_to_name is missing
  const clerkIds = rows
    .filter(r => !r.assigned_to_name && typeof r.assigned_to === 'string' && (r.assigned_to as string).startsWith('user_'))
    .map(r => r.assigned_to as string);

  const nameMap: Record<string, string> = {};
  if (clerkIds.length > 0) {
    const client = await clerkClient();
    await Promise.all(clerkIds.map(async (id) => {
      try {
        const u = await client.users.getUser(id);
        nameMap[id] = u.fullName ?? u.firstName ?? id;
      } catch { nameMap[id] = id; }
    }));
    // Persist resolved names back to DB for future calls
    await Promise.all(clerkIds.map(id =>
      sql`UPDATE tasks SET assigned_to_name = ${nameMap[id]} WHERE assigned_to = ${id} AND (assigned_to_name IS NULL OR assigned_to_name = '')`.catch(() => {})
    ));
  }

  const mapped = rows.map((r) => ({
    id: String(r.id),
    name: r.title,
    assignedTo: (r.assigned_to_name as string | null) || nameMap[r.assigned_to as string] || String(r.assigned_to ?? ''),
    assignedToId: r.assigned_to ?? '',
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

  const { title, description, assigned_to, assigned_to_name, priority } = await req.json();
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  const row = await sql`
    INSERT INTO tasks (title, description, assigned_to, assigned_to_name, priority, created_by)
    VALUES (${title}, ${description ?? ''}, ${assigned_to ?? ''}, ${assigned_to_name ?? null}, ${priority ?? 'medium'}, ${userId})
    RETURNING *
  `;

  return NextResponse.json(row[0], { status: 201 });
}
