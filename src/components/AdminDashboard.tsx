'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Package, ShoppingBag, Users } from 'lucide-react';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';
import AdminNavCard from './AdminNavCard';
import AdminSidebar from './AdminSidebar';

interface AdminStats {
  totalProducts: number;
  ordersThisMonth: number;
  activeSellersToday: number;
}

export default function AdminDashboard() {
  const t = useTranslations('admin');
  const tutorialStore = useTutorialStore();
  const tutorialUI = useTutorialOverlay('admin-tour');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedDone, setSeedDone] = useState(false);

  async function seedMemberships() {
    setSeeding(true);
    await fetch('/api/memberships/seed', { method: 'POST' }).catch(() => {});
    setSeeding(false);
    setSeedDone(true);
    setTimeout(() => setSeedDone(false), 3000);
  }

  const NAV_ITEMS = [
    { icon: '🛒', title: t('orders'),       description: t('ordersDesc'),       href: '/admin/orders' },
    { icon: '👥', title: t('users'),        description: t('usersDesc'),        href: '/admin/users' },
    { icon: '📈', title: t('reports'),      description: t('reportsDesc'),      href: '/admin/reports' },
    { icon: '📅', title: 'Events',          description: 'Manage beach club events and tickets', href: '/admin/events' },
    { icon: '👑', title: 'Memberships',     description: 'Membership sales, tiers & analytics', href: '/admin/memberships' },
  ];

  useEffect(() => {
    if (!tutorialStore.isCompleted('admin-tour')) {
      tutorialStore.showTutorial('admin-tour');
    }
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <div className="dashboard-header">
          <h1>{t('dashboard')}</h1>
          <button
            className="help-button"
            onClick={() => tutorialStore.showTutorial('admin-tour')}
            aria-label={t('showTutorial')}
            title={t('help')}
          >
            ?
          </button>
        </div>

        {/* Live stats strip */}
        {stats && (
          <div className="admin-stats-strip">
            <div className="admin-stat-chip">
              <Package size={15} />
              <span>{stats.totalProducts} products</span>
            </div>
            <div className="admin-stat-chip">
              <ShoppingBag size={15} />
              <span>{stats.ordersThisMonth} orders this month</span>
            </div>
            <div className="admin-stat-chip">
              <Users size={15} />
              <span>{stats.activeSellersToday} sellers active today</span>
            </div>
          </div>
        )}

        <p className="dashboard-welcome">{t('welcome')}</p>

        {/* One-time membership product seeder */}
        <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '0.85rem', color: '#92400e', margin: 0 }}>Membership Products</p>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: '#a16207', margin: 0 }}>Seed Bronze, Silver & Gold as purchasable products in the catalog.</p>
          </div>
          <button onClick={seedMemberships} disabled={seeding} style={{ padding: '0.5rem 1.25rem', background: seedDone ? '#065f46' : '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.2s' }}>
            {seeding ? 'Seeding…' : seedDone ? '✓ Done' : 'Seed Memberships'}
          </button>
        </div>

        <div className="dashboard-grid">
          {NAV_ITEMS.map((item) => (
            <AdminNavCard
              key={item.href}
              icon={item.icon}
              title={item.title}
              description={item.description}
              href={item.href}
            />
          ))}
        </div>

        {tutorialUI}
      </main>
    </div>
  );
}
