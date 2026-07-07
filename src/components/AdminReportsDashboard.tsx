'use client';

import { useEffect } from 'react';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';
import { useReportsStore, type ReportTab } from '@/stores/reportsStore';
import SalesReport from './SalesReport';
import CostMarginReport from './CostMarginReport';
import GoalsReport from './GoalsReport';
import StockReport from './StockReport';
import RotationReport from './RotationReport';

const REPORT_TABS: { id: ReportTab; label: string; icon: string }[] = [
  { id: 'sales', label: 'Sales', icon: '📊' },
  { id: 'cost', label: 'Cost/Margin', icon: '💰' },
  { id: 'goals', label: 'Goals', icon: '🎯' },
  { id: 'stock', label: 'Stock', icon: '📦' },
  { id: 'rotation', label: 'Rotation', icon: '🔄' },
];

function renderReport(activeTab: ReportTab) {
  switch (activeTab) {
    case 'sales': return <SalesReport />;
    case 'cost': return <CostMarginReport />;
    case 'goals': return <GoalsReport />;
    case 'stock': return <StockReport />;
    case 'rotation': return <RotationReport />;
  }
}

export default function AdminReportsDashboard() {
  const { activeTab, setActiveTab } = useReportsStore();
  const tutorialStore = useTutorialStore();
  const tutorialUI = useTutorialOverlay('reports-tour');

  useEffect(() => {
    if (!tutorialStore.completed.has('reports-tour')) {
      tutorialStore.showTutorial('reports-tour');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="admin-layout">
      <main className="admin-main">
        <div className="dashboard-header">
          <h1>Reports &amp; Analytics</h1>
          <button
            className="help-button"
            onClick={() => tutorialStore.showTutorial('reports-tour')}
            aria-label="Show tutorial"
          >
            ?
          </button>
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
          {renderReport(activeTab)}
        </div>

        {tutorialUI}
      </main>
    </div>
  );
}
