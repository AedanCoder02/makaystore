import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [productCount, orderCount, activityCount] = await Promise.all([
    sql`SELECT COUNT(*) AS count FROM products WHERE status = 'active'`.catch(() => [{ count: 0 }]),
    sql`SELECT COUNT(*) AS count FROM seller_orders WHERE created_at >= date_trunc('month', NOW())`.catch(() => [{ count: 0 }]),
    sql`SELECT COUNT(DISTINCT seller_id) AS count FROM activities WHERE type = 'clock-in' AND created_at::date = CURRENT_DATE`.catch(() => [{ count: 0 }]),
  ]);

  return NextResponse.json({
    totalProducts: Number(productCount[0]?.count ?? 0),
    ordersThisMonth: Number(orderCount[0]?.count ?? 0),
    activeSellersToday: Number(activityCount[0]?.count ?? 0),
  });
}
