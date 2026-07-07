'use client';

import { useTranslations } from 'next-intl';

export default function ProductReviewsSection() {
  const t = useTranslations('storefront');

  return (
    <section className="reviews-section">
      <h2>{t('customerReviews')}</h2>
      <div className="reviews-placeholder">
        <span className="reviews-icon">⭐</span>
        <h3>{t('reviewsComingSoon')}</h3>
        <p>{t('reviewsComingSoonDesc')}</p>
      </div>
    </section>
  );
}
