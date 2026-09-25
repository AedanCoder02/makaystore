import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';

  const [rows, countRow] = await Promise.all([
    q
      ? sql`
          SELECT id, full_name, phone_raw, email, sources, extra
          FROM contacts
          WHERE full_name ILIKE ${'%' + q + '%'} OR phone_raw ILIKE ${'%' + q + '%'} OR email ILIKE ${'%' + q + '%'}
          ORDER BY full_name
          LIMIT 200
        `
      : sql`SELECT id, full_name, phone_raw, email, sources, extra FROM contacts ORDER BY updated_at DESC LIMIT 200`,
    sql`SELECT count(*)::int AS n FROM contacts`,
  ]);

  return NextResponse.json({ clients: rows, total: countRow[0].n });
}
