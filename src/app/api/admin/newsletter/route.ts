import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireAccess } from '@/lib/apiAuth';
import { ensureNewsletterSchema } from '@/lib/newsletter';

// GET — subscriber list as CSV (admin)
export async function GET() {
  const gate = await requireAccess('admin');
  if (gate instanceof NextResponse) return gate;
  await ensureNewsletterSchema();
  const rows = await sql`
    SELECT email, locale, created_at FROM newsletter_subscribers
    WHERE unsubscribed_at IS NULL ORDER BY created_at DESC
  `;
  const csv = ['email,locale,created_at', ...rows.map(r => `${r.email},${r.locale},${new Date(r.created_at).toISOString()}`)].join('\n');
  return new NextResponse(csv, {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="newsletter.csv"' },
  });
}
