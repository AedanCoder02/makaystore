import sql from '@/lib/db';

let ready: Promise<void> | null = null;

/** Club reviews written by signed-in guests; shown after staff approval. */
export function ensureReviewsSchema(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS club_reviews (
          id          SERIAL PRIMARY KEY,
          user_id     TEXT NOT NULL,
          author_name TEXT NOT NULL,
          rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
          comment     TEXT NOT NULL,
          locale      TEXT DEFAULT 'es',
          status      TEXT NOT NULL DEFAULT 'pending',
          created_at  TIMESTAMPTZ DEFAULT NOW(),
          reviewed_by TEXT,
          reviewed_at TIMESTAMPTZ
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS club_reviews_status_idx ON club_reviews (status, created_at DESC)`;
    })().catch(e => { ready = null; throw e; });
  }
  return ready;
}

export const REVIEW_STATUSES = ['pending', 'approved', 'hidden'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
