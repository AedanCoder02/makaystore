import sql from '@/lib/db';

let ready: Promise<void> | null = null;

/** Emails collected by the homepage newsletter form. */
export function ensureNewsletterSchema(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS newsletter_subscribers (
          id              SERIAL PRIMARY KEY,
          email           TEXT NOT NULL UNIQUE,
          locale          TEXT DEFAULT 'es',
          source          TEXT DEFAULT 'homepage',
          created_at      TIMESTAMPTZ DEFAULT NOW(),
          unsubscribed_at TIMESTAMPTZ
        )
      `;
    })().catch(e => { ready = null; throw e; });
  }
  return ready;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
