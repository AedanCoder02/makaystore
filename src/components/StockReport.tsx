'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

interface StockData {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  topSKUs: { sku: string; product: string; qty: number }[];
}

export default function StockReport() {
  const t = useTranslations('reports');
  const [data, setData] = useState<StockData | null>(null);

  useEffect(() => {
    fetch('/api/admin/reports/stock')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const stockChart = data
    ? [
        { name: t('inStock'), value: data.inStock },
        { name: t('lowStock'), value: data.lowStock },
        { name: t('outOfStock'), value: data.outOfStock },
      ]
    : [];

  return (
    <div className="report-container">
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">{t('totalSKUs')}</div>
          <div className="metric-value">{data?.total ?? '—'}</div>
        </div>
        <div className="metric-card color-green">
          <div className="metric-label">{t('inStock')}</div>
          <div className="metric-value">{data?.inStock ?? '—'}</div>
          <div className="metric-unit">{data ? `${Math.round((data.inStock / Math.max(data.total, 1)) * 100)}%` : ''}</div>
        </div>
        <div className="metric-card color-amber">
          <div className="metric-label">{t('lowStock')}</div>
          <div className="metric-value">{data?.lowStock ?? '—'}</div>
        </div>
        <div className={`metric-card ${(data?.outOfStock ?? 0) > 10 ? 'color-red' : ''}`}>
          <div className="metric-label">{t('outOfStock')}</div>
          <div className="metric-value">{data?.outOfStock ?? '—'}</div>
        </div>
      </div>

      <div className="chart-container">
        <h3>{t('inventoryBreakdown')}</h3>
        {data && data.total > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={stockChart} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}>
                {stockChart.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => typeof v === 'number' ? `${v} SKUs` : v} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: 'var(--makay-mauve)', fontSize: '0.875rem', padding: '2rem 0' }}>
            {data ? 'No stock data yet.' : 'Loading…'}
          </p>
        )}
      </div>

      {data && data.topSKUs.length > 0 && (
        <div className="table-container">
          <h3>{t('topSKUs')}</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('sku')}</th>
                <th>{t('product')}</th>
                <th>{t('quantity')}</th>
              </tr>
            </thead>
            <tbody>
              {data.topSKUs.map((row) => (
                <tr key={row.sku}>
                  <td>{row.sku}</td>
                  <td>{row.product}</td>
                  <td>{row.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
