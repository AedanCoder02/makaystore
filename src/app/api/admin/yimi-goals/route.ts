import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import sql from '@/lib/db';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS yimi_report_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureTable();
  const rows = await sql`
    SELECT key, value FROM yimi_report_settings
    WHERE key IN ('yimi_vendedor_goal_daily', 'yimi_vendedor_goal_monthly', 'yimi_category_goals', 'yimi_monthly_prize')
  `;
  const map = new Map((rows as unknown as { key: string; value: string }[]).map(r => [r.key, r.value]));

  let categoryGoals: Record<string, number> = {};
  const raw = map.get('yimi_category_goals');
  if (raw) {
    try { categoryGoals = JSON.parse(raw); } catch { categoryGoals = {}; }
  }

  return NextResponse.json({
    vendedorGoalDaily: Number(map.get('yimi_vendedor_goal_daily') ?? 0),
    vendedorGoalMonthly: Number(map.get('yimi_vendedor_goal_monthly') ?? 0),
    categoryGoals,
    monthlyPrize: map.get('yimi_monthly_prize') ?? '',
  });
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { vendedorGoalDaily, vendedorGoalMonthly, categoryGoals, monthlyPrize } = body;

  if (typeof vendedorGoalDaily !== 'number' || vendedorGoalDaily < 0) {
    return NextResponse.json({ error: 'Invalid vendedorGoalDaily' }, { status: 400 });
  }
  if (typeof vendedorGoalMonthly !== 'number' || vendedorGoalMonthly < 0) {
    return NextResponse.json({ error: 'Invalid vendedorGoalMonthly' }, { status: 400 });
  }
  if (typeof categoryGoals !== 'object' || categoryGoals === null || Array.isArray(categoryGoals)) {
    return NextResponse.json({ error: 'Invalid categoryGoals' }, { status: 400 });
  }
  if (typeof monthlyPrize !== 'string') {
    return NextResponse.json({ error: 'Invalid monthlyPrize' }, { status: 400 });
  }

  await ensureTable();

  const rows: [string, string][] = [
    ['yimi_vendedor_goal_daily', String(vendedorGoalDaily)],
    ['yimi_vendedor_goal_monthly', String(vendedorGoalMonthly)],
    ['yimi_category_goals', JSON.stringify(categoryGoals)],
    ['yimi_monthly_prize', monthlyPrize],
  ];

  for (const [key, value] of rows) {
    await sql`
      INSERT INTO yimi_report_settings (key, value, updated_at)
      VALUES (${key}, ${value}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `;
  }

  return NextResponse.json({ success: true });
}
