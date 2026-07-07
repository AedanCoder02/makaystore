'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const marginData = [
  { date: 'Jun 1', margin: 42 },
  { date: 'Jun 5', margin: 39 },
  { date: 'Jun 10', margin: 40 },
  { date: 'Jun 15', margin: 43 },
  { date: 'Jun 20', margin: 45 },
  { date: 'Jun 25', margin: 44 },
  { date: 'Jun 30', margin: 46 },
];

function getMarginColor(margin: number): 'green' | 'amber' | 'red' {
  if (margin >= 40) return 'green';
  if (margin >= 20) return 'amber';
  return 'red';
}

export default function CostMarginReport() {
  const marginPercent = 46;
  const marginColor = getMarginColor(marginPercent);

  return (
    <div className="report-container">
      <div className="metrics-grid">
        <div className={`metric-card color-${marginColor}`}>
          <div className="metric-label">Total Cost</div>
          <div className="metric-value">$234,500</div>
        </div>
        <div className={`metric-card color-${marginColor}`}>
          <div className="metric-label">Gross Margin</div>
          <div className="metric-value">{marginPercent}%</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Profit This Month</div>
          <div className="metric-value">$252,800</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Margin Trend</div>
          <div className="metric-value">+3.2%</div>
          <div className="metric-trend">Good</div>
        </div>
      </div>

      <div className="chart-container">
        <h3>Margin % Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={marginData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(value) => typeof value === 'number' ? `${value}%` : value} />
            <Area type="monotone" dataKey="margin" stroke="#f59e0b" fill="#fef3c7" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
