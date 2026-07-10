'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSupervisorDashboard } from '@/hooks/useSupervisorDashboard';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';
import WorkerStatusOverview from './WorkerStatusOverview';
import ActivityApprovalList from './ActivityApprovalList';
import DailySummaryCard from './DailySummaryCard';

export default function SupervisorDashboardPage() {
  const t = useTranslations('supervisor');
  const tTutorial = useTranslations('tutorial');
  const dashboard = useSupervisorDashboard();
  const tutorialStore = useTutorialStore();
  const tutorialUI = useTutorialOverlay('supervisor-approve');
  const completed = tutorialStore.completed;

  useEffect(() => {
    if (!completed.includes('supervisor-approve')) {
      tutorialStore.showTutorial('supervisor-approve');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="supervisor-dashboard-container">
      <div className="dashboard-header">
        <h1>{t('dashboard')}</h1>
        <button
          className="help-button"
          onClick={() => tutorialStore.showTutorial('supervisor-approve')}
          aria-label={tTutorial('next')}
        >
          ?
        </button>
      </div>

      <div className="dashboard-content">
        <WorkerStatusOverview workersStatus={dashboard.workersStatus} />
        <ActivityApprovalList
          pendingApprovals={dashboard.pendingApprovals}
          onApprove={dashboard.approveActivity}
          onReject={dashboard.rejectActivity}
        />
        <DailySummaryCard
          totalWorkers={dashboard.totalWorkers}
          workersClockIn={dashboard.workersClockIn}
          totalHours={dashboard.totalHours}
        />
      </div>

      {tutorialUI}
    </div>
  );
}
