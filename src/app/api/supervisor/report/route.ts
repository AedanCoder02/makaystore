import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

function cutoffFromRange(range: string): Date {
  const now = Date.now();
  switch (range) {
    case '7d':  return new Date(now - 7  * 86_400_000);
    case '3m':  return new Date(now - 90 * 86_400_000);
    case 'all': return new Date(0);
    default:    return new Date(now - 30 * 86_400_000);
  }
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const range  = req.nextUrl.searchParams.get('range') ?? '30d';
  const cutoff = cutoffFromRange(range);

  const [orders, goalRows, costRows] = await Promise.all([
    sql`
      SELECT
        id::text,
        seller_id,
        client_name,
        client_email,
        items,
        subtotal::numeric AS subtotal,
        payment_method AS payment_methods,
        created_at
      FROM seller_orders
      WHERE created_at >= ${cutoff}
      ORDER BY created_at DESC
      LIMIT 500
    `.catch(() => []),

    sql`
      SELECT value FROM theme_settings WHERE key = 'monthly_target'
    `.catch(() => []),

    sql`
      SELECT value FROM theme_settings WHERE key = 'cost_percentage'
    `.catch(() => []),
  ]);

  // Resolve seller names from Clerk
  const sellerIds = [...new Set((orders as { seller_id: string }[]).map(o => o.seller_id))];
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

  const monthCutoff = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthlyActual = (orders as { subtotal: number; created_at: string }[])
    .filter(o => new Date(o.created_at) >= monthCutoff)
    .reduce((s, o) => s + Number(o.subtotal), 0);

  const monthlySums = await sql`
    SELECT COALESCE(SUM(subtotal::numeric), 0) AS actual
    FROM seller_orders
    WHERE created_at >= ${monthCutoff}
  `.catch(() => [{ actual: 0 }]);

  const rows = (orders as {
    id: string; seller_id: string; client_name: string; client_email: string;
    items: unknown; subtotal: unknown; payment_methods: unknown; created_at: string;
  }[]).map(o => ({
    id: o.id,
    sellerName: nameMap[o.seller_id] ?? 'Seller',
    clientName: o.client_name || o.client_email || '—',
    items: typeof o.items === 'string' ? JSON.parse(o.items) : (o.items ?? []),
    subtotal: Number(o.subtotal),
    paymentMethods: typeof o.payment_methods === 'string'
      ? JSON.parse(o.payment_methods)
      : (Array.isArray(o.payment_methods) ? o.payment_methods : []),
    createdAt: o.created_at,
  }));

  const monthlyTarget = goalRows.length > 0 ? Number(goalRows[0].value) : 400000;
  const monthlyActualDB = Number((monthlySums as { actual: unknown }[])[0]?.actual) || 0;
  const costPercent = costRows.length > 0 ? Number(costRows[0].value) : 40;

  return NextResponse.json({ orders: rows, monthlyTarget, monthlyActual: monthlyActualDB, costPercent });
}
