'use client';

import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const stockData = [
  { name: 'In Stock', value: 487 },
  { name: 'Low Stock', value: 23 },
  { name: 'Out of Stock', value: 8 },
];

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

const topSKUs = [
  { sku: 'LINEN-001', product: 'Linen Shirt', qty: 87 },
  { sku: 'COTTON-002', product: 'Cotton Pants', qty: 76 },
  { sku: 'SILK-001', product: 'Silk Blend', qty: 54 },
  { sku: 'WOOL-001', product: 'Wool Sweater', qty: 43 },
  { sku: 'DENIM-001', product: 'Denim Jacket', qty: 38 },
];

const OUT_OF_STOCK_COUNT = 8;

export default function StockReport() {
  return (
    <div className="report-container">
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total SKUs</div>
          <div className="metric-value">518</div>
        </div>
        <div className="metric-card color-green">
          <div className="metric-label">In Stock</div>
          <div className="metric-value">487</div>
          <div className="metric-unit">94%</div>
        </div>
        <div className="metric-card color-amber">
          <div className="metric-label">Low Stock</div>
          <div className="metric-value">23</div>
          <div className="metric-unit">4%</div>
        </div>
        <div className={`metric-card ${OUT_OF_STOCK_COUNT > 10 ? 'color-red' : ''}`}>
          <div className="metric-label">Out of Stock</div>
          <div className="metric-value">
            {OUT_OF_STOCK_COUNT}
            {OUT_OF_STOCK_COUNT > 10 && (
              <span className="alert-badge">!</span>
            )}
          </div>
          <div className="metric-unit">2%</div>
        </div>
      </div>

      <div className="chart-container">
        <h3>Inventory Status Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={stockData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {stockData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => typeof value === 'number' ? `${value} SKUs` : value} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="table-container">
        <h3>Top 5 SKUs by Quantity</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {topSKUs.map((sku) => (
              <tr key={sku.sku}>
                <td>{sku.sku}</td>
                <td>{sku.product}</td>
                <td>{sku.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
