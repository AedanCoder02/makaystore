/**
 * Unit tests for useWorkerStore (Zustand)
 */
import { act } from '@testing-library/react';

const getStore = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useWorkerStore } = require('@/stores/workerStore');
  return useWorkerStore;
};

beforeEach(() => {
  jest.resetModules();
});

describe('useWorkerStore', () => {
  describe('clockIn', () => {
    it('sets clockedIn to true and starts a shift', () => {
      const store = getStore();
      act(() => { store.getState().clockIn('worker-001'); });

      const state = store.getState();
      expect(state.clockedIn).toBe(true);
      expect(state.workerId).toBe('worker-001');
      expect(state.currentShift).not.toBeNull();
      expect(state.currentShift.startTime).toBeDefined();
    });

    it('appends a clock-in activity to the log', () => {
      const store = getStore();
      act(() => { store.getState().clockIn('worker-001'); });

      const { activityLog } = store.getState();
      expect(activityLog).toHaveLength(1);
      expect(activityLog[0].action).toBe('clock-in');
    });
  });

  describe('clockOut', () => {
    it('clears the shift and sets clockedIn to false', () => {
      const store = getStore();
      act(() => { store.getState().clockIn('worker-001'); });
      act(() => { store.getState().clockOut('worker-001'); });

      const state = store.getState();
      expect(state.clockedIn).toBe(false);
      expect(state.currentShift).toBeNull();
    });

    it('appends a clock-out entry after clock-in', () => {
      const store = getStore();
      act(() => { store.getState().clockIn('worker-001'); });
      act(() => { store.getState().clockOut('worker-001'); });

      const { activityLog } = store.getState();
      expect(activityLog).toHaveLength(2);
      expect(activityLog[1].action).toBe('clock-out');
    });
  });

  describe('getActivityLog', () => {
    it('returns the activity log', () => {
      const store = getStore();
      act(() => { store.getState().clockIn('worker-001'); });

      const log = store.getState().getActivityLog();
      expect(Array.isArray(log)).toBe(true);
      expect(log.length).toBeGreaterThan(0);
    });
  });
});
