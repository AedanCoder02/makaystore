'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Users, CheckCircle, XCircle } from 'lucide-react';

interface SellerRow {
  workerId: string;
  name: string;
  clockedIn: boolean;
  startTime?: string;
  salesThisMonth: number;
}

export default function SupervisorStaffPage() {
  const t = useTranslations('supervisor');
  const [sellers, setSellers] = useState<SellerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/supervisor/sellers')
      .then((r) => r.ok ? r.json() : [])
      .then((data: SellerRow[]) => { setSellers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="sup-page">
      <div className="sup-page-header">
        <Users size={22} className="sup-page-icon" />
        <h1 className="sup-page-title">{t('staff')}</h1>
        <span className="sup-page-count">{sellers.length} {t('sellers')}</span>
      </div>

      {loading ? (
        <p className="sup-loading">Loading…</p>
      ) : sellers.length === 0 ? (
        <p className="sup-empty-state">{t('noSellers')}</p>
      ) : (
        <div className="sup-table-wrap">
          <table className="sup-table">
            <thead>
              <tr>
                <th>{t('name')}</th>
                <th>{t('status')}</th>
                <th>{t('clockedInSince')}</th>
                <th>{t('salesThisMonth')}</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((s) => (
                <tr key={s.workerId}>
                  <td className="sup-td-name">
                    <span className="sup-avatar">{s.name[0]}</span>
                    {s.name}
                  </td>
                  <td>
                    <span className={`sup-status-badge ${s.clockedIn ? 'active' : 'inactive'}`}>
                      {s.clockedIn ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {s.clockedIn ? t('active') : t('offline')}
                    </span>
                  </td>
                  <td className="sup-td-muted">
                    {s.clockedIn && s.startTime
                      ? new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                  <td className="sup-td-amount">${(s.salesThisMonth ?? 0).toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
