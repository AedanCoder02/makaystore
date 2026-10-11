import { NextResponse } from 'next/server';
import sql from '@/lib/db';

// Ensure last_rotated_at column exists
async function ensureColumn() {
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS last_rotated_at TIMESTAMPTZ`;
}

export async function GET() {
  try {
    await ensureColumn();
    const [rows, salesRows] = await Promise.all([
      sql`SELECT id, title, sku, status, last_rotated_at FROM products ORDER BY id ASC`,
      sql`
        SELECT (item->>'id') AS product_id, SUM((item->>'quantity')::int) AS units_sold
        FROM seller_orders, jsonb_array_elements(items::jsonb) AS item
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY item->>'id'
      `.catch(() => []),
    ]);

    const salesMap = Object.fromEntries(salesRows.map((r: any) => [r.product_id, Number(r.units_sold) || 0]));
    const enriched = rows.map((r: any) => ({
      ...r,
      units_sold_30d: salesMap[String(r.id)] ?? 0,
    }));

    return NextResponse.json(enriched);
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
