'use client';

import { useState } from 'react';
import { FileBarChart2 } from 'lucide-react';
import SalesReport from '@/components/SalesReport';
import CostMarginReport from '@/components/CostMarginReport';
import GoalsReport from '@/components/GoalsReport';
import StockReport from '@/components/StockReport';
import RotationReport from '@/components/RotationReport';
import type { DateRange } from '@/components/AdminReportsDashboard';

type ReportTab = 'sales' | 'cost' | 'goals' | 'stock' | 'rotation';

const TABS: { id: ReportTab; label: string }[] = [
  { id: 'sales',    label: 'Ventas' },
  { id: 'cost',     label: 'Costo/Margen' },
  { id: 'goals',    label: 'Metas' },
  { id: 'stock',    label: 'Inventario' },
  { id: 'rotation', label: 'Rotación' },
];

const DATE_LABELS: Record<DateRange, string> = {
  '7d': '7 días', '30d': '30 días', '3m': '3 meses', 'all': 'Todo',
};

export default function SupervisorReportsPage() {
  const [tab, setTab] = useState<ReportTab>('sales');
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  return (
    <div className="sup-page">
      <div className="sup-page-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileBarChart2 size={22} className="sup-page-icon" />
          <h1 className="sup-page-title">Reportes</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto' }}>
          {(['7d', '30d', '3m', 'all'] as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              style={{
                padding: '0.3rem 0.7rem', borderRadius: 8, fontSize: '0.75rem', fontFamily: 'var(--font-montserrat)',
                fontWeight: 600, cursor: 'pointer', border: '1px solid',
                borderColor: dateRange === r ? 'var(--makay-peachy-rose)' : '#e5e7eb',
                background: dateRange === r ? 'var(--makay-peachy-rose)' : '#fff',
                color: dateRange === r ? '#fff' : 'var(--makay-mauve)',
              }}
            >{DATE_LABELS[r]}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '0.45rem 1rem', borderRadius: 100, fontSize: '0.78rem', fontFamily: 'var(--font-montserrat)',
              fontWeight: 600, cursor: 'pointer', border: '1px solid',
              borderColor: tab === t.id ? 'var(--makay-dark-navy)' : '#e5e7eb',
              background: tab === t.id ? 'var(--makay-dark-navy)' : '#fff',
              color: tab === t.id ? '#fff' : 'var(--makay-mauve)',
            }}
          >{t.label}</button>
        ))}
      </div>

      <div>
        {tab === 'sales'    && <SalesReport dateRange={dateRange} />}
        {tab === 'cost'     && <CostMarginReport dateRange={dateRange} />}
        {tab === 'goals'    && <GoalsReport />}
        {tab === 'stock'    && <StockReport />}
        {tab === 'rotation' && <RotationReport dateRange={dateRange} />}
      </div>
    </div>
  );
}
