'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Wallet } from 'lucide-react';
import PaymentReviewQueue from '@/components/payments/PaymentReviewQueue';

export default function SupervisorPaymentsPage() {
  const t = useTranslations('payments');
  const locale = useLocale();
  return (
    <div className="sup-page">
      <div className="sup-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Wallet size={22} className="sup-page-icon" />
          <h1 className="sup-page-title">{t('title')}</h1>
        </div>
      </div>
      <p className="pv-page-sub">{t('subtitle')}</p>
      <PaymentReviewQueue locale={locale} />
    </div>
  );
}
