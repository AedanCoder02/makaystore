'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const goalsData = [
  { week: 'W1', target: 100000, actual: 98000 },
  { week: 'W2', target: 100000, actual: 112000 },
  { week: 'W3', target: 100000, actual: 105000 },
  { week: 'W4', target: 100000, actual: 172200 },
];

const milestones = [
  { label: 'Reach $50k revenue', done: true },
  { label: '200 orders in a month', done: true },
  { label: '5-star average rating', done: false },
  { label: 'Launch 3D product line', done: false },
  { label: '$400k monthly goal', done: true },
];

export default function GoalsReport() {
  const progress = 121.8;
  const fillWidth = Math.min(progress, 100);

  return (
    <div className="report-container">
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Monthly Goal</div>
          <div className="metric-value">$400,000</div>
        </div>
        <div className="metric-card color-green">
          <div className="metric-label">Current Progress</div>
          <div className="metric-value">{progress.toFixed(1)}%</div>
          <div className="metric-trend">On track</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Days Left</div>
          <div className="metric-value">5</div>
          <div className="metric-unit">in June</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Projected Finish</div>
          <div className="metric-value">$487,200</div>
          <div className="metric-trend">+$87,200</div>
        </div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-label">Monthly Target Progress</div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${fillWidth}%` }} />
        </div>
        <div className="progress-percent">{progress.toFixed(1)}%</div>
      </div>

      <div className="chart-container">
        <h3>Target vs Actual by Week</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={goalsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip formatter={(value) => typeof value === 'number' ? `$${value.toLocaleString()}` : value} />
            <Legend />
            <Bar dataKey="target" fill="#d1d5db" name="Target" />
            <Bar dataKey="actual" fill="#f59e0b" name="Actual" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="table-container">
        <h3>Milestones</h3>
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
