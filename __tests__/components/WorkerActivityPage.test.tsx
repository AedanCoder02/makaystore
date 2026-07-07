/**
 * Component tests for WorkerActivityPage
 */
import React from 'react';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      myActivity: 'My Activity',
      showTutorial: 'Show tutorial',
    };
    return map[key] || key;
  },
}));

jest.mock('@/hooks/useTutorialOverlay', () => ({
  useTutorialOverlay: () => null,
}));

jest.mock('@/stores/tutorialStore', () => ({
  useTutorialStore: () => ({
    completed: new Set<string>(['worker-clock-in']), // already completed → no auto-show
    showTutorial: jest.fn(),
    currentTutorial: null,
    currentStep: 0,
    nextStep: jest.fn(),
    skip: jest.fn(),
  }),
}));

jest.mock('@/hooks/useWorkerActivity', () => ({
  useWorkerActivity: () => ({
    clockedIn: false,
    currentShift: null,
    tasks: [],
    activityLog: [],
    clockIn: jest.fn(),
    clockOut: jest.fn(),
  }),
}));

jest.mock('@/components/StatusCard', () => {
  return function Mock({ clockedIn }: { clockedIn: boolean }) {
    return <div data-testid="status-card">{clockedIn ? 'Clocked In' : 'Clocked Out'}</div>;
  };
});

jest.mock('@/components/ClockInOutButton', () => {
  return function Mock() { return <button data-testid="clock-button">Clock In</button>; };
});

jest.mock('@/components/TaskListWorker', () => {
  return function Mock() { return <div data-testid="task-list" />; };
});

jest.mock('@/components/ActivityLogWorker', () => {
  return function Mock() { return <div data-testid="activity-log" />; };
});

import { render, screen } from '@testing-library/react';
import WorkerActivityPage from '@/components/WorkerActivityPage';

describe('WorkerActivityPage', () => {
  it('renders the page heading', () => {
    render(<WorkerActivityPage />);
    expect(screen.getByText('My Activity')).toBeInTheDocument();
  });

  it('renders the StatusCard', () => {
    render(<WorkerActivityPage />);
    expect(screen.getByTestId('status-card')).toBeInTheDocument();
  });

  it('renders the ClockInOutButton', () => {
    render(<WorkerActivityPage />);
    expect(screen.getByTestId('clock-button')).toBeInTheDocument();
  });

  it('renders the TaskListWorker', () => {
    render(<WorkerActivityPage />);
    expect(screen.getByTestId('task-list')).toBeInTheDocument();
  });

  it('renders the ActivityLogWorker', () => {
    render(<WorkerActivityPage />);
    expect(screen.getByTestId('activity-log')).toBeInTheDocument();
  });

  it('renders the help button', () => {
    render(<WorkerActivityPage />);
    expect(screen.getByRole('button', { name: /show tutorial/i })).toBeInTheDocument();
  });
});
