'use client';

import { useEffect, useState } from 'react';
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
import WorkerDetailPanel from './supervisor/WorkerDetailPanel';
import type { WorkerDetail } from './supervisor/WorkerDetailPanel';
import PerformanceRankings from './supervisor/PerformanceRankings';
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
  const [selectedWorker, setSelectedWorker] = useState<WorkerDetail | null>(null);

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
        {/* Existing 3 sections */}
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

        {/* New sections */}
        <SalesPerformance salesData={store.salesData} />

        <LiveActivityFeed events={store.activityEvents} />

        <TaskBoard tasks={store.tasks} />

        {/* Worker Detail — clickable names inline card */}
        <div className="sup-section">
          <div className="sup-section-header">
            <span className="sup-section-icon-placeholder" />
            <h2 className="sup-section-title">Worker Profiles</h2>
            <span className="sup-section-hint">Click a worker to view details</span>
          </div>
          <div className="worker-profile-list">
            {store.workerDetails.map((wd) => (
              <button
                key={wd.workerId}
                className="worker-profile-chip"
                onClick={() => setSelectedWorker(wd)}
              >
                <span className="worker-profile-chip-avatar">
                  {wd.name[0]}
                </span>
                <span className="worker-profile-chip-name">{wd.name}</span>
                <span className="worker-profile-chip-arrow">›</span>
              </button>
            ))}
          </div>
        </div>

        <PerformanceRankings rankings={store.rankings} />

        <AlertsPanel
          alerts={store.alerts}
          onDismiss={store.dismissAlert}
        />

        <ShiftOverview shifts={store.shifts} />

        <QuickActions workers={workerPickerList} />
      </div>

      {/* Worker detail slide-in panel */}
      <WorkerDetailPanel
        worker={selectedWorker}
        onClose={() => setSelectedWorker(null)}
        onNotesChange={(workerId, notes) => {
          store.updateWorkerNotes(workerId, notes);
          setSelectedWorker((prev) => prev ? { ...prev, notes } : null);
        }}
      />

      {tutorialUI}
    </div>
  );
}
