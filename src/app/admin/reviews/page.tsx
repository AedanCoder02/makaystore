'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Star, Check, EyeOff, RotateCcw, Trash2 } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import '@/styles/events-admin.css';

interface Review { id: number; author_name: string; rating: number; comment: string; locale: string; status: string; created_at: string }
type Status = 'pending' | 'approved' | 'hidden';

export default function AdminReviewsPage() {
  const t = useTranslations('reviewsAdmin');
  const locale = useLocale();
  const [status, setStatus] = useState<Status>('pending');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/reviews?status=${status}`);
    const d = await res.json().catch(() => ({}));
    setReviews(Array.isArray(d.reviews) ? d.reviews : []);
    setCounts(d.counts ?? {});
    setLoading(false);
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const act = async (id: number, next: Status) => {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }),
    });
    if (!res.ok) setError(t('error'));
    await load();
  };

  const remove = async (id: number) => {
    if (!confirm(t('confirmDelete'))) return;
    const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    if (!res.ok) setError(t('error'));
    await load();
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="dashboard-header">
          <div>
            <h1 className="ae-page-title">{t('title')}</h1>
            <p className="ae-sub">{t('subtitle')}</p>
          </div>
        </div>

        {error && <p className="ae-error" role="alert">{error}</p>}

        <div className="sp-tabs ae-tabs" role="tablist">
          {(['pending', 'approved', 'hidden'] as const).map(s => (
            <button key={s} role="tab" aria-selected={status === s} className={`sp-tab${status === s ? ' active' : ''}`} onClick={() => setStatus(s)}>
              {t(`tabs.${s}`)} <span className="sp-tab-count">{counts[s] ?? 0}</span>
            </button>
          ))}
        </div>

        {loading ? <p className="ae-muted">{t('loading')}</p> : reviews.length === 0 ? (
          <div className="ae-empty"><Star size={40} /><p>{t(`empty.${status}`)}</p></div>
        ) : (
          <div className="ae-list">
            {reviews.map(r => (
              <div key={r.id} className="ae-event-card">
                <div className="ae-event-row">
                  <div className="ae-info">
                    <div className="ae-title-row">
                      <span className="ae-title">{r.author_name}</span>
                      <span className="ae-price" aria-label={t('rating', { n: r.rating })}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                      <span className="ae-status">{r.locale.toUpperCase()}</span>
                    </div>
                    <p className="ae-review-text">{r.comment}</p>
                    <p className="ae-hint">{new Date(r.created_at).toLocaleString(locale === 'es' ? 'es-VE' : 'en-US')}</p>
                  </div>
                  <div className="ae-actions">
                    {status !== 'approved' && <button className="seller-icon-btn edit" title={t('approve')} aria-label={t('approve')} onClick={() => act(r.id, 'approved')}><Check size={14} /></button>}
                    {status !== 'hidden' && <button className="seller-icon-btn cancel" title={t('hide')} aria-label={t('hide')} onClick={() => act(r.id, 'hidden')}><EyeOff size={14} /></button>}
                    {status !== 'pending' && <button className="ae-attendees-btn" title={t('toPending')} aria-label={t('toPending')} onClick={() => act(r.id, 'pending')}><RotateCcw size={13} /></button>}
                    <button className="ae-attendees-btn" title={t('delete')} aria-label={t('delete')} onClick={() => remove(r.id)}><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
