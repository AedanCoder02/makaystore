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

const now = Date.now();
const hAgo = (h: number) => new Date(now - h * 3600000).toISOString();
const mAgo = (m: number) => new Date(now - m * 60000).toISOString();

const MOCK_SALES: WorkerSales[] = [
  { workerId: 'W001', name: 'Alice', unitsSold: 12, revenue: 840, conversionRate: 68, dailyTarget: 1200 },
  { workerId: 'W002', name: 'Bob', unitsSold: 8, revenue: 560, conversionRate: 47, dailyTarget: 1200 },
  { workerId: 'W003', name: 'Carol', unitsSold: 15, revenue: 1050, conversionRate: 88, dailyTarget: 1200 },
];

const MOCK_ACTIVITY: ActivityEvent[] = [
  { id: 'AE001', workerName: 'Alice', action: 'viewed Ocean Breeze Tee', timestamp: mAgo(2) },
  { id: 'AE002', workerName: 'Carol', action: 'completed sale #1042 — $95', timestamp: mAgo(5) },
  { id: 'AE003', workerName: 'Bob', action: 'added item to customer cart', timestamp: mAgo(9) },
  { id: 'AE004', workerName: 'Alice', action: 'completed sale #1041 — $65', timestamp: mAgo(18) },
  { id: 'AE005', workerName: 'Carol', action: 'clocked in', timestamp: mAgo(32) },
  { id: 'AE006', workerName: 'Bob', action: 'updated product display', timestamp: mAgo(45) },
  { id: 'AE007', workerName: 'Alice', action: 'completed sale #1040 — $130', timestamp: mAgo(58) },
  { id: 'AE008', workerName: 'Carol', action: 'completed sale #1039 — $85', timestamp: hAgo(1.5) },
  { id: 'AE009', workerName: 'Bob', action: 'clocked in', timestamp: hAgo(2) },
  { id: 'AE010', workerName: 'Alice', action: 'clocked in', timestamp: hAgo(3) },
];

const MOCK_TASKS: BoardTask[] = [
  { id: 'T001', name: 'Restock display shelf', assignedTo: 'Bob', dueTime: '14:00', priority: 'High', status: 'todo' },
  { id: 'T002', name: 'Process online returns', assignedTo: 'Alice', dueTime: '13:00', priority: 'Medium', status: 'in-progress' },
  { id: 'T003', name: 'Update price tags', assignedTo: 'Carol', dueTime: '15:00', priority: 'Low', status: 'done' },
  { id: 'T004', name: 'Greet VIP customer at 2pm', assignedTo: 'Alice', dueTime: '14:00', priority: 'High', status: 'todo' },
  { id: 'T005', name: 'Daily inventory count', assignedTo: 'Carol', dueTime: '17:00', priority: 'Medium', status: 'in-progress' },
  { id: 'T006', name: 'Steam new arrivals', assignedTo: 'Bob', dueTime: '12:00', priority: 'Low', status: 'done' },
];

const MOCK_WORKER_DETAILS: WorkerDetail[] = [
  {
    workerId: 'W001',
    name: 'Alice',
    clockInTime: hAgo(3),
    breakMinutes: 15,
    activeMinutes: 165,
    sales: [
      { saleId: 'S1040', product: 'Coastal Linen Dress', amount: 130, time: '10:42' },
      { saleId: 'S1041', product: 'Summer Wrap Skirt', amount: 65, time: '11:30' },
    ],
    notes: '',
  },
  {
    workerId: 'W002',
    name: 'Bob',
    clockInTime: hAgo(2),
    breakMinutes: 0,
    activeMinutes: 120,
    sales: [],
    notes: '',
  },
  {
    workerId: 'W003',
    name: 'Carol',
    clockInTime: hAgo(2) ,
    breakMinutes: 0,
    activeMinutes: 115,
    sales: [
      { saleId: 'S1039', product: 'Beach Kaftan', amount: 85, time: '10:15' },
      { saleId: 'S1042', product: 'Silk Cami Top', amount: 95, time: '11:55' },
    ],
    notes: '',
  },
];

const MOCK_RANKINGS: WorkerRank[] = [
  { workerId: 'W003', name: 'Carol', salesToday: 1050, tasksCompleted: 2, hoursWorked: 2, score: 92 },
  { workerId: 'W001', name: 'Alice', salesToday: 840, tasksCompleted: 1, hoursWorked: 3, score: 78 },
  { workerId: 'W002', name: 'Bob', salesToday: 560, tasksCompleted: 1, hoursWorked: 2, score: 55 },
];

const MOCK_ALERTS: SupervisorAlert[] = [
  { id: 'AL001', severity: 'warning', message: "Bob hasn't made a sale in 2.5 hours", actionLabel: 'View Bob' },
  { id: 'AL002', severity: 'critical', message: "Task 'Restock Display' overdue by 30 min", actionLabel: 'Open Task' },
  { id: 'AL003', severity: 'warning', message: 'Carol clock-in time anomaly detected', actionLabel: 'Review' },
];

const MOCK_SHIFTS: ShiftRow[] = [
  {
    workerId: 'W001',
    name: 'Alice',
    scheduledStart: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
    scheduledEnd: new Date(new Date().setHours(17, 0, 0, 0)).toISOString(),
    actualClockIn: hAgo(3),
    status: 'on-shift',
  },
  {
    workerId: 'W002',
    name: 'Bob',
    scheduledStart: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
    scheduledEnd: new Date(new Date().setHours(18, 0, 0, 0)).toISOString(),
    actualClockIn: hAgo(2),
    status: 'on-shift',
  },
  {
    workerId: 'W003',
    name: 'Carol',
    scheduledStart: new Date(new Date().setHours(9, 30, 0, 0)).toISOString(),
    scheduledEnd: new Date(new Date().setHours(17, 30, 0, 0)).toISOString(),
    actualClockIn: hAgo(2),
    status: 'on-shift',
  },
];

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
      workersStatus: [
        { workerId: 'W001', name: 'Alice', clockedIn: true, startTime: hAgo(3), taskCount: 3 },
        { workerId: 'W002', name: 'Bob', clockedIn: true, startTime: hAgo(2), taskCount: 2 },
        { workerId: 'W003', name: 'Carol', clockedIn: true, startTime: hAgo(2), taskCount: 4 },
      ],
      pendingApprovals: [
        { id: 'APR001', workerId: 'W001', workerName: 'Alice', action: 'clock-in', timestamp: new Date().toISOString() },
      ],
      salesData: MOCK_SALES,
      activityEvents: MOCK_ACTIVITY,
      tasks: MOCK_TASKS,
      workerDetails: MOCK_WORKER_DETAILS,
      rankings: MOCK_RANKINGS,
      alerts: MOCK_ALERTS,
      shifts: MOCK_SHIFTS,

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
