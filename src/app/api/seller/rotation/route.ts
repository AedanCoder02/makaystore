import { NextResponse } from 'next/server';
import sql from '@/lib/db';

// Ensure last_rotated_at column exists
async function ensureColumn() {
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS last_rotated_at TIMESTAMPTZ`;
}

export async function GET() {
  try {
    await ensureColumn();
    const rows = await sql`
      SELECT id, title, sku, status, last_rotated_at
      FROM products
      ORDER BY id ASC
    `;
    return NextResponse.json(rows);
  } catch (e: any) {
    console.error('[GET /api/seller/rotation]', e?.message);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });
    const valid = ['active', 'paused', 'archived'];
    if (!valid.includes(status)) return NextResponse.json({ error: 'invalid status' }, { status: 400 });

    await sql`
      UPDATE products
      SET status = ${status}, last_rotated_at = NOW()
      WHERE id = ${String(id)}
    `;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[PATCH /api/seller/rotation]', e?.message);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
