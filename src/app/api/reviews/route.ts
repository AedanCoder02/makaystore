import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import sql from '@/lib/db';
import { ensureReviewsSchema } from '@/lib/reviews';

// GET — approved reviews + rating summary (public)
export async function GET() {
  await ensureReviewsSchema();
  const [reviews, summary] = await Promise.all([
    sql`
      SELECT id, author_name, rating, comment, created_at
      FROM club_reviews WHERE status = 'approved'
      ORDER BY created_at DESC LIMIT 24
    `,
    sql`
      SELECT COUNT(*)::int AS count, COALESCE(ROUND(AVG(rating)::numeric, 1), 0)::float AS average
      FROM club_reviews WHERE status = 'approved'
    `,
  ]);
  return NextResponse.json({ reviews, count: summary[0].count, average: summary[0].average });
}

// POST — signed-in guest leaves a review (moderated before it shows)
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Sign in to leave a review' }, { status: 401 });

  const { rating, comment } = await req.json().catch(() => ({}));
  const r = Math.round(Number(rating));
  const c = String(comment ?? '').trim();
  if (!(r >= 1 && r <= 5)) return NextResponse.json({ error: 'Rating must be 1 to 5' }, { status: 400 });
  if (c.length < 10 || c.length > 600) return NextResponse.json({ error: 'Comment must be 10 to 600 characters' }, { status: 400 });

  await ensureReviewsSchema();
  const recent = await sql`
    SELECT 1 FROM club_reviews WHERE user_id = ${userId} AND created_at > NOW() - INTERVAL '30 days' LIMIT 1
  `;
  if (recent.length) return NextResponse.json({ error: 'You already left a review this month' }, { status: 409 });

  const user = await currentUser();
  const name = [user?.firstName, user?.lastName?.charAt(0) ? `${user.lastName.charAt(0)}.` : '']
    .filter(Boolean).join(' ') || 'Makay guest';
  const locale = req.cookies.get('NEXT_LOCALE')?.value === 'en' ? 'en' : 'es';

  await sql`
    INSERT INTO club_reviews (user_id, author_name, rating, comment, locale)
    VALUES (${userId}, ${name}, ${r}, ${c}, ${locale})
  `;
  return NextResponse.json({ ok: true, status: 'pending' }, { status: 201 });
}
