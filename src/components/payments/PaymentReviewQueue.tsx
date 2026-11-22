'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CircleCheck, CircleX, ExternalLink, FileText, RefreshCw, Receipt } from 'lucide-react';
import '@/styles/payments-admin.css';

type QueueStatus = 'pending_verification' | 'verified' | 'rejected';

interface PaymentLeg {
  method: string;
  amount: number;
  reference?: string;
  proof_id?: string;
  receipt_url?: string;
}

interface QueueOrder {
  id: string;
  customer_email: string | null;
  customer_id: string | null;
  total: string | number;
  items: Array<{ title?: string; quantity?: number; price?: number }>;
  shipping_address: { name?: string };
  payment_methods: PaymentLeg[];
  payment_status: QueueStatus;
  payment_verified_at: string | null;
  payment_note: string | null;
  created_at: string;
}

const TABS: QueueStatus[] = ['pending_verification', 'verified', 'rejected'];

function fmtDate(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function PaymentReviewQueue({ locale = 'es' }: { locale?: string }) {
  const t = useTranslations('payments');
  const tm = useTranslations('checkout.pay.methods');
  const [tab, setTab] = useState<QueueStatus>('pending_verification');
  const [orders, setOrders] = useState<QueueOrder[]>([]);
  const [counts, setCounts] = useState<Partial<Record<QueueStatus, number>>>({});
  const [mime, setMime] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await fetch(`/api/payments/queue?status=${tab}`).catch(() => null);
    const data = res?.ok ? await res.json() : null;
    setOrders(data?.orders ?? []);
    setCounts(data?.counts ?? {});
    setMime(data?.proof_mime ?? {});
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, action: 'verify' | 'reject') => {
    if (action === 'reject' && !window.confirm(t('confirmReject'))) return;
    setWorking(id);
    setError('');
    const res = await fetch(`/api/orders/${encodeURIComponent(id)}/payment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, note: notes[id] ?? '' }),
    }).catch(() => null);
    setWorking(null);
    if (!res?.ok) {
      const data = await res?.json().catch(() => null);
      setError(data?.error ?? t('error'));
      return;
    }
    setOrders(prev => prev.filter(o => o.id !== id));
    setCounts(prev => ({
      ...prev,
      pending_verification: Math.max(0, (prev.pending_verification ?? 1) - 1),
      [action === 'verify' ? 'verified' : 'rejected']: (prev[action === 'verify' ? 'verified' : 'rejected'] ?? 0) + 1,
    }));
  };

  return (
    <div className="pv">
      <div className="pv-toolbar">
        <div className="pv-tabs" role="tablist">
          {TABS.map(s => (
            <button
              key={s}
              role="tab"
              aria-selected={tab === s}
              className={`pv-tab${tab === s ? ' is-active' : ''}`}
              onClick={() => setTab(s)}
            >
              {t(`tabs.${s}`)}
              {(counts[s] ?? 0) > 0 && <span className={`pv-count pv-count--${s}`}>{counts[s]}</span>}
            </button>
          ))}
        </div>
        <button className="pv-reload" onClick={load} aria-label={t('reload')} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'pv-spin' : ''} />
        </button>
      </div>

      {error && <p className="pv-error" role="alert">{error}</p>}

      {loading ? (
        <p className="pv-muted">{t('loading')}</p>
      ) : orders.length === 0 ? (
        <div className="pv-empty"><Receipt size={28} /><p>{t('empty')}</p></div>
      ) : (
        <div className="pv-grid">
          {orders.map((o, i) => (
            <article key={o.id} className="pv-card" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
              <header className="pv-card-head">
                <div>
                  <p className="pv-order">#{o.id.replace(/^ORD-/, '').slice(-8)}</p>
                  <p className="pv-muted">
                    {o.shipping_address?.name || o.customer_email || t('guest')} · {fmtDate(o.created_at, locale)}
                  </p>
                </div>
                <strong className="pv-total">${Number(o.total).toFixed(2)}</strong>
              </header>

              {o.items?.length > 0 && (
                <p className="pv-items">
                  {o.items.map(it => `${it.title ?? '—'} ×${it.quantity ?? 1}`).join(' · ')}
                </p>
              )}

              {o.payment_methods.map((pm, idx) => {
                const isPdf = pm.proof_id && mime[pm.proof_id] === 'application/pdf';
                const href = pm.proof_id ? `/api/payments/proofs/${pm.proof_id}` : pm.receipt_url;
                return (
                  <div key={idx} className="pv-leg">
                    <div className="pv-leg-info">
                      <span className="pv-method">{tm.has(pm.method) ? tm(pm.method) : pm.method}</span>
                      <span className="pv-amount">${Number(pm.amount).toFixed(2)}</span>
                      {pm.reference && (
                        <span className="pv-ref">{t('reference')}: <code>{pm.reference}</code></span>
                      )}
                    </div>
                    {href ? (
                      <a className="pv-proof" href={href} target="_blank" rel="noopener noreferrer">
                        {isPdf || !pm.proof_id ? (
                          <span className="pv-proof-icon"><FileText size={22} /></span>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={href} alt={t('proof')} loading="lazy" />
                        )}
                        <span className="pv-proof-label"><ExternalLink size={11} /> {t('openProof')}</span>
                      </a>
                    ) : (
                      <span className="pv-muted">{t('noProof')}</span>
                    )}
                  </div>
                );
              })}

              {tab === 'pending_verification' ? (
                <footer className="pv-actions">
                  <input
                    className="pv-note"
                    placeholder={t('notePlaceholder')}
                    value={notes[o.id] ?? ''}
                    onChange={e => setNotes(n => ({ ...n, [o.id]: e.target.value }))}
                    maxLength={500}
                  />
                  <div className="pv-buttons">
                    <button className="pv-btn pv-btn--reject" disabled={working === o.id} onClick={() => act(o.id, 'reject')}>
                      <CircleX size={15} /> {t('reject')}
                    </button>
                    <button className="pv-btn pv-btn--verify" disabled={working === o.id} onClick={() => act(o.id, 'verify')}>
                      <CircleCheck size={15} /> {t('verify')}
                    </button>
                  </div>
                </footer>
              ) : (
                <footer className="pv-reviewed">
                  {o.payment_verified_at && <span>{t('reviewedAt')}: {fmtDate(o.payment_verified_at, locale)}</span>}
                  {o.payment_note && <span>{t('note')}: {o.payment_note}</span>}
                </footer>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
