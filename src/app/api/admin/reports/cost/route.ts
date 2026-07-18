import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import sql from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS theme_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    const [revenueRow] = await sql`
      SELECT COALESCE(SUM(subtotal::numeric), 0) AS revenue
      FROM seller_orders
      WHERE created_at >= date_trunc('month', NOW())
    `;

    const costRows = await sql`
      SELECT value FROM theme_settings WHERE key = 'cost_percentage'
    `;
    const costPercent = costRows.length > 0 ? Number(costRows[0].value) : 40;
    const revenue = Number(revenueRow.revenue);
    const totalCost = revenue * (costPercent / 100);
    const grossMargin = 100 - costPercent;
    const profit = revenue - totalCost;

    // Last 30 days revenue trend for chart
    const trend = await sql`
      SELECT
        DATE(created_at) AS date,
        SUM(subtotal::numeric) AS revenue
      FROM seller_orders
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return NextResponse.json({ revenue, costPercent, totalCost, grossMargin, profit, trend });
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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
