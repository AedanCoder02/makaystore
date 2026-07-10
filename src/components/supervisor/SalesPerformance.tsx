'use client';

import { TrendingUp } from 'lucide-react';

export interface WorkerSales {
  workerId: string;
  name: string;
  unitsSold: number;
  revenue: number;
  conversionRate: number;
  dailyTarget: number;
}

interface SalesPerformanceProps {
  salesData: WorkerSales[];
}

export default function SalesPerformance({ salesData }: SalesPerformanceProps) {
  return (
    <div className="sup-section">
      <div className="sup-section-header">
        <TrendingUp size={20} className="sup-section-icon" />
        <h2 className="sup-section-title">Sales Performance</h2>
      </div>
      <div className="sales-grid">
        {salesData.map((worker) => {
          const pct = Math.min(100, Math.round((worker.revenue / worker.dailyTarget) * 100));
          return (
            <div key={worker.workerId} className="sales-worker-card">
              <div className="sales-worker-name">{worker.name}</div>
              <div className="sales-stats-row">
                <span className="sales-stat-item">
                  <span className="sales-stat-value">{worker.unitsSold}</span>
                  <span className="sales-stat-label">units</span>
                </span>
                <span className="sales-stat-item">
                  <span className="sales-stat-value">${worker.revenue}</span>
                  <span className="sales-stat-label">revenue</span>
                </span>
                <span className="sales-stat-item">
                  <span className="sales-stat-value">{worker.conversionRate}%</span>
                  <span className="sales-stat-label">conv.</span>
                </span>
              </div>
              <div className="sales-progress-wrapper">
                <div className="sales-progress-bar">
                  <div
                    className="sales-progress-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="sales-progress-label">{pct}% of ${worker.dailyTarget} target</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
