import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  approveActivity: (approvalId: string) => void;
  rejectActivity: (approvalId: string) => void;
  getPendingApprovals: () => Approval[];
}

export const useSupervisorStore = create<SupervisorState>()(
  persist(
    (set, get) => ({
      supervisorId: '',
      workersStatus: [
        { workerId: 'W001', name: 'Alice', clockedIn: true, startTime: new Date(Date.now() - 3600000).toISOString(), taskCount: 3 },
        { workerId: 'W002', name: 'Bob', clockedIn: false, taskCount: 2 },
        { workerId: 'W003', name: 'Carol', clockedIn: true, startTime: new Date(Date.now() - 7200000).toISOString(), taskCount: 4 },
      ],
      pendingApprovals: [
        { id: 'APR001', workerId: 'W001', workerName: 'Alice', action: 'clock-in', timestamp: new Date().toISOString() },
      ],

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
    }),
    { name: 'makay-supervisor' }
  )
);
