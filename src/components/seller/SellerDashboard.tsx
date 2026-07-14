'use client';

import Link from 'next/link';
import { ShoppingBag, Package, Boxes, TrendingUp } from 'lucide-react';

interface Order { id: number; client_name: string; subtotal: string; created_at: string; status: string; items: any[] }

export default function SellerDashboard({ recentOrders, stockSummary }: {
  recentOrders: Order[];
  stockSummary: { total: number; units: number };
}) {
  const totalRevenue = recentOrders.reduce((s, o) => s + Number(o.subtotal), 0);

  return (
    <div className="seller-page">
      <div className="seller-page-header">
        <h1 className="seller-page-title">Dashboard</h1>
        <p className="seller-page-sub">Welcome back — here&apos;s your overview.</p>
      </div>

      <div className="seller-stats-grid">
        <div className="seller-stat-card">
          <TrendingUp size={22} className="seller-stat-icon" />
          <span className="seller-stat-value">${totalRevenue.toFixed(2)}</span>
          <span className="seller-stat-label">Total Revenue</span>
        </div>
        <div className="seller-stat-card">
          <ShoppingBag size={22} className="seller-stat-icon" />
          <span className="seller-stat-value">{recentOrders.length}</span>
          <span className="seller-stat-label">Recent Orders</span>
        </div>
        <div className="seller-stat-card">
          <Package size={22} className="seller-stat-icon" />
          <span className="seller-stat-value">{stockSummary.total}</span>
          <span className="seller-stat-label">Products Tracked</span>
        </div>
        <div className="seller-stat-card">
          <Boxes size={22} className="seller-stat-icon" />
          <span className="seller-stat-value">{stockSummary.units}</span>
          <span className="seller-stat-label">Units in Stock</span>
        </div>
      </div>

      <div className="seller-quick-actions">
        <h2 className="seller-section-title">Quick Actions</h2>
        <div className="seller-action-grid">
          <Link href="/seller/sell" className="seller-action-card primary">
            <ShoppingBag size={28} />
            <span>Sell to Client</span>
            <p>Process a sale on behalf of a customer</p>
          </Link>
          <Link href="/seller/products" className="seller-action-card">
            <Package size={28} />
            <span>Manage Products</span>
            <p>Edit prices, descriptions and images</p>
          </Link>
          <Link href="/seller/stock" className="seller-action-card">
            <Boxes size={28} />
            <span>Update Stock</span>
            <p>Adjust inventory quantities</p>
          </Link>
        </div>
      </div>

      {recentOrders.length > 0 && (
        <div className="seller-recent">
          <h2 className="seller-section-title">Recent Sales</h2>
          <div className="seller-orders-list">
            {recentOrders.map(o => (
              <div key={o.id} className="seller-order-row">
                <div className="seller-order-client">
                  <span className="seller-order-name">{o.client_name || 'Client'}</span>
                  <span className="seller-order-items">{Array.isArray(o.items) ? o.items.length : JSON.parse(o.items as any).length} item(s)</span>
                </div>
                <div className="seller-order-meta">
                  <span className="seller-order-amount">${Number(o.subtotal).toFixed(2)}</span>
                  <span className="seller-order-date">{new Date(o.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
