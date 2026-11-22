import { requireAccess } from '@/lib/apiAuth';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import sql from '@/lib/db';
import { getPanelLocation } from '@/lib/location.server';
import { getReportSettings, setReportSetting } from '@/lib/reportSettings';

function rangeExpr(range: string) {
  switch (range) {
    case '7d':  return sql.unsafe("NOW() - INTERVAL '7 days'");
    case '3m':  return sql.unsafe("NOW() - INTERVAL '90 days'");
    case 'all': return sql.unsafe("'1970-01-01'::timestamptz");
    default:    return sql.unsafe("NOW() - INTERVAL '30 days'");
  }
}

export async function GET(req: NextRequest) {
  const gate = await requireAccess('admin');
  if (gate instanceof NextResponse) return gate;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const location = await getPanelLocation();
  const range  = req.nextUrl.searchParams.get('range') ?? '30d';
  const cutoff = rangeExpr(range);

  try {
    const [sellerRev, storefrontRev, settings, trend] = await Promise.all([
      sql`
        SELECT COALESCE(SUM(subtotal::numeric), 0) AS revenue
        FROM seller_orders
        WHERE created_at >= ${cutoff} AND location = ${location}
      `.catch(() => [{ revenue: 0 }]),

      sql`
        SELECT COALESCE(SUM(total::numeric), 0) AS revenue
        FROM orders
        WHERE created_at >= ${cutoff} AND location = ${location}
      `.catch(() => [{ revenue: 0 }]),

      getReportSettings(),

      sql`
        SELECT
          DATE_TRUNC('day', created_at) AS bucket,
          SUM(subtotal::numeric) AS revenue
        FROM seller_orders
        WHERE created_at >= ${cutoff} AND location = ${location}
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY bucket ASC
      `.catch(() => []),
    ]);

    const costPercent = settings.cost_percentage;
    const revenue     = Number(sellerRev[0].revenue) + Number(storefrontRev[0].revenue);
    const totalCost   = revenue * (costPercent / 100);
    const grossMargin = 100 - costPercent;
    const profit      = revenue - totalCost;

    return NextResponse.json({
      revenue, costPercent, totalCost, grossMargin, profit,
      trend: trend.map((r: any) => ({
        date: new Date(r.bucket).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: Number(r.revenue) || 0,
      })),
    });
  } catch (error) {
    console.error('cost report error:', error);
    return NextResponse.json({ error: 'Failed to fetch cost data' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const gate = await requireAccess('admin');
  if (gate instanceof NextResponse) return gate;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { costPercent } = await req.json();
  if (typeof costPercent !== 'number' || costPercent < 0 || costPercent > 100) {
    return NextResponse.json({ error: 'Invalid value' }, { status: 400 });
  }

  try {
    await setReportSetting('cost_percentage', costPercent, userId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
