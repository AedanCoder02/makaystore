/**
 * Component tests for SupervisorDashboardPage
 */
import React from 'react';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      dashboard: 'Supervisor Dashboard',
      next: 'Next',
    };
    return map[key] || key;
  },
}));

jest.mock('@/hooks/useSupervisorDashboard', () => ({
  useSupervisorDashboard: () => ({
    supervisorId: 'sup1',
    workersStatus: [],
    pendingApprovals: [],
    totalWorkers: 5,
    workersClockIn: 3,
    totalHours: '12.5',
    approveActivity: jest.fn(),
    rejectActivity: jest.fn(),
  }),
}));

jest.mock('@/hooks/useTutorialOverlay', () => ({
  useTutorialOverlay: () => null,
}));

jest.mock('@/stores/tutorialStore', () => ({
  useTutorialStore: () => ({
    completed: new Set<string>(),
    showTutorial: jest.fn(),
    currentTutorial: null,
    currentStep: 0,
    nextStep: jest.fn(),
    skip: jest.fn(),
  }),
}));

jest.mock('@/components/WorkerStatusOverview', () => {
  return function Mock() { return <div data-testid="worker-status-overview" />; };
});

jest.mock('@/components/ActivityApprovalList', () => {
  return function Mock() { return <div data-testid="activity-approval-list" />; };
});

jest.mock('@/components/DailySummaryCard', () => {
  return function Mock() { return <div data-testid="daily-summary-card" />; };
});

import { render, screen, fireEvent } from '@testing-library/react';
import SupervisorDashboardPage from '@/components/SupervisorDashboardPage';

describe('SupervisorDashboardPage', () => {
  it('renders the dashboard heading', () => {
    render(<SupervisorDashboardPage />);
    expect(screen.getByText('Supervisor Dashboard')).toBeInTheDocument();
  });

  it('renders the WorkerStatusOverview', () => {
    render(<SupervisorDashboardPage />);
    expect(screen.getByTestId('worker-status-overview')).toBeInTheDocument();
  });

  it('renders the ActivityApprovalList', () => {
    render(<SupervisorDashboardPage />);
    expect(screen.getByTestId('activity-approval-list')).toBeInTheDocument();
  });

  it('renders the DailySummaryCard', () => {
    render(<SupervisorDashboardPage />);
    expect(screen.getByTestId('daily-summary-card')).toBeInTheDocument();
  });

  it('renders the help button', () => {
    render(<SupervisorDashboardPage />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders a clickable help button with aria-label', () => {
    render(<SupervisorDashboardPage />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-label');
    // button is clickable (no error thrown)
    expect(() => fireEvent.click(btn)).not.toThrow();
  });
});
