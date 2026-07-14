import { auth } from '@clerk/nextjs/server';
import sql from '@/lib/db';
import SellerDashboard from '@/components/seller/SellerDashboard';

export const metadata = { title: 'Seller Dashboard — Makay' };

export default async function SellerDashboardPage() {
  const { userId } = await auth();

  const [ordersResult, stockResult] = await Promise.all([
    sql`SELECT * FROM seller_orders WHERE seller_id = ${userId!} ORDER BY created_at DESC LIMIT 10`,
    sql`SELECT COUNT(*) as total, SUM(quantity) as units FROM product_stock`,
  ]);

  return (
    <SellerDashboard
      recentOrders={ordersResult as any[]}
      stockSummary={{ total: Number(stockResult[0]?.total ?? 0), units: Number(stockResult[0]?.units ?? 0) }}
    />
  );
}
