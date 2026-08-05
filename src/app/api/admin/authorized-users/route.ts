import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  if (user?.publicMetadata?.role !== 'admin') return null;
  return userId;
}

// GET /api/admin/authorized-users?member_clerk_id=xxx
export async function GET(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const memberId = new URL(req.url).searchParams.get('member_clerk_id');
  if (!memberId) return NextResponse.json({ error: 'member_clerk_id required' }, { status: 400 });
  const rows = await sql`SELECT * FROM membership_authorized_users WHERE member_clerk_id = ${memberId} ORDER BY created_at ASC`;
  return NextResponse.json(rows);
}

// POST /api/admin/authorized-users
export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { member_clerk_id, name, email, phone, notes } = await req.json();
  if (!member_clerk_id || !name) return NextResponse.json({ error: 'member_clerk_id and name required' }, { status: 400 });

  const count = await sql`SELECT COUNT(*) FROM membership_authorized_users WHERE member_clerk_id = ${member_clerk_id}`;
  if (Number(count[0].count) >= 3) return NextResponse.json({ error: 'Max 3 authorized users per membership' }, { status: 422 });

  const row = await sql`
    INSERT INTO membership_authorized_users (member_clerk_id, name, email, phone, notes)
    VALUES (${member_clerk_id}, ${name}, ${email ?? null}, ${phone ?? null}, ${notes ?? null})
    RETURNING *
  `;
  return NextResponse.json(row[0], { status: 201 });
}

// DELETE /api/admin/authorized-users?id=xxx
export async function DELETE(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await sql`DELETE FROM membership_authorized_users WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
