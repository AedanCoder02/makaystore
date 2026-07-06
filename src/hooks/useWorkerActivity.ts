'use client';

import { useWorkerStore, Activity } from '@/stores/workerStore';
import { useUser } from '@clerk/nextjs';
import { useMemo } from 'react';

// Mock tasks for today - can be extended to fetch from API
const mockTasksForWorker = [
  {
    id: 'task-1',
    title: 'Process Inventory',
    description: 'Check and update product stock',
    status: 'pending' as const,
    priority: 'high' as const,
    assignedWorker: 'worker-1',
  },
  {
    id: 'task-2',
    title: 'Pack Orders',
    description: 'Pack items for today\'s shipments',
    status: 'pending' as const,
    priority: 'high' as const,
    assignedWorker: 'worker-1',
  },
  {
    id: 'task-3',
    title: 'Organize Display',
    description: 'Arrange products in display area',
    status: 'pending' as const,
    priority: 'medium' as const,
    assignedWorker: 'worker-1',
  },
  {
    id: 'task-4',
    title: 'Label Products',
    description: 'Apply price labels to new items',
    status: 'pending' as const,
    priority: 'low' as const,
    assignedWorker: 'worker-1',
  },
];

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedWorker?: string;
}

export const useWorkerActivity = () => {
  const { user } = useUser();
  const store = useWorkerStore();

  const workerId = useMemo(() => {
    return store.workerId || user?.id || 'worker-1';
  }, [store.workerId, user?.id]);

  const tasks: Task[] = useMemo(() => {
    return mockTasksForWorker;
  }, []);

  const activityLog: Activity[] = useMemo(() => {
    return store.getActivityLog();
  }, [store]);

  return {
    workerId,
    clockedIn: store.clockedIn,
    currentShift: store.currentShift,
    tasks,
    activityLog,
    clockIn: () => store.clockIn(workerId),
    clockOut: () => store.clockOut(workerId),
  };
};
