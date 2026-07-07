'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const rotationData = [
  { date: 'Jun 1', active: 200, paused: 12 },
  { date: 'Jun 5', active: 198, paused: 14 },
  { date: 'Jun 10', active: 195, paused: 17 },
  { date: 'Jun 15', active: 203, paused: 9 },
  { date: 'Jun 20', active: 201, paused: 11 },
  { date: 'Jun 25', active: 199, paused: 13 },
  { date: 'Jun 30', active: 198, paused: 14 },
];

const upcomingRotations = [
  { product: 'Summer Dress', current: 'Active', next: 'Paused', date: '2026-07-10' },
  { product: 'Winter Coat', current: 'Paused', next: 'Active', date: '2026-07-15' },
  { product: 'Beach Shorts', current: 'Active', next: 'Archived', date: '2026-07-20' },
  { product: 'Thermal Top', current: 'Paused', next: 'Active', date: '2026-07-25' },
  { product: 'Spring Jacket', current: 'Active', next: 'Paused', date: '2026-08-01' },
];

export default function RotationReport() {
  const t = useTranslations('reports');

  return (
    <div className="report-container">
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">{t('activeProducts')}</div>
          <div className="metric-value">198</div>
        </div>
        <div className="metric-card color-amber">
          <div className="metric-label">{t('pausedProducts')}</div>
          <div className="metric-value">14</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">{t('rotatedThisMonth')}</div>
          <div className="metric-value">32</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">{t('upcomingChanges')}</div>
          <div className="metric-value">7</div>
        </div>
      </div>

      <div className="chart-container">
        <h3>{t('rotationActivity')}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={rotationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="active" fill="#10b981" name="Active" />
            <Line yAxisId="right" type="monotone" dataKey="paused" stroke="#f59e0b" strokeWidth={2} name="Paused" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="table-container">
        <h3>{t('nextToRotate')}</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('product')}</th>
              <th>{t('current')}</th>
              <th>{t('next')}</th>
              <th>{t('date')}</th>
            </tr>
          </thead>
          <tbody>
            {upcomingRotations.map((r) => (
              <tr key={r.product}>
                <td>{r.product}</td>
                <td className={`status-${r.current.toLowerCase()}`}>{r.current}</td>
                <td className={`status-${r.next.toLowerCase()}`}>{r.next}</td>
                <td>{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <Link href="/admin/rotation" className="btn-primary-link">
          {t('manageRotation')}
        </Link>
      </div>
    </div>
  );
}
