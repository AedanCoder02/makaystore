import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await sql`
    SELECT
      p.id,
      p.title,
      p.sku,
      COALESCE(SUM(ps.quantity), p.stock, 0)::int AS qty
    FROM products p
    LEFT JOIN product_stock ps ON ps.product_id = p.id
    WHERE p.status = 'active'
    GROUP BY p.id, p.title, p.sku, p.stock
    ORDER BY qty DESC
  `.catch(() => []);

  const total = rows.length;
  const inStock = rows.filter((r) => Number(r.qty) >= 10).length;
  const lowStock = rows.filter((r) => Number(r.qty) > 0 && Number(r.qty) < 10).length;
  const outOfStock = rows.filter((r) => Number(r.qty) === 0).length;

  return NextResponse.json({
    total,
    inStock,
    lowStock,
    outOfStock,
    topSKUs: rows.slice(0, 5).map((r) => ({
      sku: r.sku ?? r.id,
      product: r.title,
      qty: Number(r.qty),
    })),
  });
}
