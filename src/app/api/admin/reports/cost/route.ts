import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import sql from '@/lib/db';

function intervalFromRange(range: string) {
  switch (range) {
    case '7d':  return '7 days';
    case '3m':  return '90 days';
    case 'all': return '3650 days';
    default:    return '30 days';
  }
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const range    = req.nextUrl.searchParams.get('range') ?? '30d';
  const interval = intervalFromRange(range);

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS theme_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    const [sellerRev, storefrontRev, costRows, trend] = await Promise.all([
      sql`
        SELECT COALESCE(SUM(subtotal::numeric), 0) AS revenue
        FROM seller_orders
        WHERE created_at >= NOW() - INTERVAL ${interval}
      `.catch(() => [{ revenue: 0 }]),

      sql`
        SELECT COALESCE(SUM(total::numeric), 0) AS revenue
        FROM orders
        WHERE created_at >= NOW() - INTERVAL ${interval}
      `.catch(() => [{ revenue: 0 }]),

      sql`SELECT value FROM theme_settings WHERE key = 'cost_percentage'`.catch(() => []),

      sql`
        SELECT
          DATE_TRUNC('day', created_at) AS bucket,
          SUM(subtotal::numeric) AS revenue
        FROM seller_orders
        WHERE created_at >= NOW() - INTERVAL ${interval}
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY bucket ASC
      `.catch(() => []),
    ]);

    const costPercent = costRows.length > 0 ? Number(costRows[0].value) : 40;
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
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { costPercent } = await req.json();
  if (typeof costPercent !== 'number' || costPercent < 0 || costPercent > 100) {
    return NextResponse.json({ error: 'Invalid value' }, { status: 400 });
  }

  try {
    await sql`
      INSERT INTO theme_settings (key, value, updated_at)
      VALUES ('cost_percentage', ${String(costPercent)}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
