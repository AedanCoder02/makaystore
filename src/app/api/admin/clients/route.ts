import { requireAccess } from '@/lib/apiAuth';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

const PAGE_SIZE = 50;

/**
 * GET — the shared `contacts` table (admin). This repo never writes it: rows come
 * from the external contact pipeline (Yimi, Roulette, store accounts/walk-ins,
 * historical CSV), tagged in `sources`.
 * Query: q (name/phone/email), source, page (1-based).
 */
export async function GET(req: NextRequest) {
  const gate = await requireAccess('admin');
  if (gate instanceof NextResponse) return gate;

  const sp = req.nextUrl.searchParams;
  const q = sp.get('q')?.trim() ?? '';
  const source = sp.get('source')?.trim() ?? '';
  const page = Math.max(1, Math.floor(Number(sp.get('page')) || 1));
  const like = `%${q}%`;

  const where = () => sql`
    WHERE (${q} = '' OR full_name ILIKE ${like} OR phone_raw ILIKE ${like} OR email ILIKE ${like})
      AND (${source} = '' OR ${source} = ANY(sources))
  `;

  const [rows, matched, total, bySource] = await Promise.all([
    sql`
      SELECT id, full_name, phone_raw, email, sources
      FROM contacts ${where()}
      ORDER BY ${q ? sql`full_name` : sql`updated_at DESC NULLS LAST`}, id
      LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}
    `,
    sql`SELECT count(*)::int AS n FROM contacts ${where()}`,
    sql`SELECT count(*)::int AS n FROM contacts`,
    sql`SELECT s AS source, count(*)::int AS n FROM contacts, unnest(sources) AS s GROUP BY s ORDER BY n DESC`,
  ]);

  return NextResponse.json({
    clients: rows,
    matched: matched[0].n,
    total: total[0].n,
    bySource,
    page,
    pageSize: PAGE_SIZE,
  });
}
