import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const revalidate = 60;

export async function GET() {
  try {
    const rows = await sql`
      SELECT
        p.id, p.title, p.description, p.category, p.variants, p.sku, p.status,
        COALESCE(po.price, p.price)::numeric AS price,
        COALESCE(po.image_url, p.image) AS image,
        COALESCE(po.product_type, 'storefront') AS product_type,
        COALESCE(SUM(ps.quantity), p.stock)::int AS stock
      FROM products p
      LEFT JOIN product_overrides po ON po.product_id = p.id
      LEFT JOIN product_stock ps ON ps.product_id = p.id
      WHERE p.status = 'active'
      GROUP BY p.id, p.title, p.description, p.category, p.variants, p.sku, p.status,
               po.price, po.image_url, po.product_type
      ORDER BY CAST(p.id AS integer) ASC
    `;
    const parsed = rows.map((r: any) => ({
      ...r,
      variants: typeof r.variants === 'string' ? JSON.parse(r.variants) : r.variants,
      price: parseFloat(r.price),
      stock: Number(r.stock),
    }));
    return NextResponse.json(parsed);
  } catch (e: any) {
    console.error('[/api/products]', e?.message);
    return NextResponse.json({ error: 'Failed to fetch products', detail: e?.message }, { status: 500 });
  }
}
