import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface AgentizarContact {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  company_name: string | null;
  custom_fields: Record<string, unknown> | null;
  labels: string[] | null;
  created_at: string | null;
}

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS crm_contacts (
      id                   TEXT PRIMARY KEY,
      full_name            TEXT,
      phone                TEXT,
      email                TEXT,
      company_name         TEXT,
      custom_fields        JSONB,
      labels               JSONB,
      external_created_at  TIMESTAMPTZ,
      synced_at            TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

async function fetchPage(offset: number, limit: number): Promise<{ data: AgentizarContact[]; hasMore: boolean; total: number }> {
  const url = `https://api.agentizar.com/v1/crm/contacts?format=json&limit=${limit}&offset=${offset}`;
  const res = await fetch(url, { headers: { 'x-api-key': process.env.AGENTIZAR_API_KEY ?? '' } });
  if (!res.ok) throw new Error(`Agentizar API ${res.status}: ${await res.text().catch(() => '')}`);
  const body = await res.json();
  if (!body.success) throw new Error('Agentizar API returned success:false');
  return { data: body.data ?? [], hasMore: !!body.pagination?.has_more, total: Number(body.pagination?.total ?? 0) };
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.AGENTIZAR_API_KEY) {
    return NextResponse.json({ error: 'AGENTIZAR_API_KEY not configured' }, { status: 500 });
  }

  try {
    await ensureTable();

    const LIMIT = 250;
    let offset = 0;
    let total = 0;
    let synced = 0;
    let pages = 0;

    while (true) {
      const { data, hasMore, total: pageTotal } = await fetchPage(offset, LIMIT);
      total = pageTotal;
      pages++;

      await Promise.all(data.map(c => sql`
        INSERT INTO crm_contacts (id, full_name, phone, email, company_name, custom_fields, labels, external_created_at, synced_at)
        VALUES (
          ${c.id}, ${c.full_name}, ${c.phone}, ${c.email}, ${c.company_name},
          ${JSON.stringify(c.custom_fields ?? {})}, ${JSON.stringify(c.labels ?? [])},
          ${c.created_at}, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          company_name = EXCLUDED.company_name,
          custom_fields = EXCLUDED.custom_fields,
          labels = EXCLUDED.labels,
          external_created_at = EXCLUDED.external_created_at,
          synced_at = NOW()
      `));
      synced += data.length;

      if (!hasMore || data.length === 0) break;
      offset += LIMIT;
      if (pages > 200) break; // safety guard against a runaway loop
    }

    return NextResponse.json({ ok: true, synced, total, pages });
  } catch (e: any) {
    console.error('[GET /api/admin/crm/sync-contacts]', e?.message);
    return NextResponse.json({ error: e?.message ?? 'Sync failed' }, { status: 500 });
  }
}
