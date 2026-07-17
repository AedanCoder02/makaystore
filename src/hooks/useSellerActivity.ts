'use client';

import { useCallback, useEffect, useState } from 'react';

export interface ActivityEntry {
  id: number;
  type: 'clock-in' | 'clock-out';
  note: string | null;
  status: string;
  created_at: string;
}

interface SellerActivityState {
  clockedIn: boolean;
  clockInTime: string | null;
  hoursWorked: number;
  todaySessions: number;
  log: ActivityEntry[];
  loading: boolean;
  error: string;
}

export function useSellerActivity() {
  const [state, setState] = useState<SellerActivityState>({
    clockedIn: false,
    clockInTime: null,
    hoursWorked: 0,
    todaySessions: 0,
    log: [],
    loading: true,
    error: '',
  });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/seller/activity');
      if (!res.ok) throw new Error('Failed to load activity');
      const data = await res.json();
      setState((s) => ({ ...s, ...data, loading: false, error: '' }));
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: (e as Error).message }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const clockIn = async () => {
    const res = await fetch('/api/seller/clock-in', { method: 'POST' });
    if (!res.ok) {
      const d = await res.json();
      setState((s) => ({ ...s, error: d.error ?? 'Clock-in failed' }));
      return;
    }
    await refresh();
  };

  const clockOut = async () => {
    const res = await fetch('/api/seller/clock-out', { method: 'POST' });
    if (!res.ok) {
      const d = await res.json();
      setState((s) => ({ ...s, error: d.error ?? 'Clock-out failed' }));
      return;
    }
    await refresh();
  };

  return { ...state, clockIn, clockOut, refresh };
}
