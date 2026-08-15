import { auth } from '@clerk/nextjs/server';
import sql from '@/lib/db';
import SellerDashboard from '@/components/seller/SellerDashboard';

export const metadata = { title: 'Seller Dashboard — Makay' };

export default async function SellerDashboardPage() {
  const { userId } = await auth();

  // Ensure per-user commission override table exists
  await sql`
    CREATE TABLE IF NOT EXISTS seller_commission_overrides (
      seller_id TEXT PRIMARY KEY,
      pct NUMERIC(5,2) NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `.catch(() => {});

  const [ordersResult, stockResult, globalPctRows, overrideRows] = await Promise.all([
    sql`SELECT * FROM seller_orders WHERE seller_id = ${userId!} ORDER BY created_at DESC LIMIT 10`,
    sql`SELECT COUNT(*) as total, SUM(quantity) as units FROM product_stock`,
    sql`SELECT value FROM theme_settings WHERE key = 'seller_commission_pct'`.catch(() => []),
    sql`SELECT pct FROM seller_commission_overrides WHERE seller_id = ${userId!}`.catch(() => []),
  ]);

  const commissionPct = overrideRows.length > 0
    ? Number(overrideRows[0].pct)
    : globalPctRows.length > 0 ? Number(globalPctRows[0].value) : 0;

  return (
    <SellerDashboard
      recentOrders={ordersResult as any[]}
      stockSummary={{ total: Number(stockResult[0]?.total ?? 0), units: Number(stockResult[0]?.units ?? 0) }}
      commissionPct={commissionPct}
    />
  );
}
