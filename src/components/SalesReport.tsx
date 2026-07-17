'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface SalesData {
  chart: { date: string; revenue: number }[];
  totalRevenue: number;
  totalOrders: number;
  avgOrder: number;
}

export default function SalesReport() {
  const t = useTranslations('reports');
  const [data, setData] = useState<SalesData | null>(null);

  useEffect(() => {
    fetch('/api/admin/reports/sales')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  return (
    <div className="report-container">
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">{t('totalRevenue')}</div>
          <div className="metric-value">
            {data ? `$${data.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
          </div>
          <div className="metric-unit">{t('inJune')}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">{t('ordersThisMonth')}</div>
          <div className="metric-value">{data ? data.totalOrders : '—'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">{t('avgOrderValueShort')}</div>
          <div className="metric-value">
            {data ? `$${data.avgOrder.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">{t('totalOrders')}</div>
          <div className="metric-value">{data ? data.totalOrders : '—'}</div>
        </div>
      </div>

      <div className="chart-container">
        <h3>{t('revenueTrend')}</h3>
        {data && data.chart.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.chart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(v) => typeof v === 'number' ? `$${v.toLocaleString()}` : v} />
              <Line type="monotone" dataKey="revenue" stroke="#D4A574" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: 'var(--makay-mauve)', fontSize: '0.875rem', padding: '2rem 0' }}>
            {data ? 'No sales data yet.' : 'Loading…'}
          </p>
        )}
      </div>

      <button className="btn btn-primary">{t('exportReport')}</button>
    </div>
  );
}
