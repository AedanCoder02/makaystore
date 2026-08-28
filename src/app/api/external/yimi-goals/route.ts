import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export const runtime = 'nodejs';

const DEFAULTS = {
  vendedorGoalDaily: 0,
  vendedorGoalMonthly: 0,
  categoryGoals: {} as Record<string, number>,
  monthlyPrize: '',
};

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env.YIMI_REPORT_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await sql`
    CREATE TABLE IF NOT EXISTS yimi_report_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  const rows = await sql`
    SELECT key, value FROM yimi_report_settings
    WHERE key IN ('yimi_vendedor_goal_daily', 'yimi_vendedor_goal_monthly', 'yimi_category_goals', 'yimi_monthly_prize')
  `;

  const map = new Map((rows as unknown as { key: string; value: string }[]).map(r => [r.key, r.value]));

  let categoryGoals = DEFAULTS.categoryGoals;
  const rawCategoryGoals = map.get('yimi_category_goals');
  if (rawCategoryGoals) {
    try {
      categoryGoals = JSON.parse(rawCategoryGoals);
    } catch {
      categoryGoals = DEFAULTS.categoryGoals;
    }
  }

  return NextResponse.json({
    vendedorGoalDaily: Number(map.get('yimi_vendedor_goal_daily') ?? DEFAULTS.vendedorGoalDaily),
    vendedorGoalMonthly: Number(map.get('yimi_vendedor_goal_monthly') ?? DEFAULTS.vendedorGoalMonthly),
    categoryGoals,
    monthlyPrize: map.get('yimi_monthly_prize') ?? DEFAULTS.monthlyPrize,
  });
}
