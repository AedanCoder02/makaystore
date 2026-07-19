'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useRotationStore } from '@/stores/rotationStore';
import type { DateRange } from './AdminReportsDashboard';

interface ProductRotation {
  id: string;
  title: string;
  sku: string;
  status: string;
  last_rotated_at: string | null;
}

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function rangeStart(dateRange: DateRange): Date | null {
  if (dateRange === '7d')  return daysAgo(7);
  if (dateRange === '30d') return daysAgo(30);
  if (dateRange === '3m')  return daysAgo(90);
  return null;
}

export default function RotationReport({ dateRange = '30d' }: { dateRange?: DateRange }) {
  const t = useTranslations('reports');
  const [products, setProducts] = useState<ProductRotation[]>([]);
  const [loading, setLoading] = useState(true);
  const { queue } = useRotationStore();

  useEffect(() => {
    setLoading(true);
    fetch('/api/seller/rotation')
      .then(r => r.ok ? r.json() : [])
      .then((data: ProductRotation[]) => { setProducts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const cutoff = rangeStart(dateRange);

  const active   = products.filter(p => p.status === 'active').length;
  const paused   = products.filter(p => p.status === 'paused').length;
  const archived = products.filter(p => p.status === 'archived').length;

  const rotatedInPeriod = products.filter(p => {
    if (!p.last_rotated_at) return false;
    if (!cutoff) return true;
    return new Date(p.last_rotated_at) >= cutoff;
  });

  const recentlyRotated = [...rotatedInPeriod]
    .sort((a, b) => new Date(b.last_rotated_at!).getTime() - new Date(a.last_rotated_at!).getTime())
    .slice(0, 10);

  const pendingInQueue = queue.filter(j => !j.completedDate).length;

  const chartData = [{ name: 'Products', count: active, paused, archived }];

  if (loading) return <p className="report-loading">Loading…</p>;

  return (
    <div className="report-container">
      <div className="metrics-grid">
        <div className="metric-card color-green">
          <div className="metric-label">{t('activeProducts')}</div>
          <div className="metric-value">{active}</div>
        </div>
        <div className="metric-card color-amber">
          <div className="metric-label">{t('pausedProducts')}</div>
          <div className="metric-value">{paused}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">{t('rotatedThisMonth')}</div>
          <div className="metric-value">{rotatedInPeriod.length}</div>
          <div className="metric-unit">{dateRange === 'all' ? 'all time' : `last ${dateRange}`}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">{t('upcomingChanges')}</div>
          <div className="metric-value">{pendingInQueue}</div>
          <div className="metric-unit">queued</div>
        </div>
      </div>

      <div className="chart-container">
        <h3>Product Status Breakdown</h3>
        {products.length === 0 ? (
          <p className="report-empty">No products in database yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(v) => typeof v === 'number' ? [`${v} products`, ''] : v} />
              <Legend />
              <Bar dataKey="count" name="Active" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="paused" name="Paused" fill="#f59e0b" radius={[4,4,0,0]} />
              <Bar dataKey="archived" name="Archived" fill="#9ca3af" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {recentlyRotated.length > 0 && (
        <div className="table-container">
          <h3>Recently Rotated</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('product')}</th>
                <th>SKU</th>
                <th>{t('current')}</th>
                <th>Rotated On</th>
              </tr>
            </thead>
            <tbody>
              {recentlyRotated.map(r => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td style={{ color: '#6b7280', fontSize: '0.85rem' }}>{r.sku ?? '—'}</td>
                  <td>
                    <span className={`sup-order-status sup-order-status--${r.status}`}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                    {r.last_rotated_at ? new Date(r.last_rotated_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {recentlyRotated.length === 0 && !loading && (
        <p className="report-empty">No rotations recorded in this period.</p>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <Link href="/seller/rotation" className="btn-primary-link">
          {t('manageRotation')}
        </Link>
      </div>
    </div>
  );
}
