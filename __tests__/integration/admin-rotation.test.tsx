/**
 * Integration test: Admin Product Rotation
 * Simulates: select products → bulk rotate → verify queue updated
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

jest.mock('next-intl', () => require('../mocks/nextIntl.js'));


// ─── Test the rotation store end-to-end ───────────────────────────────────────

describe('Admin Rotation: store integration', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('full rotation workflow: select → bulk rotate → complete', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useRotationStore } = require('@/stores/rotationStore');

    // Step 1: Select products
    act(() => { useRotationStore.getState().selectProduct('prod-001'); });
    act(() => { useRotationStore.getState().selectProduct('prod-002'); });
    act(() => { useRotationStore.getState().selectProduct('prod-003'); });

    expect(useRotationStore.getState().selectedProducts).toHaveLength(3);

    // Step 2: Bulk rotate selected products
    const selected = useRotationStore.getState().selectedProducts;
    act(() => { useRotationStore.getState().bulkRotate(selected, 'archived'); });

    // Step 3: Verify queue has 3 jobs
    const { queue } = useRotationStore.getState();
    expect(queue).toHaveLength(3);
    queue.forEach((job: { newStatus: string }) => {
      expect(job.newStatus).toBe('archived');
    });

    // Step 4: Clear selection after bulk rotate
    act(() => { useRotationStore.getState().clearSelection(); });
    expect(useRotationStore.getState().selectedProducts).toHaveLength(0);

    // Step 5: Complete the first rotation
    const firstId = useRotationStore.getState().queue[0].id;
    act(() => { useRotationStore.getState().completeRotation(firstId); });

    expect(useRotationStore.getState().queue).toHaveLength(2);
    expect(useRotationStore.getState().history).toHaveLength(1);
  });

  it('scheduled rotation appears in queue with correct date', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useRotationStore } = require('@/stores/rotationStore');

    act(() => {
      useRotationStore.getState().addRotation(
        'prod-seasonal',
        'active',
        'paused',
        '2026-09-01',
        'End of summer season'
      );
    });

    const job = useRotationStore.getState().queue[0];
    expect(job.productId).toBe('prod-seasonal');
    expect(job.scheduledDate).toBe('2026-09-01');
    expect(job.notes).toBe('End of summer season');
  });

  it('rotate now adds job with completedDate', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useRotationStore } = require('@/stores/rotationStore');

    act(() => {
      useRotationStore.getState().rotateNow('prod-flash', 'active', 'archived');
    });

    const job = useRotationStore.getState().queue[0];
    expect(job.completedDate).toBeDefined();
    expect(job.productId).toBe('prod-flash');
  });
});
