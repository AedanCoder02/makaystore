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

    const [actualRow] = await sql`
      SELECT COALESCE(SUM(subtotal::numeric), 0) AS actual
      FROM seller_orders
      WHERE created_at >= date_trunc('month', NOW())
    `;

    const targetRows = await sql`
      SELECT value FROM theme_settings WHERE key = 'monthly_target'
    `;
    const target = targetRows.length > 0 ? Number(targetRows[0].value) : 400000;
    const actual = Number(actualRow.actual);
    const progress = target > 0 ? (actual / target) * 100 : 0;

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - now.getDate();
    const daysPassed = now.getDate();
    const dailyRate = daysPassed > 0 ? actual / daysPassed : 0;
    const projectedMonthEnd = dailyRate * daysInMonth;

    // Weekly breakdown for chart
    const weeks = await sql`
      SELECT
        CEIL(EXTRACT(DAY FROM created_at) / 7.0) AS week,
        SUM(subtotal::numeric) AS actual
      FROM seller_orders
      WHERE created_at >= date_trunc('month', NOW())
      GROUP BY week
      ORDER BY week ASC
    `;

    const weeklyTarget = target / (daysInMonth / 7);
    const chart = [1, 2, 3, 4].map((w) => {
      const row = weeks.find((r: any) => Number(r.week) === w);
      return { week: `W${w}`, target: Math.round(weeklyTarget), actual: row ? Number(row.actual) : 0 };
    });

    return NextResponse.json({ target, actual, progress, daysLeft, daysInMonth, projectedMonthEnd, chart });
  } catch (error) {
    console.error('goals report error:', error);
    return NextResponse.json({ error: 'Failed to fetch goals data' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { target } = await req.json();
  if (typeof target !== 'number' || target < 0) {
    return NextResponse.json({ error: 'Invalid value' }, { status: 400 });
  }

  try {
    await sql`
      INSERT INTO theme_settings (key, value, updated_at)
      VALUES ('monthly_target', ${String(target)}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
