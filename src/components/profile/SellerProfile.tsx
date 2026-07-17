'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { LayoutDashboard, Package, Clock, Box, TrendingUp, ShoppingBag } from 'lucide-react';
import '@/styles/profile.css';

interface Order {
  id: number;
  client_name: string;
  subtotal: number;
  created_at: string;
  payment_method: string;
}

interface ActivitySummary {
  clockedIn: boolean;
  clockInTime: string | null;
  hoursWorked: number;
  todaySessions: number;
}

export default function SellerProfile() {
  const { user, isLoaded } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activity, setActivity] = useState<ActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;
    Promise.all([
      fetch('/api/seller/orders').then((r) => r.json()).catch(() => []),
      fetch('/api/seller/activity').then((r) => r.json()).catch(() => null),
    ]).then(([ordersData, activityData]) => {
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setActivity(activityData);
      setLoading(false);
    });
  }, [isLoaded, user]);

  const now = new Date();
  const monthOrders = orders.filter((o) => {
    const d = new Date(o.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const revenue = monthOrders.reduce((s, o) => s + Number(o.subtotal), 0);
  const avgOrder = monthOrders.length > 0 ? revenue / monthOrders.length : 0;

  const topProducts: Record<string, number> = {};
  orders.forEach((o) => {
    // client_name used as proxy since items are JSON blobs — tally by client
  });

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString([], { month: 'long', year: 'numeric' })
    : '—';

  if (!isLoaded || loading) {
    return <div className="profile-loading">Loading…</div>;
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-avatar-wrap">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="avatar" className="profile-avatar" />
          ) : (
            <div className="profile-avatar-placeholder">
              {user?.firstName?.[0] ?? '?'}
            </div>
          )}
        </div>
        <div className="profile-header-info">
          <h1 className="profile-name">{user?.fullName ?? user?.firstName ?? 'Seller'}</h1>
          <span className="profile-role-badge" style={{ background: '#D4AF37' }}>Seller</span>
          <p className="profile-member-since">Member since {memberSince}</p>
          <p className="profile-email">{user?.primaryEmailAddress?.emailAddress}</p>
        </div>
      </div>

      {/* Sales stats */}
      <section className="profile-section">
        <h2 className="profile-section-title">
          <TrendingUp size={18} /> Sales This Month
        </h2>
        <div className="profile-stats-grid">
          <div className="profile-stat-card">
            <p className="profile-stat-value">${revenue.toFixed(2)}</p>
            <p className="profile-stat-label">Revenue</p>
          </div>
          <div className="profile-stat-card">
            <p className="profile-stat-value">{monthOrders.length}</p>
            <p className="profile-stat-label">Orders</p>
          </div>
          <div className="profile-stat-card">
            <p className="profile-stat-value">${avgOrder.toFixed(2)}</p>
            <p className="profile-stat-label">Avg Order</p>
          </div>
        </div>
      </section>

      {/* Today's shift */}
      <section className="profile-section">
        <h2 className="profile-section-title">
          <Clock size={18} /> Today's Shift
        </h2>
        <div className="profile-shift-card">
          <div className={`activity-status-dot ${activity?.clockedIn ? 'active' : ''}`} />
          <div>
            <p className="profile-shift-status">
              {activity?.clockedIn ? 'Clocked in' : 'Not clocked in'}
            </p>
            {activity?.clockInTime && (
              <p className="profile-shift-time">
                Since {new Date(activity.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
            <p className="profile-shift-hours">{activity?.hoursWorked ?? 0}h worked today</p>
          </div>
        </div>
      </section>

      {/* Recent orders */}
      <section className="profile-section">
        <h2 className="profile-section-title">
          <ShoppingBag size={18} /> Recent Orders
        </h2>
        {orders.length === 0 ? (
          <p className="profile-empty">No orders yet.</p>
        ) : (
          <div className="profile-orders-list">
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="profile-order-row">
                <div>
                  <p className="profile-order-client">{o.client_name || 'Client'}</p>
                  <p className="profile-order-date">
                    {new Date(o.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <span className="profile-order-amount">${Number(o.subtotal).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick links */}
      <section className="profile-section">
        <h2 className="profile-section-title">Quick Links</h2>
        <div className="profile-quick-links">
          <Link href="/seller/dashboard" className="profile-quick-link">
            <LayoutDashboard size={16} /> Dashboard
          </Link>
          <Link href="/seller/products" className="profile-quick-link">
            <Package size={16} /> Products
          </Link>
          <Link href="/seller/activity" className="profile-quick-link">
            <Clock size={16} /> My Activity
          </Link>
          <Link href="/seller/products/create-3d" className="profile-quick-link">
            <Box size={16} /> 3D Models
          </Link>
        </div>
      </section>
    </div>
  );
}
