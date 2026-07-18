'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface GoalsData {
  target: number;
  actual: number;
  progress: number;
  daysLeft: number;
  daysInMonth: number;
  projectedMonthEnd: number;
  chart: { week: string; target: number; actual: number }[];
}

export default function GoalsReport() {
  const t = useTranslations('reports');
  const [data, setData] = useState<GoalsData | null>(null);
  const [targetInput, setTargetInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/reports/goals')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d: GoalsData) => { setData(d); setTargetInput(String(d?.target ?? 0)); })
      .catch(() => setData({ target: 0, actual: 0, progress: 0, daysLeft: 0, daysInMonth: 30, projectedMonthEnd: 0, chart: [] }));
  }, []);

  async function saveTarget() {
    const val = Number(targetInput);
    if (isNaN(val) || val < 0) return;
    setSaving(true);
    await fetch('/api/admin/reports/goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: val }),
    });
    const res = await fetch('/api/admin/reports/goals').then((r) => r.json());
    setData(res);
    setSaving(false);
  }

  if (!data) return <p className="report-loading">Loading...</p>;

  const progress = Math.min(data.progress, 100);
  const monthName = new Date().toLocaleString('default', { month: 'long' });
  const fmt = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  const milestones = [
    { label: 'First $50k revenue', done: data.actual >= 50000 },
    { label: `${fmt(data.target)} monthly goal`, done: data.actual >= data.target && data.target > 0 },
    { label: '3D product line live', done: false },
  ];

  return (
    <div className="report-container">
      <div className="cost-settings-row">
        <label className="cost-settings-label">{t('editTarget')}:</label>
        <input
          type="number"
          className="cost-percent-input"
          value={targetInput}
          min={0}
          onChange={(e) => setTargetInput(e.target.value)}
        />
        <button className="cost-save-btn" onClick={saveTarget} disabled={saving}>
          {saving ? '...' : t('targetSaved')}
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">{t('monthlyGoal')}</div>
          <div className="metric-value">{fmt(data.target)}</div>
        </div>
        <div className={`metric-card ${data.progress >= 100 ? 'color-green' : 'color-amber'}`}>
          <div className="metric-label">{t('currentProgress')}</div>
          <div className="metric-value">{data.progress.toFixed(1)}%</div>
          <div className="metric-trend">{data.progress >= 100 ? t('onTrack') : `${fmt(data.actual)} actual`}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">{t('daysLeft')}</div>
          <div className="metric-value">{data.daysLeft}</div>
          <div className="metric-unit">{monthName}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">{t('projectedFinish')}</div>
          <div className="metric-value">{fmt(data.projectedMonthEnd)}</div>
          <div className="metric-trend">
            {data.projectedMonthEnd >= data.target
              ? `+${fmt(data.projectedMonthEnd - data.target)}`
              : `-${fmt(data.target - data.projectedMonthEnd)}`}
          </div>
        </div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-label">{t('monthlyTargetProgress')} — {monthName}</div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-percent">{data.progress.toFixed(1)}%</div>
      </div>

      <div className="chart-container">
        <h3>{t('targetVsActual')}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.chart}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip formatter={(v) => typeof v === 'number' ? `$${v.toLocaleString()}` : v} />
            <Legend />
            <Bar dataKey="target" fill="#d1d5db" name="Target" />
            <Bar dataKey="actual" fill="#f59e0b" name="Actual" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="table-container">
        <h3>{t('milestones')}</h3>
        <ul className="milestone-list">
          {milestones.map((m) => (
            <li key={m.label} className={`milestone-item ${m.done ? 'done' : ''}`}>
              <span className="milestone-icon">{m.done ? '✓' : '○'}</span>
              <span>{m.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
