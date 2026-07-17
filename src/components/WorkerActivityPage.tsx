'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useWorkerActivity } from '@/hooks/useWorkerActivity';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';
import StatusCard from './StatusCard';
import ClockInOutButton from './ClockInOutButton';
import TaskListWorker from './TaskListWorker';
import ActivityLogWorker from './ActivityLogWorker';

export default function WorkerActivityPage() {
  const activity = useWorkerActivity();
  const tutorialStore = useTutorialStore();
  const tutorialUI = useTutorialOverlay('worker-clock-in');
  const t = useTranslations('worker');
  const tAdmin = useTranslations('admin');

  useEffect(() => {
    if (!tutorialStore.isCompleted('worker-clock-in')) {
      tutorialStore.showTutorial('worker-clock-in');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="worker-activity-container">
      <div className="activity-header">
        <h1>{t('myActivity')}</h1>
        <button
          className="help-button"
          onClick={() => tutorialStore.showTutorial('worker-clock-in')}
          aria-label={tAdmin('showTutorial')}
        >
          ?
        </button>
      </div>

      <div className="activity-content">
        <StatusCard
          clockedIn={activity.clockedIn}
          startTime={activity.currentShift?.startTime}
        />

        <ClockInOutButton
          clockedIn={activity.clockedIn}
          onClockIn={activity.clockIn}
          onClockOut={activity.clockOut}
        />

        <TaskListWorker tasks={activity.tasks} />

        <ActivityLogWorker activityLog={activity.activityLog} />
      </div>

      {tutorialUI}
    </div>
  );
}
