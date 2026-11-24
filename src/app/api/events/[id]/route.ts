import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireAccess } from '@/lib/apiAuth';
import { ensureEventsSchema, EVENT_CLUB, normalizeGallery, normalizeImageUrl } from '@/lib/events';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureEventsSchema();
  const { id } = await params;
  const rows = await sql`
    SELECT e.*,
      COALESCE((SELECT SUM(quantity) FROM event_tickets WHERE event_id = e.id), 0)::int AS tickets_sold
    FROM events e WHERE e.id = ${Number(id)} AND e.status <> 'draft'
      AND (e.club = ${EVENT_CLUB} OR e.club IS NULL)
  `;
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAccess('admin', { orPermission: 'events' });
  if (gate instanceof NextResponse) return gate;
  await ensureEventsSchema();

  const { id } = await params;
  const b = await req.json();
  const str = (v: unknown) => (v === undefined || v === null ? null : String(v));

  const row = await sql`
    UPDATE events SET
      title       = COALESCE(${str(b.title)}, title),
      description = COALESCE(${str(b.description)}, description),
      content     = COALESCE(${str(b.content)}, content),
      event_date  = ${b.event_date === undefined ? sql`event_date` : sql`${b.event_date || null}`},
      location    = COALESCE(${str(b.location)}, location),
      image_url   = COALESCE(${b.image_url === undefined ? null : normalizeImageUrl(String(b.image_url))}, image_url),
      gallery     = COALESCE(${b.gallery === undefined ? null : JSON.stringify(normalizeGallery(b.gallery))}::jsonb, gallery),
      tags        = COALESCE(${str(b.tags)}, tags),
      price       = COALESCE(${b.price !== undefined ? Number(b.price) : null}, price),
      capacity    = COALESCE(${b.capacity !== undefined ? Number(b.capacity) : null}, capacity),
      status      = COALESCE(${str(b.status)}, status),
      updated_at  = NOW()
    WHERE id = ${Number(id)} AND (club = ${EVENT_CLUB} OR club IS NULL)
    RETURNING *
  `;
  if (!row[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(row[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAccess('admin', { orPermission: 'events' });
  if (gate instanceof NextResponse) return gate;

  await ensureEventsSchema();
  const { id } = await params;
  await sql`DELETE FROM events WHERE id = ${Number(id)} AND (club = ${EVENT_CLUB} OR club IS NULL)`;
  return NextResponse.json({ ok: true });
}
