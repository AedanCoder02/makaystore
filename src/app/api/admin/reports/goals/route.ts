import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import sql from '@/lib/db';
import { getPanelLocation } from '@/lib/location';

const DEFAULT_TARGETS: Record<string, number> = { daily_target: 357.14, weekly_target: 2500, monthly_target: 10000 };

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const location = await getPanelLocation();

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS theme_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    const [targetRows, dailyActualRow, weeklyActualRow, monthlyActualRow] = await Promise.all([
      sql`SELECT key, value FROM theme_settings WHERE key IN ('daily_target', 'weekly_target', 'monthly_target')`,
      sql`SELECT COALESCE(SUM(subtotal::numeric), 0) AS actual FROM seller_orders WHERE created_at >= CURRENT_DATE AND location = ${location}`,
      sql`SELECT COALESCE(SUM(subtotal::numeric), 0) AS actual FROM seller_orders WHERE created_at >= date_trunc('week', NOW()) AND location = ${location}`,
      sql`SELECT COALESCE(SUM(subtotal::numeric), 0) AS actual FROM seller_orders WHERE created_at >= date_trunc('month', NOW()) AND location = ${location}`,
    ]);

    const targetMap: Record<string, number> = { ...DEFAULT_TARGETS };
    for (const row of targetRows as unknown as { key: string; value: string }[]) targetMap[row.key] = Number(row.value);

    const build = (target: number, actual: number) => ({ target, actual, progress: target > 0 ? (actual / target) * 100 : 0 });

    const daily   = build(targetMap.daily_target,   Number((dailyActualRow as unknown as { actual: unknown }[])[0]?.actual)   || 0);
    const weekly  = build(targetMap.weekly_target,  Number((weeklyActualRow as unknown as { actual: unknown }[])[0]?.actual)  || 0);
    const monthly = build(targetMap.monthly_target, Number((monthlyActualRow as unknown as { actual: unknown }[])[0]?.actual) || 0);

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - now.getDate();
    const daysPassed = now.getDate();
    const dailyRate = daysPassed > 0 ? monthly.actual / daysPassed : 0;
    const projectedMonthEnd = dailyRate * daysInMonth;

    // Weekly breakdown for chart (unchanged — still based on monthly target)
    const weeks = await sql`
      SELECT
        CEIL(EXTRACT(DAY FROM created_at) / 7.0) AS week,
        SUM(subtotal::numeric) AS actual
      FROM seller_orders
      WHERE created_at >= date_trunc('month', NOW()) AND location = ${location}
      GROUP BY week
      ORDER BY week ASC
    `;
    const weeklyChartTarget = monthly.target / (daysInMonth / 7);
    const chart = [1, 2, 3, 4].map((w) => {
      const row = weeks.find((r: any) => Number(r.week) === w);
      return { week: `W${w}`, target: Math.round(weeklyChartTarget), actual: row ? Number(row.actual) : 0 };
    });

    // Backward-compatible top-level fields (monthly) + new per-period breakdown
    return NextResponse.json({
      target: monthly.target, actual: monthly.actual, progress: monthly.progress,
      daysLeft, daysInMonth, projectedMonthEnd, chart,
      daily, weekly, monthly,
    });
  } catch (error) {
    console.error('goals report error:', error);
    return NextResponse.json({ error: 'Failed to fetch goals data' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { target, period } = await req.json();
  if (typeof target !== 'number' || target < 0) {
    return NextResponse.json({ error: 'Invalid value' }, { status: 400 });
  }
  const key = period === 'daily' ? 'daily_target' : period === 'weekly' ? 'weekly_target' : 'monthly_target';

  try {
    await sql`
      INSERT INTO theme_settings (key, value, updated_at)
      VALUES (${key}, ${String(target)}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
