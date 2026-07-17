import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkerSales } from '@/components/supervisor/SalesPerformance';
import type { ActivityEvent } from '@/components/supervisor/LiveActivityFeed';
import type { BoardTask } from '@/components/supervisor/TaskBoard';
import type { WorkerDetail } from '@/components/supervisor/WorkerDetailPanel';
import type { WorkerRank } from '@/components/supervisor/PerformanceRankings';
import type { SupervisorAlert } from '@/components/supervisor/AlertsPanel';
import type { ShiftRow } from '@/components/supervisor/ShiftOverview';

export interface WorkerStatus {
  workerId: string;
  name: string;
  clockedIn: boolean;
  startTime?: string;
  taskCount: number;
}

export interface Approval {
  id: string;
  workerId: string;
  workerName: string;
  action: 'clock-in' | 'clock-out';
  timestamp: string;
  approved?: boolean;
}


interface SupervisorState {
  supervisorId: string;
  workersStatus: WorkerStatus[];
  pendingApprovals: Approval[];
  salesData: WorkerSales[];
  activityEvents: ActivityEvent[];
  tasks: BoardTask[];
  workerDetails: WorkerDetail[];
  rankings: WorkerRank[];
  alerts: SupervisorAlert[];
  shifts: ShiftRow[];
  approveActivity: (approvalId: string) => void;
  rejectActivity: (approvalId: string) => void;
  getPendingApprovals: () => Approval[];
  updateWorkerNotes: (workerId: string, notes: string) => void;
  dismissAlert: (alertId: string) => void;
}

export const useSupervisorStore = create<SupervisorState>()(
  persist(
    (set, get) => ({
      supervisorId: '',
      workersStatus: [],
      pendingApprovals: [],
      salesData: [],
      activityEvents: [],
      tasks: [],
      workerDetails: [],
      rankings: [],
      alerts: [],
      shifts: [],

      approveActivity: (approvalId: string) =>
        set((state) => ({
          pendingApprovals: state.pendingApprovals.map((item) =>
            item.id === approvalId ? { ...item, approved: true } : item
          ),
        })),

      rejectActivity: (approvalId: string) =>
        set((state) => ({
          pendingApprovals: state.pendingApprovals.filter((item) => item.id !== approvalId),
        })),

      getPendingApprovals: () => get().pendingApprovals.filter((item) => !item.approved),

      updateWorkerNotes: (workerId: string, notes: string) =>
        set((state) => ({
          workerDetails: state.workerDetails.map((d) =>
            d.workerId === workerId ? { ...d, notes } : d
          ),
        })),

      dismissAlert: (alertId: string) =>
        set((state) => ({
          alerts: state.alerts.filter((a) => a.id !== alertId),
        })),
    }),
    { name: 'makay-supervisor' }
  )
);
