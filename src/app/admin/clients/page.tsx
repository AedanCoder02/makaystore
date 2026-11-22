'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Info, Phone, Mail } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import '@/styles/clients-admin.css';

interface ContactRow {
  id: number;
  full_name: string;
  phone_raw: string | null;
  email: string | null;
  sources: string[];
}
interface Payload {
  clients: ContactRow[];
  matched: number;
  total: number;
  bySource: { source: string; n: number }[];
  page: number;
  pageSize: number;
}

const KNOWN_SOURCES = ['yimi', 'makay_store_account', 'makay_store_walkin', 'makay_store_crm', 'roulette', 'csv_import'];
const SOURCE_COLORS: Record<string, string> = {
  yimi: 'teal',
  makay_store_account: 'gold',
  makay_store_walkin: 'gold',
  makay_store_crm: 'purple',
  roulette: 'orange',
  csv_import: 'teal',
};

export default function AdminClientsPage() {
  const t = useTranslations('clientsAdmin');
  const [data, setData] = useState<Payload | null>(null);
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Reset to page 1 whenever the filter changes.
  useEffect(() => { setPage(1); }, [search, source]);

  useEffect(() => {
    setLoading(true);
    const handle = setTimeout(() => {
      const qs = new URLSearchParams({ q: search, source, page: String(page) });
      fetch('/api/admin/clients?' + qs)
        .then(r => (r.ok ? r.json() : Promise.reject()))
        .then((d: Payload) => { setData(d); setError(false); })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [search, source, page]);

  const label = (s: string) => (KNOWN_SOURCES.includes(s) ? t(`sources.${s}`) : s);
  const pages = data ? Math.max(1, Math.ceil(data.matched / data.pageSize)) : 1;
  const from = data && data.matched ? (data.page - 1) * data.pageSize + 1 : 0;
  const to = data ? Math.min(data.matched, data.page * data.pageSize) : 0;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="dashboard-header">
          <div>
            <h1>{t('title')}</h1>
            <p className="cl-sub">{t('subtitle', { total: data?.total ?? 0 })}</p>
          </div>
        </div>

        <details className="cl-origin">
          <summary><Info size={16} aria-hidden="true" /> {t('origin.title')}</summary>
          <p>{t('origin.body')}</p>
        </details>

        {data && data.bySource.length > 0 && (
          <div className="cl-sources" role="tablist" aria-label={t('sourceFilter')}>
            <button role="tab" aria-selected={source === ''} className={`cl-source${source === '' ? ' active' : ''}`} onClick={() => setSource('')}>
              <span className="cl-source-n">{data.total.toLocaleString()}</span>
              <span>{t('allSources')}</span>
            </button>
            {data.bySource.map(s => (
              <button key={s.source} role="tab" aria-selected={source === s.source}
                className={`cl-source cl-source--${SOURCE_COLORS[s.source] ?? 'teal'}${source === s.source ? ' active' : ''}`}
                onClick={() => setSource(s.source)}>
                <span className="cl-source-n">{s.n.toLocaleString()}</span>
                <span>{label(s.source)}</span>
              </button>
            ))}
          </div>
        )}

        <div className="admin-filter-row">
          <input
            className="admin-search-input"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {data && <span className="admin-count">{t('showing', { from, to, matched: data.matched })}</span>}
        </div>

        {error ? (
          <p className="admin-loading" role="alert">{t('error')}</p>
        ) : loading && !data ? (
          <p className="admin-loading">{t('loading')}</p>
        ) : (
          <div className={`cl-list${loading ? ' is-loading' : ''}`}>
            {data?.clients.map(c => (
              <div key={c.id} className="cl-row">
                <span className="cl-avatar" aria-hidden="true">{(c.full_name || '?').trim().charAt(0).toUpperCase()}</span>
                <div className="cl-main">
                  <p className="cl-name">{c.full_name || t('noName')}</p>
                  <p className="cl-contact">
                    {c.phone_raw && <a href={`tel:${c.phone_raw.replace(/[^\d+]/g, '')}`}><Phone size={12} aria-hidden="true" /> {c.phone_raw}</a>}
                    {c.email && <a href={`mailto:${c.email}`}><Mail size={12} aria-hidden="true" /> {c.email}</a>}
                    {!c.phone_raw && !c.email && <span>{t('noContact')}</span>}
                  </p>
                </div>
                <div className="cl-badges">
                  {c.sources.map(s => (
                    <span key={s} className={`admin-role-badge role-${SOURCE_COLORS[s] ?? 'teal'}`}>{label(s)}</span>
                  ))}
                </div>
              </div>
            ))}
            {data?.clients.length === 0 && <p className="admin-loading">{t('empty')}</p>}
          </div>
        )}

        {data && pages > 1 && (
          <nav className="cl-pager" aria-label={t('pagination')}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} aria-label={t('prev')}><ChevronLeft size={16} /></button>
            <span>{t('pageOf', { page, pages })}</span>
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages} aria-label={t('next')}><ChevronRight size={16} /></button>
          </nav>
        )}
      </main>
    </div>
  );
}
