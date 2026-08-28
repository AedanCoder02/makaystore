import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { clerkClient } from '@clerk/nextjs/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env.YIMI_REPORT_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { date_start, date_end } = await req.json();
  if (!date_start || !date_end) {
    return NextResponse.json({ error: 'date_start and date_end required' }, { status: 400 });
  }

  await sql`ALTER TABLE seller_orders ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT FALSE`.catch(() => {});

  const [salesRow] = await sql`
    SELECT COALESCE(SUM(subtotal::numeric), 0) AS revenue
    FROM seller_orders
    WHERE created_at BETWEEN ${date_start} AND ${date_end}
      AND COALESCE(is_gift, FALSE) = FALSE
  `;
  const revenue = Number(salesRow.revenue);

  const costSettingRow = await sql`SELECT value FROM theme_settings WHERE key = 'cost_percentage'`.catch(() => []);
  const costPct = costSettingRow.length > 0 ? Number(costSettingRow[0].value) : 40;
  const estimatedExpenses = revenue * costPct / 100;

  const productsRaw = await sql`
    SELECT
      item->>'title' AS title,
      COALESCE(NULLIF(item->>'category', ''), 'Sin categoría') AS category,
      SUM((item->>'qty')::numeric) AS units,
      SUM((item->>'price')::numeric * (item->>'qty')::numeric) AS revenue
    FROM seller_orders, jsonb_array_elements(items::jsonb) AS item
    WHERE created_at BETWEEN ${date_start} AND ${date_end}
      AND COALESCE(is_gift, FALSE) = FALSE
    GROUP BY title, category
    ORDER BY revenue DESC
  `.catch(() => []);

  const sellersRaw = await sql`
    SELECT seller_id, SUM(subtotal::numeric) AS revenue
    FROM seller_orders
    WHERE created_at BETWEEN ${date_start} AND ${date_end}
      AND COALESCE(is_gift, FALSE) = FALSE
    GROUP BY seller_id
    ORDER BY revenue DESC
  `.catch(() => []);
  const clerk = await clerkClient().catch(() => null);
  const sellers = await Promise.all(
    (sellersRaw as unknown as { seller_id: string; revenue: number }[]).map(async r => {
      let name = r.seller_id.slice(-8);
      try {
        const user = clerk ? await clerk.users.getUser(r.seller_id) : null;
        if (user) name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.emailAddresses[0]?.emailAddress?.split('@')[0] || name;
      } catch { /* keep fallback name */ }
      return { name, revenue: Number(r.revenue) };
    })
  );

  const paymentBreakdownRaw = await sql`
    SELECT pm->>'method' AS method, SUM((pm->>'amount')::numeric) AS amount, COUNT(*) AS count
    FROM seller_orders, jsonb_array_elements(payment_method::jsonb) AS pm
    WHERE created_at BETWEEN ${date_start} AND ${date_end}
      AND COALESCE(is_gift, FALSE) = FALSE
    GROUP BY method
    ORDER BY amount DESC
  `.catch(() => []);

  const stockDetailRows = await sql`
    SELECT p.title, p.sku, COALESCE(ps.ps_qty, p.stock, 0)::int AS qty
    FROM products p
    LEFT JOIN (SELECT product_id, SUM(quantity)::int AS ps_qty FROM product_stock GROUP BY product_id) ps
      ON ps.product_id = p.id
    WHERE p.status = 'active'
    ORDER BY qty ASC
  `.catch(() => []);
  const allActive = stockDetailRows as unknown as { title: string; sku: string | null; qty: number }[];
  const stock = {
    total: allActive.length,
    inStock: allActive.filter(r => r.qty >= 10).length,
    low: allActive.filter(r => r.qty > 0 && r.qty < 10).length,
    outOfStock: allActive.filter(r => r.qty === 0).length,
    items: allActive,
  };

  return NextResponse.json({
    revenue,
    estimatedExpenses,
    costPct,
    products: (productsRaw as unknown as { title: string; category: string; units: number; revenue: number }[]).map(r => ({
      title: r.title ?? '—', category: r.category, units: Number(r.units), revenue: Number(r.revenue),
    })),
    sellers,
    paymentBreakdown: (paymentBreakdownRaw as unknown as { method: string; amount: number; count: number }[]).map(r => ({
      method: r.method ?? 'otro', amount: Number(r.amount), count: Number(r.count),
    })),
    stock,
  });
}
