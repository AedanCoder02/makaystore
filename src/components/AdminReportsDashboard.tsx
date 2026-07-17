'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';
import { useReportsStore, type ReportTab } from '@/stores/reportsStore';
import SalesReport from './SalesReport';
import CostMarginReport from './CostMarginReport';
import GoalsReport from './GoalsReport';
import StockReport from './StockReport';
import RotationReport from './RotationReport';

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
  const t = useTranslations('reports');
  const tAdmin = useTranslations('admin');

  const REPORT_TABS: { id: ReportTab; label: string; icon: string }[] = [
    { id: 'sales', label: t('sales'), icon: '📊' },
    { id: 'cost', label: t('costMargin'), icon: '💰' },
    { id: 'goals', label: t('goals'), icon: '🎯' },
    { id: 'stock', label: t('stock'), icon: '📦' },
    { id: 'rotation', label: t('rotation'), icon: '🔄' },
  ];

  useEffect(() => {
    if (!tutorialStore.isCompleted('reports-tour')) {
      tutorialStore.showTutorial('reports-tour');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="admin-layout">
      <main className="admin-main">
        <div className="dashboard-header">
          <h1>{t('analytics')}</h1>
          <button
            className="help-button"
            onClick={() => tutorialStore.showTutorial('reports-tour')}
            aria-label={tAdmin('showTutorial')}
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
