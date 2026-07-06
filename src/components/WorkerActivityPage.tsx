'use client';

import { useWorkerActivity } from '@/hooks/useWorkerActivity';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';
import StatusCard from './StatusCard';
import ClockInOutButton from './ClockInOutButton';
import TaskListWorker from './TaskListWorker';
import ActivityLogWorker from './ActivityLogWorker';
import { useEffect } from 'react';

export default function WorkerActivityPage() {
  const activity = useWorkerActivity();
  const tutorialStore = useTutorialStore();
  const tutorialUI = useTutorialOverlay('worker-clock-in');
  const completed = tutorialStore.completed;

  // Show tutorial on first visit
  useEffect(() => {
    if (!completed.has('worker-clock-in')) {
      tutorialStore.showTutorial('worker-clock-in');
    }
  }, []);

  return (
    <div className="worker-activity-container">
      <div className="activity-header">
        <h1>My Activity</h1>
        <button
          className="help-button"
          onClick={() => tutorialStore.showTutorial('worker-clock-in')}
          aria-label="Show tutorial"
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
