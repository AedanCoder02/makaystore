import sql from '@/lib/db';

let ready: Promise<void> | null = null;

/** Creates the events tables and the blog-style columns (content, gallery, tags). */
export function ensureEventsSchema(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS events (
          id          SERIAL PRIMARY KEY,
          title       TEXT NOT NULL,
          description TEXT,
          event_date  TIMESTAMPTZ,
          location    TEXT,
          image_url   TEXT,
          price       NUMERIC(10,2) DEFAULT 0,
          capacity    INTEGER DEFAULT 100,
          status      TEXT DEFAULT 'active',
          created_at  TIMESTAMPTZ DEFAULT NOW(),
          updated_at  TIMESTAMPTZ DEFAULT NOW()
        )
      `;
      await sql`
        ALTER TABLE events
          ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '',
          ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]',
          ADD COLUMN IF NOT EXISTS tags    TEXT DEFAULT ''
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS event_tickets (
          id             SERIAL PRIMARY KEY,
          event_id       INTEGER REFERENCES events(id) ON DELETE CASCADE,
          customer_id    TEXT,
          customer_name  TEXT,
          customer_email TEXT,
          quantity       INTEGER DEFAULT 1,
          total_paid     NUMERIC(10,2) DEFAULT 0,
          purchased_at   TIMESTAMPTZ DEFAULT NOW()
        )
      `;
      await sql`ALTER TABLE event_tickets ADD COLUMN IF NOT EXISTS order_id TEXT`;
    })().catch(e => { ready = null; throw e; });
  }
  return ready;
}

/**
 * Events stay listed until 12 hours after they start, so a night event
 * doesn't vanish from the homepage while it is still running.
 */
export const UPCOMING_GRACE = '12 hours';

const DRIVE_FILE = /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{20,})/;

/**
 * Turns a Google Drive share link ("Anyone with the link") into a URL that
 * renders in an <img>. Other URLs pass through unchanged.
 */
export function normalizeImageUrl(url: string): string {
  const u = url.trim();
  const m = u.match(DRIVE_FILE);
  return m ? `https://lh3.googleusercontent.com/d/${m[1]}=w2000` : u;
}

export function normalizeGallery(input: unknown): string[] {
  const list = Array.isArray(input)
    ? input
    : typeof input === 'string' ? input.split(/[\n,]+/) : [];
  return list
    .map(v => normalizeImageUrl(String(v ?? '')))
    .filter(v => /^https:\/\//.test(v))
    .slice(0, 30);
}

export function eventProductId(id: number | string): string {
  return `event-${id}`;
}

export function parseEventProductId(productId: string): number | null {
  const m = /^event-(\d+)$/.exec(productId);
  return m ? Number(m[1]) : null;
}
