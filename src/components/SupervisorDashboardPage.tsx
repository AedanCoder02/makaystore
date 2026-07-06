'use client';

import { useSupervisorDashboard } from '@/hooks/useSupervisorDashboard';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';
import WorkerStatusOverview from './WorkerStatusOverview';
import ActivityApprovalList from './ActivityApprovalList';
import DailySummaryCard from './DailySummaryCard';
import { useEffect } from 'react';

export default function SupervisorDashboardPage() {
  const dashboard = useSupervisorDashboard();
  const tutorialStore = useTutorialStore();
  const tutorialUI = useTutorialOverlay('supervisor-approve');
  const completed = tutorialStore.completed;

  useEffect(() => {
    if (!completed.has('supervisor-approve')) {
      tutorialStore.showTutorial('supervisor-approve');
    }
  }, []);

  return (
    <div className="supervisor-dashboard-container">
      <div className="dashboard-header">
        <h1>Supervisor Dashboard</h1>
        <button
          className="help-button"
          onClick={() => tutorialStore.showTutorial('supervisor-approve')}
          aria-label="Show tutorial"
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
