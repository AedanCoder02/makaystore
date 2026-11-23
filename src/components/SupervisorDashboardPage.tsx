'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSupervisorDashboard } from '@/hooks/useSupervisorDashboard';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';
import { useSupervisorStore } from '@/stores/supervisorStore';
import { useInitSupervisorData } from '@/hooks/useInitSupervisorData';
import WorkerStatusOverview from './WorkerStatusOverview';
import ActivityApprovalList from './ActivityApprovalList';
import DailySummaryCard from './DailySummaryCard';
import SalesPerformance from './supervisor/SalesPerformance';
import LiveActivityFeed from './supervisor/LiveActivityFeed';
import TaskBoard from './supervisor/TaskBoard';
import AlertsPanel from './supervisor/AlertsPanel';
import ShiftOverview from './supervisor/ShiftOverview';
import QuickActions from './supervisor/QuickActions';

export default function SupervisorDashboardPage() {
  const t = useTranslations('supervisor');
  const tTutorial = useTranslations('tutorial');
  const dashboard = useSupervisorDashboard();
  const tutorialStore = useTutorialStore();
  const tutorialUI = useTutorialOverlay('supervisor-approve');
  useInitSupervisorData();

  const store = useSupervisorStore();

  useEffect(() => {
    if (!tutorialStore.isCompleted('supervisor-approve')) {
      tutorialStore.showTutorial('supervisor-approve');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const workerPickerList = store.workersStatus.map((w) => ({
    workerId: w.workerId,
    name: w.name,
  }));

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
          onApprove={async (id) => {
            await fetch('/api/supervisor/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ activityId: id, action: 'approve' }),
            }).catch(() => null);
            dashboard.approveActivity(id);
          }}
          onReject={async (id) => {
            await fetch('/api/supervisor/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ activityId: id, action: 'reject' }),
            }).catch(() => null);
            dashboard.rejectActivity(id);
          }}
        />

        <QuickActions workers={workerPickerList} />

        <TaskBoard />

        <LiveActivityFeed />

        <SalesPerformance salesData={store.salesData} />

        <AlertsPanel
          alerts={store.alerts}
          onDismiss={store.dismissAlert}
        />

        <ShiftOverview shifts={store.shifts} />

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
