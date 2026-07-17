import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [daily, totals] = await Promise.all([
    sql`
      SELECT
        TO_CHAR(created_at::date, 'Mon DD') AS date,
        SUM(subtotal::numeric) AS revenue,
        COUNT(*) AS orders
      FROM seller_orders
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY created_at::date
      ORDER BY created_at::date ASC
    `.catch(() => []),
    sql`
      SELECT
        SUM(subtotal::numeric) AS total_revenue,
        COUNT(*) AS total_orders,
        AVG(subtotal::numeric) AS avg_order
      FROM seller_orders
      WHERE created_at >= date_trunc('month', NOW())
    `.catch(() => [{ total_revenue: 0, total_orders: 0, avg_order: 0 }]),
  ]);

  const t = totals[0] ?? { total_revenue: 0, total_orders: 0, avg_order: 0 };

  return NextResponse.json({
    chart: daily.map((r) => ({
      date: r.date,
      revenue: Number(r.revenue) || 0,
    })),
    totalRevenue: Number(t.total_revenue) || 0,
    totalOrders: Number(t.total_orders) || 0,
    avgOrder: Number(t.avg_order) || 0,
  });
}
