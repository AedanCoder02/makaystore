import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireAccess } from '@/lib/apiAuth';
import { ensureReviewsSchema, REVIEW_STATUSES } from '@/lib/reviews';

// PATCH — approve / hide / back to pending
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAccess('supervisor', { orPermission: 'reviews' });
  if (gate instanceof NextResponse) return gate;
  await ensureReviewsSchema();
  const { id } = await params;
  const { status } = await req.json().catch(() => ({}));
  if (!(REVIEW_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: 'invalid status' }, { status: 400 });
  }
  const rows = await sql`
    UPDATE club_reviews SET status = ${status}, reviewed_by = ${gate.userId}, reviewed_at = NOW()
    WHERE id = ${Number(id)} RETURNING id, status
  `;
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAccess('admin');
  if (gate instanceof NextResponse) return gate;
  const { id } = await params;
  await sql`DELETE FROM club_reviews WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
