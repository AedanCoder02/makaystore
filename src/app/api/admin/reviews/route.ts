import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireAccess } from '@/lib/apiAuth';
import { ensureReviewsSchema, REVIEW_STATUSES } from '@/lib/reviews';

// GET — reviews for moderation (?status=pending|approved|hidden)
export async function GET(req: NextRequest) {
  const gate = await requireAccess('supervisor', { orPermission: 'reviews' });
  if (gate instanceof NextResponse) return gate;
  await ensureReviewsSchema();
  const status = req.nextUrl.searchParams.get('status') ?? 'pending';
  if (!(REVIEW_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: 'invalid status' }, { status: 400 });
  }
  const rows = await sql`
    SELECT id, author_name, rating, comment, locale, status, created_at, reviewed_at
    FROM club_reviews WHERE status = ${status}
    ORDER BY created_at DESC LIMIT 200
  `;
  const counts = await sql`SELECT status, COUNT(*)::int AS n FROM club_reviews GROUP BY status`;
  return NextResponse.json({ reviews: rows, counts: Object.fromEntries(counts.map(c => [c.status, c.n])) });
}
