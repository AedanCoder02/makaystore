'use client';

import { useLocale, useTranslations } from 'next-intl';
import PaymentReviewQueue from '@/components/payments/PaymentReviewQueue';

export default function SellerPaymentsPage() {
  const t = useTranslations('payments');
  const locale = useLocale();
  return (
    <div className="seller-page">
      <div className="seller-page-header">
        <h1 className="seller-page-title">{t('title')}</h1>
      </div>
      <p className="pv-page-sub">{t('subtitle')}</p>
      <PaymentReviewQueue locale={locale} />
    </div>
  );
}
