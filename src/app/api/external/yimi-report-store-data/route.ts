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

  const costSettingRow = await sql`SELECT value FROM yimi_report_settings WHERE key = 'cost_percentage'`.catch(() => []);
  const costPct = costSettingRow.length > 0 ? Number(costSettingRow[0].value) : 40;
  const estimatedExpenses = revenue * costPct / 100;

  // Reservas revenue — booked separately from retail sales in its own
  // `reservations` table (confirmed 2026-08-29), keyed on when the
  // reservation was made (created_at), excluding cancellations.
  const [reservationsRow] = await sql`
    SELECT COALESCE(SUM(total_price::numeric), 0) AS revenue, COUNT(*) AS count
    FROM reservations
    WHERE created_at BETWEEN ${date_start} AND ${date_end}
      AND status != 'cancelled'
  `.catch(() => [{ revenue: 0, count: 0 }]);
  const reservationsRevenue = Number(reservationsRow.revenue);
  const reservationsCount = Number(reservationsRow.count);

  // items JSONB has two data-quality issues, confirmed 2026-08-28:
  // (1) field-name inconsistency — some rows use "qty", others "quantity";
  // (2) double-encoding — the column holds a JSON *string* containing the
  // array as escaped text (jsonb_typeof = 'string'), not an actual jsonb
  // array, for every row in this dataset. Unwrap once via #>>'{}' + a
  // second ::jsonb cast when that's the case. A WHERE clause on the outer
  // query can't protect a FROM-clause jsonb_array_elements call (it still
  // evaluates for every row before WHERE filters anything), so bad/non-
  // array rows must be discarded in an earlier CTE, not just filtered
  // alongside the array expansion.
  const productsRaw = await sql`
    WITH parsed AS (
      SELECT (
        CASE WHEN jsonb_typeof(items::jsonb) = 'string'
          THEN (items::jsonb #>> '{}')::jsonb
          ELSE items::jsonb
        END
      ) AS items_parsed
      FROM seller_orders
      WHERE created_at BETWEEN ${date_start} AND ${date_end}
        AND COALESCE(is_gift, FALSE) = FALSE
    ),
    valid AS (
      SELECT items_parsed FROM parsed WHERE jsonb_typeof(items_parsed) = 'array'
    )
    SELECT
      item->>'title' AS title,
      COALESCE(NULLIF(item->>'category', ''), 'Sin categoría') AS category,
      SUM(COALESCE((item->>'qty')::numeric, (item->>'quantity')::numeric, 0)) AS units,
      SUM((item->>'price')::numeric * COALESCE((item->>'qty')::numeric, (item->>'quantity')::numeric, 0)) AS revenue
    FROM valid, jsonb_array_elements(valid.items_parsed) AS item
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
  const sellerNameById = new Map<string, string>();
  const sellers = await Promise.all(
    (sellersRaw as unknown as { seller_id: string; revenue: number }[]).map(async r => {
      let name = r.seller_id.slice(-8);
      try {
        const user = clerk ? await clerk.users.getUser(r.seller_id) : null;
        if (user) name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.emailAddresses[0]?.emailAddress?.split('@')[0] || name;
      } catch { /* keep fallback name */ }
      sellerNameById.set(r.seller_id, name);
      return { name, revenue: Number(r.revenue) };
    })
  );

  // payment_method has rows with genuinely malformed JSON text (the ::jsonb
  // cast itself throws, not just a double-encoding issue like items had) —
  // parsing in JS lets us skip individual bad rows instead of losing the
  // whole result when one row is broken.
  const rawPaymentRows = await sql`
    SELECT payment_method
    FROM seller_orders
    WHERE created_at BETWEEN ${date_start} AND ${date_end}
      AND COALESCE(is_gift, FALSE) = FALSE
      AND payment_method IS NOT NULL
  `.catch(() => []);
  const paymentTotals = new Map<string, { amount: number; count: number }>();
  for (const row of rawPaymentRows as unknown as { payment_method: string }[]) {
    try {
      let parsed: unknown = JSON.parse(row.payment_method);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed); // unwrap double-encoding
      if (!Array.isArray(parsed)) continue;
      for (const pm of parsed as { method?: string; amount?: number }[]) {
        const method = pm.method ?? 'otro';
        const existing = paymentTotals.get(method) ?? { amount: 0, count: 0 };
        existing.amount += Number(pm.amount ?? 0);
        existing.count += 1;
        paymentTotals.set(method, existing);
      }
    } catch {
      continue; // skip malformed rows rather than aborting the whole aggregation
    }
  }
  const paymentBreakdownRaw = Array.from(paymentTotals.entries())
    .map(([method, { amount, count }]) => ({ method, amount, count }))
    .sort((a, b) => b.amount - a.amount);

  // Transaction-level detail (client, items, payment method, amount) for
  // the new Detalle de Transacciones sheet. Reuses the same double-encoding
  // + malformed-JSON tolerance as the aggregate queries above, parsed
  // per-row in JS so one bad row doesn't drop the whole transaction.
  const rawTransactionRows = await sql`
    SELECT id, client_name, items, payment_method, subtotal, created_at, seller_id
    FROM seller_orders
    WHERE created_at BETWEEN ${date_start} AND ${date_end}
      AND COALESCE(is_gift, FALSE) = FALSE
    ORDER BY created_at DESC
  `.catch(() => []);

  function parseJsonArray(raw: string | null): Record<string, unknown>[] {
    if (!raw) return [];
    try {
      let parsed: unknown = JSON.parse(raw);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
    } catch {
      return [];
    }
  }

  const transactions = (rawTransactionRows as unknown as {
    id: string; client_name: string | null; items: string | null; payment_method: string | null;
    subtotal: string; created_at: string; seller_id: string;
  }[]).map(r => {
    const items = parseJsonArray(r.items);
    const payments = parseJsonArray(r.payment_method);
    return {
      fecha: r.created_at,
      cliente: r.client_name?.trim() || 'Cliente sin nombre',
      empleado: sellerNameById.get(r.seller_id) ?? r.seller_id.slice(-8),
      productos: items.map(i => `${i.title ?? '—'} x${i.qty ?? i.quantity ?? 1}`).join(', '),
      metodoPago: payments.map(p => String(p.method ?? 'otro')).join(', '),
      monto: Number(r.subtotal),
    };
  });

  const stockDetailRows = await sql`
    SELECT p.title, p.sku, COALESCE(ps.ps_qty, p.stock, 0)::int AS qty, p.price::numeric AS price
    FROM products p
    LEFT JOIN (SELECT product_id, SUM(quantity)::int AS ps_qty FROM product_stock GROUP BY product_id) ps
      ON ps.product_id = p.id
    WHERE p.status = 'active'
    ORDER BY qty ASC
  `.catch(() => []);
  const allActive = (stockDetailRows as unknown as { title: string; sku: string | null; qty: number; price: string }[])
    .map(r => ({ title: r.title, sku: r.sku, qty: r.qty, price: Number(r.price) }));
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
    reservationsRevenue,
    reservationsCount,
    products: (productsRaw as unknown as { title: string; category: string; units: number; revenue: number }[]).map(r => ({
      title: r.title ?? '—', category: r.category, units: Number(r.units), revenue: Number(r.revenue),
    })),
    sellers,
    paymentBreakdown: paymentBreakdownRaw,
    stock,
    transactions,
  });
}
