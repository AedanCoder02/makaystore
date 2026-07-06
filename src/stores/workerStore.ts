import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Activity {
  timestamp: string;
  action: 'clock-in' | 'clock-out';
}

interface WorkerState {
  workerId: string;
  clockedIn: boolean;
  currentShift: { startTime: string; taskIds: string[] } | null;
  activityLog: Activity[];
  clockIn: (workerId: string) => void;
  clockOut: (workerId: string) => void;
  getActivityLog: () => Activity[];
}

export const useWorkerStore = create<WorkerState>()(
  persist(
    (set, get) => ({
      workerId: '',
      clockedIn: false,
      currentShift: null,
      activityLog: [],

      clockIn: (workerId: string) =>
        set((state) => ({
          workerId,
          clockedIn: true,
          currentShift: { startTime: new Date().toISOString(), taskIds: [] },
          activityLog: [
            ...state.activityLog,
            { timestamp: new Date().toISOString(), action: 'clock-in' },
          ],
        })),

      clockOut: (workerId: string) =>
        set((state) => ({
          clockedIn: false,
          currentShift: null,
          activityLog: [
            ...state.activityLog,
            { timestamp: new Date().toISOString(), action: 'clock-out' },
          ],
        })),

      getActivityLog: () => get().activityLog,
    }),
    { name: 'makay-worker' }
  )
);
