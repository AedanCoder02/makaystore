'use client';

import { useEffect, useState, Component, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';
import { useReportsStore, type ReportTab } from '@/stores/reportsStore';
import AdminSidebar from './AdminSidebar';
import SalesReport from './SalesReport';
import CostMarginReport from './CostMarginReport';
import GoalsReport from './GoalsReport';
import StockReport from './StockReport';
import RotationReport from './RotationReport';

export type DateRange = '7d' | '30d' | '3m' | 'all';

class ReportErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', color: 'var(--makay-mauve)', textAlign: 'center' }}>
          <p style={{ marginBottom: '0.75rem', fontWeight: 600 }}>This report ran into an issue.</p>
          <button
            style={{ fontSize: '0.8rem', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--makay-peachy-rose)' }}
            onClick={() => this.setState({ error: false })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function renderReport(activeTab: ReportTab, dateRange: DateRange) {
  switch (activeTab) {
    case 'sales':    return <SalesReport dateRange={dateRange} />;
    case 'cost':     return <CostMarginReport dateRange={dateRange} />;
    case 'goals':    return <GoalsReport />;
    case 'stock':    return <StockReport />;
    case 'rotation': return <RotationReport dateRange={dateRange} />;
  }
}

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  '7d':  'Last 7 days',
  '30d': 'Last 30 days',
  '3m':  'Last 3 months',
  'all': 'All time',
};

export default function AdminReportsDashboard() {
  const { activeTab, setActiveTab } = useReportsStore();
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const tutorialStore = useTutorialStore();
  const tutorialUI = useTutorialOverlay('reports-tour');
  const t = useTranslations('reports');
  const tAdmin = useTranslations('admin');

  const REPORT_TABS: { id: ReportTab; label: string; icon: string }[] = [
    { id: 'sales',    label: t('sales'),      icon: '📊' },
    { id: 'cost',     label: t('costMargin'), icon: '💰' },
    { id: 'goals',    label: t('goals'),      icon: '🎯' },
    { id: 'stock',    label: t('stock'),      icon: '📦' },
    { id: 'rotation', label: t('rotation'),   icon: '🔄' },
  ];

  useEffect(() => {
    if (!tutorialStore.isCompleted('reports-tour')) {
      tutorialStore.showTutorial('reports-tour');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="dashboard-header">
          <h1>{t('analytics')}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="reports-date-range">
              {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map((r) => (
                <button
                  key={r}
                  className={`date-range-btn${dateRange === r ? ' active' : ''}`}
                  onClick={() => setDateRange(r)}
                >
                  {DATE_RANGE_LABELS[r]}
                </button>
              ))}
            </div>
            <button
              className="help-button"
              onClick={() => tutorialStore.showTutorial('reports-tour')}
              aria-label={tAdmin('showTutorial')}
            >
              ?
            </button>
          </div>
        </div>

        <div className="reports-tabs">
          {REPORT_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="report-content">
          <ReportErrorBoundary key={activeTab}>
            {renderReport(activeTab, dateRange)}
          </ReportErrorBoundary>
        </div>

        {tutorialUI}
      </main>
    </div>
  );
}
