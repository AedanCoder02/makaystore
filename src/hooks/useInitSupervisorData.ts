'use client';

import { useEffect } from 'react';
import { useSupervisorStore } from '@/stores/supervisorStore';

export function useInitSupervisorData() {
  const store = useSupervisorStore();

  useEffect(() => {
    async function load() {
      const [sellers, activity, sales, tasks] = await Promise.all([
        fetch('/api/supervisor/sellers').then((r) => r.json()).catch(() => []),
        fetch('/api/supervisor/activity').then((r) => r.json()).catch(() => []),
        fetch('/api/supervisor/sales').then((r) => r.json()).catch(() => []),
        fetch('/api/supervisor/tasks').then((r) => r.json()).catch(() => []),
      ]);

      // Map sellers → WorkerStatus[]
      if (Array.isArray(sellers) && sellers.length > 0) {
        store.workersStatus.splice(0);
        const workerStatuses = sellers.map((s: {
          workerId: string; name: string; clockedIn: boolean; startTime?: string;
        }) => ({
          workerId: s.workerId,
          name: s.name,
          clockedIn: s.clockedIn,
          startTime: s.startTime ?? undefined,
          taskCount: 0,
        }));
        useSupervisorStore.setState({ workersStatus: workerStatuses });
      }

      // Map activity → ActivityEvent[]
      if (Array.isArray(activity)) {
        useSupervisorStore.setState({ activityEvents: activity });
      }

      // Map sales → WorkerSales[]
      if (Array.isArray(sales)) {
        useSupervisorStore.setState({ salesData: sales });
      }

      // Map tasks → BoardTask[]
      if (Array.isArray(tasks)) {
        useSupervisorStore.setState({ tasks });
      }

      // Pending approvals = activity entries with status=pending
      if (Array.isArray(activity)) {
        const pending = activity
          .filter((a: { status: string }) => a.status === 'pending')
          .map((a: { id: string; workerId: string; workerName: string; action: string; timestamp: string }) => ({
            id: a.id,
            workerId: a.workerId,
            workerName: a.workerName,
            action: (a.action.includes('in') ? 'clock-in' : 'clock-out') as 'clock-in' | 'clock-out',
            timestamp: a.timestamp,
          }));
        useSupervisorStore.setState({ pendingApprovals: pending });
      }
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
