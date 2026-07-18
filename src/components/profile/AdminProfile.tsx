'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { LayoutDashboard, BarChart2, Users, Settings, Check, Pencil, ShoppingBag, Wand2 } from 'lucide-react';
import '@/styles/profile.css';

interface AdminStats {
  totalProducts: number;
  ordersThisMonth: number;
  totalRevenue: number;
  pendingOrders: number;
}

interface StoreConfig {
  storeName: string;
  contactEmail: string;
  lowStockThreshold: number;
}

const DEFAULT_CONFIG: StoreConfig = {
  storeName: 'Makay Store',
  contactEmail: '',
  lowStockThreshold: 5,
};

export default function AdminProfile() {
  const { user, isLoaded } = useUser();
  const [stats, setStats] = useState<AdminStats>({ totalProducts: 0, ordersThisMonth: 0, totalRevenue: 0, pendingOrders: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Edit profile state
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameSaving, setNameSaving] = useState(false);

  // Config state
  const [config, setConfig] = useState<StoreConfig>(DEFAULT_CONFIG);
  const [configDraft, setConfigDraft] = useState<StoreConfig>(DEFAULT_CONFIG);
  const [configSaving, setConfigSaving] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    setNameDraft(user.fullName ?? user.firstName ?? '');

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
      const revenue = monthOrders.reduce((s: number, o: { subtotal: number }) => s + Number(o.subtotal), 0);
      const pending = orderList.filter((o: { status: string }) => o.status === 'placed' || o.status === 'confirmed').length;
      setStats({ totalProducts: productList.length, ordersThisMonth: monthOrders.length, totalRevenue: revenue, pendingOrders: pending });
      setStatsLoading(false);
    });

    // Load store config from Clerk publicMetadata
    const meta = user.publicMetadata as Record<string, unknown>;
    const stored: StoreConfig = {
      storeName: (meta.storeName as string) ?? DEFAULT_CONFIG.storeName,
      contactEmail: (meta.contactEmail as string) ?? user.primaryEmailAddress?.emailAddress ?? '',
      lowStockThreshold: (meta.lowStockThreshold as number) ?? DEFAULT_CONFIG.lowStockThreshold,
    };
    setConfig(stored);
    setConfigDraft(stored);
  }, [isLoaded, user]);

  async function saveName() {
    if (!user) return;
    setNameSaving(true);
    const parts = nameDraft.trim().split(' ');
    await user.update({ firstName: parts[0], lastName: parts.slice(1).join(' ') || undefined });
    setEditingName(false);
    setNameSaving(false);
  }

  async function saveConfig() {
    if (!user) return;
    setConfigSaving(true);
    await user.update({ unsafeMetadata: { ...user.unsafeMetadata, ...configDraft } });
    setConfig(configDraft);
    setConfigSaving(false);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2500);
  }

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString([], { month: 'long', year: 'numeric' })
    : '—';

  if (!isLoaded) return <div className="profile-loading">Loading…</div>;

  return (
    <div className="profile-page">

      {/* ── Header ── */}
      <div className="profile-header">
        <div className="profile-avatar-wrap">
          {user?.imageUrl
            ? <img src={user.imageUrl} alt="avatar" className="profile-avatar" />
            : <div className="profile-avatar-placeholder">{user?.firstName?.[0] ?? '?'}</div>}
        </div>
        <div className="profile-header-info">
          {editingName ? (
            <div className="profile-name-edit">
              <input
                className="profile-name-input"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
                autoFocus
              />
              <button className="profile-save-btn" onClick={saveName} disabled={nameSaving}>
                {nameSaving ? '…' : <Check size={14} />}
              </button>
              <button className="profile-cancel-btn" onClick={() => { setEditingName(false); setNameDraft(user?.fullName ?? ''); }}>✕</button>
            </div>
          ) : (
            <div className="profile-name-row">
              <h1 className="profile-name">{user?.fullName ?? user?.firstName ?? 'Admin'}</h1>
              <button className="profile-edit-btn" onClick={() => setEditingName(true)} title="Edit name">
                <Pencil size={13} />
              </button>
            </div>
          )}
          <span className="profile-role-badge" style={{ background: '#7C3AED' }}>Administrator</span>
          <p className="profile-member-since">Member since {memberSince}</p>
          <p className="profile-email">{user?.primaryEmailAddress?.emailAddress}</p>
        </div>
      </div>

      {/* ── System Health ── */}
      <section className="profile-section">
        <h2 className="profile-section-title"><BarChart2 size={18} /> System Health</h2>
        <div className="profile-stats-grid">
          <div className="profile-stat-card">
            <p className="profile-stat-value">{statsLoading ? '…' : stats.totalProducts}</p>
            <p className="profile-stat-label">Products in DB</p>
          </div>
          <div className="profile-stat-card">
            <p className="profile-stat-value">{statsLoading ? '…' : stats.ordersThisMonth}</p>
            <p className="profile-stat-label">Orders This Month</p>
          </div>
          <div className="profile-stat-card">
            <p className="profile-stat-value">{statsLoading ? '…' : `$${stats.totalRevenue.toFixed(0)}`}</p>
            <p className="profile-stat-label">Monthly Revenue</p>
          </div>
          <div className={`profile-stat-card${stats.pendingOrders > 0 ? ' profile-stat-alert' : ''}`}>
            <p className="profile-stat-value">{statsLoading ? '…' : stats.pendingOrders}</p>
            <p className="profile-stat-label">Pending Orders</p>
          </div>
        </div>
      </section>

      {/* ── Access Level ── */}
      <section className="profile-section">
        <h2 className="profile-section-title"><Users size={18} /> Access Level</h2>
        <div className="profile-permissions">
          <p className="profile-permission allow">Full store access — all panels</p>
          <p className="profile-permission allow">Can view, edit, and delete all data</p>
          <p className="profile-permission allow">Can change user roles</p>
          <p className="profile-permission allow">Can publish storefront and studio changes</p>
          <p className="profile-permission allow">Can access financial reports</p>
        </div>
      </section>

      {/* ── Configuration ── */}
      <section className="profile-section">
        <h2 className="profile-section-title"><Settings size={18} /> Configuration</h2>
        <div className="profile-config-form">
          <div className="profile-config-row">
            <label className="profile-config-label">Store Name</label>
            <input
              className="profile-config-input"
              value={configDraft.storeName}
              onChange={(e) => setConfigDraft((d) => ({ ...d, storeName: e.target.value }))}
            />
          </div>
          <div className="profile-config-row">
            <label className="profile-config-label">Contact Email</label>
            <input
              className="profile-config-input"
              type="email"
              value={configDraft.contactEmail}
              onChange={(e) => setConfigDraft((d) => ({ ...d, contactEmail: e.target.value }))}
            />
          </div>
          <div className="profile-config-row">
            <label className="profile-config-label">Low Stock Alert (units)</label>
            <input
              className="profile-config-input profile-config-input--short"
              type="number"
              min={1}
              value={configDraft.lowStockThreshold}
              onChange={(e) => setConfigDraft((d) => ({ ...d, lowStockThreshold: Number(e.target.value) }))}
            />
          </div>
          <div className="profile-config-actions">
            <button className="profile-save-config-btn" onClick={saveConfig} disabled={configSaving}>
              {configSaving ? 'Saving…' : configSaved ? '✓ Saved' : 'Save Settings'}
            </button>
            <a href="/user" className="profile-clerk-link">Change Password →</a>
          </div>
        </div>
      </section>

      {/* ── Quick Links ── */}
      <section className="profile-section">
        <h2 className="profile-section-title">Quick Links</h2>
        <div className="profile-quick-links">
          <Link href="/admin/dashboard" className="profile-quick-link">
            <LayoutDashboard size={16} /> Admin Dashboard
          </Link>
          <Link href="/admin/reports" className="profile-quick-link">
            <BarChart2 size={16} /> Reports
          </Link>
          <Link href="/admin/orders" className="profile-quick-link">
            <ShoppingBag size={16} /> Orders
          </Link>
          <Link href="/seller/studio" className="profile-quick-link">
            <Wand2 size={16} /> Studio
          </Link>
        </div>
      </section>
    </div>
  );
}
