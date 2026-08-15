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

  return {
    supervisorId: store.supervisorId || user?.id || '',
    workersStatus: store.workersStatus,
    pendingApprovals,
    totalWorkers: store.workersStatus.length,
    workersClockIn,
    totalHours: totalHours.toFixed(1),
    approveActivity: store.approveActivity,
    rejectActivity: store.rejectActivity,
  };
};
