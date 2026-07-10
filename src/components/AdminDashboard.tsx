'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';
import AdminNavCard from './AdminNavCard';
import AdminSidebar from './AdminSidebar';

export default function AdminDashboard() {
  const t = useTranslations('admin');
  const tutorialStore = useTutorialStore();
  const tutorialUI = useTutorialOverlay('admin-tour');
  const completed = tutorialStore.completed;

  const NAV_ITEMS = [
    {
      icon: '📦',
      title: t('products'),
      description: t('productsDesc'),
      href: '/admin/products',
    },
    {
      icon: '🛒',
      title: t('orders'),
      description: t('ordersDesc'),
      href: '/admin/orders',
    },
    {
      icon: '👥',
      title: t('workers'),
      description: t('workersDesc'),
      href: '/admin/workers',
    },
    {
      icon: '📈',
      title: t('reports'),
      description: t('reportsDesc'),
      href: '/admin/reports',
    },
    {
      icon: '⚙️',
      title: t('settings'),
      description: t('settingsDesc'),
      href: '/admin/settings',
    },
  ];

  useEffect(() => {
    if (!completed.includes('admin-tour')) {
      tutorialStore.showTutorial('admin-tour');
    }
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
