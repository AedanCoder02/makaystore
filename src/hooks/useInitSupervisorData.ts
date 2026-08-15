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

      // Derive rankings from sellers (salesThisMonth) + today's activity for hours
      if (Array.isArray(sellers) && sellers.length > 0) {
        const workerMap = new Map<string, { clockedIn: boolean; startTime?: string }>();
        for (const s of sellers as { workerId: string; clockedIn: boolean; startTime?: string }[]) {
          workerMap.set(s.workerId, s);
        }

        const rankings = (sellers as {
          workerId: string; name: string; salesThisMonth?: number; ordersThisMonth?: number;
          clockedIn?: boolean; startTime?: string;
        }[]).map((s) => {
          const revenue = s.salesThisMonth ?? 0;
          const orders = s.ordersThisMonth ?? 0;
          const hoursWorked = s.clockedIn && s.startTime
            ? parseFloat(((Date.now() - new Date(s.startTime).getTime()) / 3600000).toFixed(1))
            : 0;
          return {
            workerId: s.workerId,
            name: s.name,
            salesToday: revenue,
            tasksCompleted: orders,
            hoursWorked,
            score: Math.round(revenue + orders * 5 + hoursWorked * 2),
          };
        }).filter((r) => r.score > 0 || r.hoursWorked > 0);

        useSupervisorStore.setState({ rankings });
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
