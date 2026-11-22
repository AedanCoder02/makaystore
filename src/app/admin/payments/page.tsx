'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Wallet } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import PaymentReviewQueue from '@/components/payments/PaymentReviewQueue';
import PaymentSettingsForm from '@/components/payments/PaymentSettingsForm';

export default function AdminPaymentsPage() {
  const t = useTranslations('payments');
  const locale = useLocale();
  const [view, setView] = useState<'queue' | 'settings'>('queue');

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="dashboard-header pv-page-head">
          <Wallet size={22} />
          <h1>{t('title')}</h1>
        </div>
        <p className="pv-page-sub">{t('subtitle')}</p>

        <div className="pv-tabs" role="tablist" style={{ marginBottom: '1.25rem' }}>
          <button role="tab" aria-selected={view === 'queue'} className={`pv-tab${view === 'queue' ? ' is-active' : ''}`} onClick={() => setView('queue')}>
            {t('tabs.pending_verification')}
          </button>
          <button role="tab" aria-selected={view === 'settings'} className={`pv-tab${view === 'settings' ? ' is-active' : ''}`} onClick={() => setView('settings')}>
            {t('tabs.settings')}
          </button>
        </div>

        {view === 'queue' ? <PaymentReviewQueue locale={locale} /> : <PaymentSettingsForm />}
      </main>
    </div>
  );
}
