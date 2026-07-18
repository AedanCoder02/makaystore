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

  const NAV_ITEMS = [
    { icon: '📦', title: t('products'),  description: t('productsDesc'),  href: '/admin/products/create-3d' },
    { icon: '🛒', title: t('orders'),    description: t('ordersDesc'),    href: '/admin/orders' },
    { icon: '👥', title: t('users'),     description: t('usersDesc'),     href: '/admin/users' },
    { icon: '📈', title: t('reports'),   description: t('reportsDesc'),   href: '/admin/reports' },
    { icon: '🔄', title: t('rotation'),  description: t('rotationDesc'),  href: '/admin/rotation' },
    { icon: '🪄', title: t('studio'),    description: t('studioDesc'),    href: '/admin/studio' },
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
