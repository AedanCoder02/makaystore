import { auth, clerkClient } from '@clerk/nextjs/server';
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
    const [ordersRaw, goalRows, costRows, monthlySums, allProducts] = await Promise.all([
      sql`
        SELECT * FROM seller_orders
        WHERE created_at >= ${cutoff}
        ORDER BY created_at DESC
        LIMIT 500
      `,
      sql`SELECT value FROM theme_settings WHERE key = 'monthly_target'`.catch(() => []),
      sql`SELECT value FROM theme_settings WHERE key = 'cost_percentage'`.catch(() => []),
      sql`
        SELECT COALESCE(SUM(subtotal::numeric), 0) AS actual
        FROM seller_orders
        WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
      `.catch(() => [{ actual: 0 }]),
      sql`
        SELECT id::text, title, sku, price::float
        FROM products
        WHERE status != 'archived'
        ORDER BY title ASC
      `.catch(() => []),
    ]);

    // Normalize rows — handles both JSONB (object) and TEXT (string) column storage
    const orders = (ordersRaw as Record<string, unknown>[]).map(r => ({
      id:              String(r.id ?? ''),
      seller_id:       String(r.seller_id ?? ''),
      client_name:     String(r.client_name ?? r.client_email ?? '—'),
      items:           r.items,
      subtotal:        Number(r.subtotal ?? 0),
      payment_methods: r.payment_method ?? r.payment_methods ?? [],
      created_at:      r.created_at,
    }));

    // Resolve seller names from Clerk
    const sellerIds = [...new Set(orders.map(o => o.seller_id).filter(Boolean))];
    const nameMap: Record<string, string> = {};
    if (sellerIds.length > 0) {
      const client = await clerkClient();
      await Promise.all(sellerIds.map(async (id) => {
        try {
          const u = await client.users.getUser(id);
          nameMap[id] = u.fullName ?? u.firstName ?? 'Seller';
        } catch {
          nameMap[id] = 'Seller';
        }
      }));
    }

    const parseJson = (v: unknown): unknown[] => {
      if (Array.isArray(v)) return v;
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
      return [];
    };

    const rows = orders.map(o => ({
      id: o.id,
      sellerName: nameMap[o.seller_id] ?? 'Seller',
      clientName: o.client_name || '—',
      items: parseJson(o.items),
      subtotal: o.subtotal,
      paymentMethods: parseJson(o.payment_methods),
      createdAt: o.created_at,
    }));

    const monthlyTarget   = goalRows.length > 0 ? Number(goalRows[0].value) : 400000;
    const monthlyActualDB = Number((monthlySums as { actual: unknown }[])[0]?.actual) || 0;
    const costPercent     = costRows.length > 0 ? Number(costRows[0].value) : 40;

    return NextResponse.json({ orders: rows, products: allProducts, monthlyTarget, monthlyActual: monthlyActualDB, costPercent });
  } catch (e) {
    const msg = (e as Error)?.message ?? 'DB error';
    console.error('[supervisor/report]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
