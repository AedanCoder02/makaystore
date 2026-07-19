import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

// Admin/supervisor: membership distribution + recent sales
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [distribution, recent, revenue] = await Promise.all([
    sql`
      SELECT membership_tier AS tier, COUNT(*) AS count
      FROM user_profiles
      GROUP BY membership_tier
      ORDER BY count DESC
    `.catch(() => []),

    sql`
      SELECT * FROM membership_sales
      ORDER BY sold_at DESC LIMIT 20
    `.catch(() => []),

    sql`
      SELECT
        tier,
        COUNT(*) AS sales,
        SUM(price::numeric) AS revenue
      FROM membership_sales
      GROUP BY tier
      ORDER BY revenue DESC
    `.catch(() => []),
  ]);

  return NextResponse.json({ distribution, recent, revenue });
}
