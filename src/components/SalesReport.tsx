'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { DateRange } from './AdminReportsDashboard';

interface SalesData {
  chart: { date: string; revenue: number; orders: number }[];
  totalRevenue: number;
  totalOrders: number;
  avgOrder: number;
  membershipRevenue: number;
  topProducts: { title: string; revenue: number; units: number }[];
}

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  '7d': 'Last 7 days', '30d': 'Last 30 days', '3m': 'Last 3 months', 'all': 'All time',
};

export default function SalesReport({ dateRange = '30d' }: { dateRange?: DateRange }) {
  const t = useTranslations('reports');
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/reports/sales?range=${dateRange}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: SalesData) => { setData(d); setLoading(false); })
      .catch(() => { setData(null); setLoading(false); });
  }, [dateRange]);

  const fmt = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div className="report-container">
      {/* KPI cards */}
      <div className="metrics-grid">
        <div className="metric-card color-green">
          <div className="metric-label">{t('totalRevenue')}</div>
          <div className="metric-value">{loading ? '—' : fmt(data?.totalRevenue ?? 0)}</div>
          <div className="metric-unit">{DATE_RANGE_LABELS[dateRange]}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">{t('totalOrders')}</div>
          <div className="metric-value">{loading ? '—' : (data?.totalOrders ?? 0)}</div>
          <div className="metric-unit">in-person + storefront</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">{t('avgOrderValueShort')}</div>
          <div className="metric-value">{loading ? '—' : fmt(data?.avgOrder ?? 0)}</div>
        </div>
        <div className="metric-card color-amber">
          <div className="metric-label">Event Revenue</div>
          <div className="metric-value">{loading ? '—' : fmt(data?.membershipRevenue ?? 0)}</div>
          <div className="metric-unit">ticket sales</div>
        </div>
      </div>

      {/* Revenue + orders chart */}
      <div className="chart-container">
        <h3>{t('revenueTrend')}</h3>
        {!loading && data && data.chart.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data.chart} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis yAxisId="rev" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `$${v}`} />
              <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip
                formatter={(v, name) => name === 'Revenue' ? [`$${Number(v).toLocaleString()}`, name] : [v, name]}
              />
              <Legend />
              <Bar yAxisId="ord" dataKey="orders" name="Orders" fill="rgba(212,165,116,0.25)" radius={[3,3,0,0]} />
              <Line yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue" stroke="#D4A574" strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <p className="report-empty">{loading ? 'Loading…' : 'No sales data in this period.'}</p>
        )}
      </div>

      {/* Top products */}
      {data && data.topProducts.length > 0 && (
        <div className="table-container">
          <h3>Top Products</h3>
          <table className="data-table">
            <thead>
              <tr><th>Product</th><th style={{ textAlign: 'right' }}>Units</th><th style={{ textAlign: 'right' }}>Revenue</th></tr>
            </thead>
            <tbody>
              {data.topProducts.map((p, i) => (
                <tr key={i}>
                  <td>{p.title}</td>
                  <td style={{ textAlign: 'right', color: '#6b7280', fontSize: '0.85rem' }}>{p.units}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
