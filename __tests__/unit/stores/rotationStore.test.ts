/**
 * Unit tests for useRotationStore (Zustand)
 */
import { act } from '@testing-library/react';

const getStore = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useRotationStore } = require('@/stores/rotationStore');
  return useRotationStore;
};

beforeEach(() => {
  jest.resetModules();
});

describe('useRotationStore', () => {
  describe('addRotation', () => {
    it('adds a rotation job to the queue', () => {
      const store = getStore();
      act(() => { store.getState().addRotation('prod-001', 'active', 'paused', '2026-08-01'); });

      const { queue } = store.getState();
      expect(queue).toHaveLength(1);
      expect(queue[0].productId).toBe('prod-001');
      expect(queue[0].currentStatus).toBe('active');
      expect(queue[0].newStatus).toBe('paused');
      expect(queue[0].scheduledDate).toBe('2026-08-01');
    });
  });

  describe('bulkRotate', () => {
    it('adds one rotation job per product', () => {
      const store = getStore();
      act(() => { store.getState().bulkRotate(['prod-001', 'prod-002', 'prod-003'], 'archived'); });

      const { queue } = store.getState();
      expect(queue).toHaveLength(3);
      queue.forEach((job) => {
        expect(job.newStatus).toBe('archived');
        expect(job.completedDate).toBeDefined();
      });
    });
  });

  describe('selectProduct / deselectProduct / clearSelection', () => {
    it('toggles product selection correctly', () => {
      const store = getStore();

      act(() => { store.getState().selectProduct('prod-001'); });
      act(() => { store.getState().selectProduct('prod-002'); });
      expect(store.getState().selectedProducts).toHaveLength(2);

      act(() => { store.getState().deselectProduct('prod-001'); });
      expect(store.getState().selectedProducts).toEqual(['prod-002']);

      act(() => { store.getState().clearSelection(); });
      expect(store.getState().selectedProducts).toHaveLength(0);
    });

    it('does not duplicate selections', () => {
      const store = getStore();
      act(() => { store.getState().selectProduct('prod-001'); });
      act(() => { store.getState().selectProduct('prod-001'); });
      expect(store.getState().selectedProducts).toHaveLength(1);
    });
  });

  describe('completeRotation', () => {
    it('moves a rotation from queue to history', () => {
      const store = getStore();
      act(() => { store.getState().addRotation('prod-001', 'active', 'paused'); });

      const rotationId = store.getState().queue[0].id;
      act(() => { store.getState().completeRotation(rotationId); });

      expect(store.getState().queue).toHaveLength(0);
      expect(store.getState().history).toHaveLength(1);
      expect(store.getState().history[0].productId).toBe('prod-001');
    });
  });
});
