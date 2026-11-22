import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireAccess } from '@/lib/apiAuth';
import { ensureEventsSchema, normalizeGallery, normalizeImageUrl, UPCOMING_GRACE } from '@/lib/events';

// GET — public: active events that haven't passed yet, soonest first.
//       ?scope=all (staff only): every event, any status, newest first.
export async function GET(req: NextRequest) {
  await ensureEventsSchema();

  if (req.nextUrl.searchParams.get('scope') === 'all') {
    const gate = await requireAccess('staff');
    if (gate instanceof NextResponse) return gate;
    const rows = await sql`
      SELECT e.*,
        COALESCE((SELECT SUM(quantity) FROM event_tickets WHERE event_id = e.id), 0)::int AS tickets_sold
      FROM events e
      ORDER BY e.event_date DESC NULLS FIRST
    `;
    return NextResponse.json(rows);
  }

  const rows = await sql`
    SELECT e.*,
      COALESCE((SELECT SUM(quantity) FROM event_tickets WHERE event_id = e.id), 0)::int AS tickets_sold
    FROM events e
    WHERE e.status = 'active'
      AND (e.event_date IS NULL OR e.event_date >= NOW() - ${UPCOMING_GRACE}::interval)
    ORDER BY e.event_date ASC NULLS LAST
  `;
  return NextResponse.json(rows);
}

// POST — create event (admin, or staff with the "events" permission)
export async function POST(req: NextRequest) {
  const gate = await requireAccess('admin', { orPermission: 'events' });
  if (gate instanceof NextResponse) return gate;

  await ensureEventsSchema();

  const { title, description, content, event_date, location, image_url, gallery, tags, price, capacity, status } = await req.json();
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  const row = await sql`
    INSERT INTO events (title, description, content, event_date, location, image_url, gallery, tags, price, capacity, status)
    VALUES (
      ${title}, ${description ?? ''}, ${content ?? ''}, ${event_date || null}, ${location ?? ''},
      ${normalizeImageUrl(String(image_url ?? ''))}, ${JSON.stringify(normalizeGallery(gallery))}::jsonb,
      ${tags ?? ''}, ${Number(price ?? 0)}, ${Number(capacity ?? 100)}, ${status ?? 'active'}
    )
    RETURNING *
  `;
  return NextResponse.json(row[0], { status: 201 });
}
