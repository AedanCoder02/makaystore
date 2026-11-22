import { requireAccess } from '@/lib/apiAuth';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import sql from '@/lib/db';
import { getPanelLocation } from '@/lib/location.server';
import { getReportSettings, setReportSetting } from '@/lib/reportSettings';

export async function GET() {
  const gate = await requireAccess('staff');
  if (gate instanceof NextResponse) return gate;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const location = await getPanelLocation();

  try {
    const [targetMap, dailyActualRow, weeklyActualRow, monthlyActualRow] = await Promise.all([
      getReportSettings(),
      sql`SELECT COALESCE(SUM(subtotal::numeric), 0) AS actual FROM seller_orders WHERE created_at >= CURRENT_DATE AND location = ${location}`,
      sql`SELECT COALESCE(SUM(subtotal::numeric), 0) AS actual FROM seller_orders WHERE created_at >= date_trunc('week', NOW()) AND location = ${location}`,
      sql`SELECT COALESCE(SUM(subtotal::numeric), 0) AS actual FROM seller_orders WHERE created_at >= date_trunc('month', NOW()) AND location = ${location}`,
    ]);


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
  const gate = await requireAccess('admin');
  if (gate instanceof NextResponse) return gate;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { target, period } = await req.json();
  if (typeof target !== 'number' || target < 0) {
    return NextResponse.json({ error: 'Invalid value' }, { status: 400 });
  }
  const key = period === 'daily' ? 'daily_target' : period === 'weekly' ? 'weekly_target' : 'monthly_target';

  try {
    await setReportSetting(key, target, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
