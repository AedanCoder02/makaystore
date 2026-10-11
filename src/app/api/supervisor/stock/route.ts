import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

function getCutoff(range: string): Date {
  const d = new Date();
  if (range === '7d') { d.setDate(d.getDate() - 7); return d; }
  if (range === '3m') { d.setDate(d.getDate() - 90); return d; }
  if (range === 'all') return new Date(0);
  d.setDate(d.getDate() - 30);
  return d;
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const range  = req.nextUrl.searchParams.get('range') ?? '30d';
  const cutoff = getCutoff(range);

  try {
    const [stockRows, soldRows] = await Promise.all([
      sql`
        SELECT
          p.id::text,
          p.title,
          p.sku,
          COALESCE(SUM(ps.quantity), p.stock, 0)::int AS qty,
          p.status
        FROM products p
        LEFT JOIN product_stock ps ON ps.product_id = p.id
        WHERE p.status != 'archived'
        GROUP BY p.id, p.title, p.sku, p.stock, p.status
        ORDER BY qty ASC
      `,
      sql`
        SELECT
          item->>'title' AS title,
          SUM(COALESCE((item->>'quantity')::int, (item->>'qty')::int, 1))::int AS units_sold
        FROM seller_orders,
             jsonb_array_elements(items::jsonb) AS item
        WHERE created_at >= ${cutoff}
        GROUP BY item->>'title'
      `.catch(() => []),
    ]);

    type StockRow = { id: string; title: string; sku: string; qty: number; status: string };
    type SoldRow  = { title: string; units_sold: number };

    const soldMap: Record<string, number> = {};
    for (const s of soldRows as SoldRow[]) {
      soldMap[s.title] = Number(s.units_sold);
    }

    const LOW = 10;
    const products = (stockRows as unknown as StockRow[]).map(p => ({
      id:        p.id,
      title:     p.title,
      sku:       p.sku ?? '—',
      qty:       Number(p.qty),
      unitsSold: soldMap[p.title] ?? 0,
      status:    Number(p.qty) === 0 ? 'out' : Number(p.qty) < LOW ? 'low' : 'ok',
    }));

    const summary = {
      total: products.length,
      out:   products.filter(p => p.status === 'out').length,
      low:   products.filter(p => p.status === 'low').length,
      ok:    products.filter(p => p.status === 'ok').length,
    };

    return NextResponse.json({ products, summary });
  } catch (e) {
    const msg = (e as Error)?.message ?? 'DB error';
    console.error('[supervisor/stock]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
