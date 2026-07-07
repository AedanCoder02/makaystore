'use client';

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
  return (
    <div className="report-container">
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Revenue</div>
          <div className="metric-value">$487,300</div>
          <div className="metric-unit">June 2026</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Orders This Month</div>
          <div className="metric-value">342</div>
          <div className="metric-trend">+12%</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg Order Value</div>
          <div className="metric-value">$1,424</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Top Product</div>
          <div className="metric-value">Linen Shirt</div>
          <div className="metric-unit">124 sold</div>
        </div>
      </div>

      <div className="chart-container">
        <h3>Revenue Trend (Last 30 Days)</h3>
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

      <button className="btn btn-primary">Export Report</button>
    </div>
  );
}
