'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface CostData {
  revenue: number;
  costPercent: number;
  totalCost: number;
  grossMargin: number;
  profit: number;
  trend: { date: string; revenue: number }[];
}

function getMarginColor(margin: number): 'green' | 'amber' | 'red' {
  if (margin >= 40) return 'green';
  if (margin >= 20) return 'amber';
  return 'red';
}

export default function CostMarginReport() {
  const t = useTranslations('reports');
  const [data, setData] = useState<CostData | null>(null);
  const [costInput, setCostInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/reports/cost')
      .then((r) => r.json())
      .then((d) => { setData(d); setCostInput(String(d.costPercent)); })
      .catch(() => {});
  }, []);

  async function saveCostPercent() {
    const val = Number(costInput);
    if (isNaN(val) || val < 0 || val > 100) return;
    setSaving(true);
    await fetch('/api/admin/reports/cost', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ costPercent: val }),
    });
    const res = await fetch('/api/admin/reports/cost').then((r) => r.json());
    setData(res);
    setSaving(false);
  }

  if (!data) return <p className="report-loading">Loading...</p>;

  const marginColor = getMarginColor(data.grossMargin);
  const fmt = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  return (
    <div className="report-container">
      <div className="cost-settings-row">
        <label className="cost-settings-label">{t('adjustCostPercent')}:</label>
        <input
          type="number"
          className="cost-percent-input"
          value={costInput}
          min={0}
          max={100}
          onChange={(e) => setCostInput(e.target.value)}
        />
        <span>%</span>
        <button className="cost-save-btn" onClick={saveCostPercent} disabled={saving}>
          {saving ? '...' : t('costPercent')}
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">{t('totalRevenue')}</div>
          <div className="metric-value">{fmt(data.revenue)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">{t('totalCost')}</div>
          <div className="metric-value">{fmt(data.totalCost)}</div>
        </div>
        <div className={`metric-card color-${marginColor}`}>
          <div className="metric-label">{t('grossMargin')}</div>
          <div className="metric-value">{data.grossMargin.toFixed(1)}%</div>
        </div>
        <div className={`metric-card color-${marginColor}`}>
          <div className="metric-label">{t('profitThisMonth')}</div>
          <div className="metric-value">{fmt(data.profit)}</div>
        </div>
      </div>

      <div className="chart-container">
        <h3>{t('revenueTrend')}</h3>
        {data.trend.length === 0 ? (
          <p className="report-empty">No sales data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(v) => typeof v === 'number' ? `$${v.toLocaleString()}` : v} />
              <Area type="monotone" dataKey="revenue" stroke="#f59e0b" fill="#fef3c7" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
