'use client';

import { useTranslations } from 'next-intl';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const salesData = [
  { date: 'Jun 1', revenue: 12000 },
  { date: 'Jun 5', revenue: 15200 },
  { date: 'Jun 10', revenue: 14800 },
  { date: 'Jun 15', revenue: 18500 },
  { date: 'Jun 20', revenue: 21200 },
  { date: 'Jun 25', revenue: 19800 },
  { date: 'Jun 30', revenue: 23500 },
];

export default function SalesReport() {
  const t = useTranslations('reports');

  return (
    <div className="report-container">
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">{t('totalRevenue')}</div>
          <div className="metric-value">$487,300</div>
          <div className="metric-unit">June 2026</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">{t('ordersThisMonth')}</div>
          <div className="metric-value">342</div>
          <div className="metric-trend">+12%</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">{t('avgOrderValueShort')}</div>
          <div className="metric-value">$1,424</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">{t('topProduct')}</div>
          <div className="metric-value">Linen Shirt</div>
          <div className="metric-unit">124 {t('sold')}</div>
        </div>
      </div>

      <div className="chart-container">
        <h3>{t('revenueTrend')}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => typeof value === 'number' ? `$${value.toLocaleString()}` : value} />
            <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <button className="btn btn-primary">{t('exportReport')}</button>
    </div>
  );
}
