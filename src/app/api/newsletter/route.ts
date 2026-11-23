import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { ensureNewsletterSchema, EMAIL_RE } from '@/lib/newsletter';

// POST — public newsletter sign-up. Re-subscribing clears unsubscribed_at.
export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));
  const e = String(email ?? '').trim().toLowerCase();
  if (e.length > 254 || !EMAIL_RE.test(e)) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });

  const locale = req.cookies.get('NEXT_LOCALE')?.value === 'en' ? 'en' : 'es';
  await ensureNewsletterSchema();
  await sql`
    INSERT INTO newsletter_subscribers (email, locale)
    VALUES (${e}, ${locale})
    ON CONFLICT (email) DO UPDATE SET unsubscribed_at = NULL
  `;
  return NextResponse.json({ ok: true }, { status: 201 });
}
