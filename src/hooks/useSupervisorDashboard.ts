'use client';

import { useSupervisorStore } from '@/stores/supervisorStore';
import { useUser } from '@clerk/nextjs';

export const useSupervisorDashboard = () => {
  const { user } = useUser();
  const store = useSupervisorStore();

  const pendingApprovals = store.getPendingApprovals();
  const workersClockIn = store.workersStatus.filter((w) => w.clockedIn).length;
  const totalHours = store.workersStatus
    .filter((w) => w.startTime)
    .reduce((sum, w) => {
      const elapsed = (Date.now() - new Date(w.startTime!).getTime()) / 3600000;
      return sum + elapsed;
    }, 0);

  const approveActivity = async (approvalId: string) => {
    await fetch('/api/supervisor/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activityId: approvalId, action: 'approve' }),
    }).catch(() => {});
    store.approveActivity(approvalId);
  };

  const rejectActivity = async (approvalId: string) => {
    await fetch('/api/supervisor/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activityId: approvalId, action: 'reject' }),
    }).catch(() => {});
    store.rejectActivity(approvalId);
  };

  return {
    supervisorId: store.supervisorId || user?.id || '',
    workersStatus: store.workersStatus,
    pendingApprovals,
    totalWorkers: store.workersStatus.length,
    workersClockIn,
    totalHours: totalHours.toFixed(1),
    approveActivity,
    rejectActivity,
  };
};
