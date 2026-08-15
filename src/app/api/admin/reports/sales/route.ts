import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

function rangeExpr(range: string) {
  switch (range) {
    case '7d':  return sql.unsafe("NOW() - INTERVAL '7 days'");
    case '3m':  return sql.unsafe("NOW() - INTERVAL '90 days'");
    case 'all': return sql.unsafe("'1970-01-01'::timestamptz");
    default:    return sql.unsafe("NOW() - INTERVAL '30 days'");
  }
}

function groupBy(range: string) {
  if (range === '3m' || range === 'all') return 'week';
  return 'day';
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const range  = req.nextUrl.searchParams.get('range') ?? '30d';
  const cutoff = rangeExpr(range);
  const bucket = groupBy(range);
  const trunc  = sql.unsafe(bucket === 'week' ? 'week' : 'day');

  const [sellerDaily, storefrontDaily, totals, membershipRevenue, topProducts] = await Promise.all([
    sql`
      SELECT
        DATE_TRUNC(${trunc}, created_at) AS bucket,
        SUM(subtotal::numeric) AS revenue,
        COUNT(*) AS orders
      FROM seller_orders
      WHERE created_at >= ${cutoff}
      GROUP BY DATE_TRUNC(${trunc}, created_at)
      ORDER BY bucket ASC
    `.catch(() => []),

    sql`
      SELECT
        DATE_TRUNC(${trunc}, created_at) AS bucket,
        SUM(total::numeric) AS revenue,
        COUNT(*) AS orders
      FROM orders
      WHERE created_at >= ${cutoff}
      GROUP BY DATE_TRUNC(${trunc}, created_at)
      ORDER BY bucket ASC
    `.catch(() => []),

    sql`
      SELECT
        COALESCE(s.rev, 0) + COALESCE(o.rev, 0) AS total_revenue,
        COALESCE(s.cnt, 0) + COALESCE(o.cnt, 0) AS total_orders,
        COALESCE(s.avg_v, 0)                     AS avg_seller,
        COALESCE(o.avg_v, 0)                     AS avg_storefront
      FROM
        (SELECT SUM(subtotal::numeric) AS rev, COUNT(*) AS cnt, AVG(subtotal::numeric) AS avg_v
         FROM seller_orders WHERE created_at >= ${cutoff}) s,
        (SELECT SUM(total::numeric) AS rev, COUNT(*) AS cnt, AVG(total::numeric) AS avg_v
         FROM orders WHERE created_at >= ${cutoff}) o
    `.catch(() => [{ total_revenue: 0, total_orders: 0, avg_seller: 0, avg_storefront: 0 }]),

    sql`
      SELECT COALESCE(SUM(total_paid::numeric), 0) AS membership_rev
      FROM event_tickets
      WHERE purchased_at >= ${cutoff}
    `.catch(() => [{ membership_rev: 0 }]),

    sql`
      SELECT
        p_items->>'title' AS title,
        SUM((p_items->>'price')::numeric * (p_items->>'quantity')::numeric) AS revenue,
        SUM((p_items->>'quantity')::numeric) AS units
      FROM seller_orders,
        jsonb_array_elements(
          CASE WHEN jsonb_typeof(items::jsonb) = 'array' THEN items::jsonb ELSE '[]'::jsonb END
        ) AS p_items
      WHERE created_at >= ${cutoff}
      GROUP BY p_items->>'title'
      ORDER BY revenue DESC
      LIMIT 5
    `.catch(() => []),
  ]);

  // Merge daily/weekly buckets from both sources
  const bucketMap: Record<string, { date: string; revenue: number; orders: number }> = {};

  for (const row of sellerDaily) {
    const key = new Date(row.bucket).toLocaleDateString('en-US', bucket === 'week' ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric' });
    if (!bucketMap[key]) bucketMap[key] = { date: key, revenue: 0, orders: 0 };
    bucketMap[key].revenue += Number(row.revenue) || 0;
    bucketMap[key].orders  += Number(row.orders) || 0;
  }
  for (const row of storefrontDaily) {
    const key = new Date(row.bucket).toLocaleDateString('en-US', bucket === 'week' ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric' });
    if (!bucketMap[key]) bucketMap[key] = { date: key, revenue: 0, orders: 0 };
    bucketMap[key].revenue += Number(row.revenue) || 0;
    bucketMap[key].orders  += Number(row.orders) || 0;
  }

  const chart = Object.values(bucketMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const t = totals[0] ?? {};
  const totalRevenue = Number(t.total_revenue) || 0;
  const totalOrders  = Number(t.total_orders) || 0;
  const avgOrder     = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return NextResponse.json({
    chart,
    totalRevenue,
    totalOrders,
    avgOrder,
    membershipRevenue: Number(membershipRevenue[0]?.membership_rev) || 0,
    topProducts: topProducts.map((p: any) => ({
      title: p.title ?? 'Unknown',
      revenue: Number(p.revenue) || 0,
      units: Number(p.units) || 0,
    })),
  });
}
