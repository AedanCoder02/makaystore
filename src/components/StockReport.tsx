'use client';

import { useTranslations } from 'next-intl';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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
  const t = useTranslations('reports');

  const stockData = [
    { name: t('inStock'), value: 487 },
    { name: t('lowStock'), value: 23 },
    { name: t('outOfStock'), value: 8 },
  ];

  return (
    <div className="report-container">
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">{t('totalSKUs')}</div>
          <div className="metric-value">518</div>
        </div>
        <div className="metric-card color-green">
          <div className="metric-label">{t('inStock')}</div>
          <div className="metric-value">487</div>
          <div className="metric-unit">94%</div>
        </div>
        <div className="metric-card color-amber">
          <div className="metric-label">{t('lowStock')}</div>
          <div className="metric-value">23</div>
          <div className="metric-unit">4%</div>
        </div>
        <div className={`metric-card ${OUT_OF_STOCK_COUNT > 10 ? 'color-red' : ''}`}>
          <div className="metric-label">{t('outOfStock')}</div>
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
        <h3>{t('inventoryBreakdown')}</h3>
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
