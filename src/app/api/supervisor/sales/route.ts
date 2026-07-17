import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await sql`
    SELECT seller_id, COUNT(*) AS order_count, SUM(subtotal::numeric) AS revenue
    FROM seller_orders
    WHERE created_at::date = CURRENT_DATE
    GROUP BY seller_id
  `.catch(() => []);

  const sellerIds = rows.map((r) => r.seller_id as string);
  const nameMap: Record<string, string> = {};
  if (sellerIds.length > 0) {
    const client = await clerkClient();
    await Promise.all(
      sellerIds.map(async (id) => {
        try {
          const u = await client.users.getUser(id);
          nameMap[id] = u.fullName ?? u.firstName ?? 'Seller';
        } catch {
          nameMap[id] = 'Seller';
        }
      })
    );
  }

  const sales = rows.map((r, i) => ({
    workerId: r.seller_id,
    name: nameMap[r.seller_id as string] ?? 'Seller',
    unitsSold: Number(r.order_count),
    revenue: Number(r.revenue) || 0,
    conversionRate: 0,
    dailyTarget: 1200,
  }));

  return NextResponse.json(sales);
}
