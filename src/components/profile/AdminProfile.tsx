'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { LayoutDashboard, Package, BarChart2, RefreshCw, Palette, Users } from 'lucide-react';
import '@/styles/profile.css';

interface AdminStats {
  totalProducts: number;
  ordersThisMonth: number;
  totalRevenue: number;
  activeSellerCount: number;
}

export default function AdminProfile() {
  const { user, isLoaded } = useUser();
  const [stats, setStats] = useState<AdminStats>({
    totalProducts: 0,
    ordersThisMonth: 0,
    totalRevenue: 0,
    activeSellerCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;
    Promise.all([
      fetch('/api/products').then((r) => r.json()).catch(() => []),
      fetch('/api/seller/orders').then((r) => r.json()).catch(() => []),
    ]).then(([products, orders]) => {
      const productList = Array.isArray(products) ? products : [];
      const orderList = Array.isArray(orders) ? orders : [];
      const now = new Date();
      const monthOrders = orderList.filter((o: { created_at: string }) => {
        const d = new Date(o.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const revenue = monthOrders.reduce(
        (s: number, o: { subtotal: number }) => s + Number(o.subtotal),
        0
      );
      setStats({
        totalProducts: productList.length,
        ordersThisMonth: monthOrders.length,
        totalRevenue: revenue,
        activeSellerCount: 0,
      });
      setLoading(false);
    });
  }, [isLoaded, user]);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString([], { month: 'long', year: 'numeric' })
    : '—';

  if (!isLoaded || loading) return <div className="profile-loading">Loading…</div>;

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-avatar-wrap">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="avatar" className="profile-avatar" />
          ) : (
            <div className="profile-avatar-placeholder">{user?.firstName?.[0] ?? '?'}</div>
          )}
        </div>
        <div className="profile-header-info">
          <h1 className="profile-name">{user?.fullName ?? user?.firstName ?? 'Admin'}</h1>
          <span className="profile-role-badge" style={{ background: '#7C3AED' }}>Administrator</span>
          <p className="profile-member-since">Member since {memberSince}</p>
          <p className="profile-email">{user?.primaryEmailAddress?.emailAddress}</p>
        </div>
      </div>

      {/* System health */}
      <section className="profile-section">
        <h2 className="profile-section-title"><BarChart2 size={18} /> System Health</h2>
        <div className="profile-stats-grid">
          <div className="profile-stat-card">
            <p className="profile-stat-value">{stats.totalProducts}</p>
            <p className="profile-stat-label">Products in DB</p>
          </div>
          <div className="profile-stat-card">
            <p className="profile-stat-value">{stats.ordersThisMonth}</p>
            <p className="profile-stat-label">Orders This Month</p>
          </div>
          <div className="profile-stat-card">
            <p className="profile-stat-value">${stats.totalRevenue.toFixed(0)}</p>
            <p className="profile-stat-label">Monthly Revenue</p>
          </div>
        </div>
      </section>

      {/* Full access badge */}
      <section className="profile-section">
        <h2 className="profile-section-title"><Users size={18} /> Access Level</h2>
        <div className="profile-permissions">
          <p className="profile-permission allow">Full store access — all panels</p>
          <p className="profile-permission allow">Can view, edit, and delete all data</p>
          <p className="profile-permission allow">Can change user roles</p>
          <p className="profile-permission allow">Can publish themes and marketing pages</p>
          <p className="profile-permission allow">Can access financial reports and rotation</p>
        </div>
      </section>

      {/* Quick links */}
      <section className="profile-section">
        <h2 className="profile-section-title">Quick Links</h2>
        <div className="profile-quick-links">
          <Link href="/admin" className="profile-quick-link">
            <LayoutDashboard size={16} /> Admin Dashboard
          </Link>
          <Link href="/admin/products/create-3d" className="profile-quick-link">
            <Package size={16} /> Products
          </Link>
          <Link href="/admin/reports" className="profile-quick-link">
            <BarChart2 size={16} /> Reports
          </Link>
          <Link href="/admin/rotation" className="profile-quick-link">
            <RefreshCw size={16} /> Rotation
          </Link>
          <Link href="/admin/theme" className="profile-quick-link">
            <Palette size={16} /> Theme Editor
          </Link>
        </div>
      </section>
    </div>
  );
}
