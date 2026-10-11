import { auth } from '@clerk/nextjs/server';
import sql from '@/lib/db';
import SellerDashboard from '@/components/seller/SellerDashboard';
import { getPanelLocation } from '@/lib/location.server';

export const metadata = { title: 'Seller Dashboard — Makay' };

export default async function SellerDashboardPage() {
  const { userId } = await auth();
  const location = await getPanelLocation();

  // Ensure per-user commission override table exists
  await sql`
    CREATE TABLE IF NOT EXISTS seller_commission_overrides (
      seller_id TEXT PRIMARY KEY,
      pct NUMERIC(5,2) NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `.catch(() => {});

  const [ordersResult, globalPctRows, overrideRows, lowStockRows] = await Promise.all([
    sql`SELECT * FROM seller_orders WHERE seller_id = ${userId!} AND location = ${location} ORDER BY created_at DESC LIMIT 10`,
    sql`SELECT value FROM theme_settings WHERE key = 'seller_commission_pct'`.catch(() => []),
    sql`SELECT pct FROM seller_commission_overrides WHERE seller_id = ${userId!}`.catch(() => []),
    sql`
      SELECT p.id, p.title, COALESCE(ps.quantity, p.stock) AS quantity
      FROM products p
      LEFT JOIN product_stock ps ON ps.product_id = p.id
      WHERE p.status = 'active' AND p.location = ${location} AND COALESCE(ps.quantity, p.stock) < 10
      ORDER BY COALESCE(ps.quantity, p.stock) ASC
      LIMIT 8
    `.catch(() => []),
  ]);

  const commissionPct = overrideRows.length > 0
    ? Number(overrideRows[0].pct)
    : globalPctRows.length > 0 ? Number(globalPctRows[0].value) : 0;

  return (
    <SellerDashboard
      recentOrders={ordersResult as any[]}
      commissionPct={commissionPct}
      lowStock={lowStockRows.map((r: any) => ({ id: r.id, title: r.title, quantity: Number(r.quantity) }))}
    />
  );
}
