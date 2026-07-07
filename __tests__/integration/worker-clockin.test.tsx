/**
 * Integration test: Worker Clock In/Out
 * Tests the ClockInOutButton component + workerStore interaction
 */
import React from 'react';

// Setup mocks BEFORE any component imports
const translations = {
  clockIn: 'Clock In',
  clockOut: 'Clock Out',
};

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => translations[key] || key,
  useLocale: () => 'en',
}));

import { render, screen, fireEvent } from '@testing-library/react';
import ClockInOutButton from '@/components/ClockInOutButton';

describe('Worker Clock In/Out Integration', () => {
  it('renders clock in button when not clocked in', () => {
    render(
      <ClockInOutButton clockedIn={false} onClockIn={jest.fn()} onClockOut={jest.fn()} />
    );
    expect(screen.getByRole('button', { name: /clock in/i })).toBeInTheDocument();
  });

  it('renders clock out button when clocked in', () => {
    render(
      <ClockInOutButton clockedIn={true} onClockIn={jest.fn()} onClockOut={jest.fn()} />
    );
    expect(screen.getByRole('button', { name: /clock out/i })).toBeInTheDocument();
  });

  it('calls onClockIn when button is clicked and worker is not clocked in', async () => {
    const onClockIn = jest.fn();
    render(
      <ClockInOutButton clockedIn={false} onClockIn={onClockIn} onClockOut={jest.fn()} />
    );
    fireEvent.click(screen.getByRole('button', { name: /clock in/i }));
    // Wait for async handler
    await screen.findByRole('button');
    expect(onClockIn).toHaveBeenCalledTimes(1);
  });

  it('calls onClockOut when button is clicked and worker is clocked in', async () => {
    const onClockOut = jest.fn();
    render(
      <ClockInOutButton clockedIn={true} onClockIn={jest.fn()} onClockOut={onClockOut} />
    );
    fireEvent.click(screen.getByRole('button', { name: /clock out/i }));
    await screen.findByRole('button');
    expect(onClockOut).toHaveBeenCalledTimes(1);
  });

});

// Store interaction tests - separate from component tests
describe('Worker Store Direct Interaction', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('clock in/out store workflow: clock in then clock out', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useWorkerStore } = require('@/stores/workerStore');
    const { act } = require('@testing-library/react');

    // Clock in
    act(() => { useWorkerStore.getState().clockIn('worker-test-001'); });
    expect(useWorkerStore.getState().clockedIn).toBe(true);
    expect(useWorkerStore.getState().currentShift).not.toBeNull();

    // Clock out
    act(() => { useWorkerStore.getState().clockOut('worker-test-001'); });
    expect(useWorkerStore.getState().clockedIn).toBe(false);
    expect(useWorkerStore.getState().currentShift).toBeNull();

    // Activity log should have both events
    const log = useWorkerStore.getState().activityLog;
    expect(log.some((entry: { action: string }) => entry.action === 'clock-in')).toBe(true);
    expect(log.some((entry: { action: string }) => entry.action === 'clock-out')).toBe(true);
  });
});
