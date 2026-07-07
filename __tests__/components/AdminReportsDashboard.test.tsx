/**
 * Component tests for AdminReportsDashboard
 */
import React from 'react';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      analytics: 'Analytics',
      showTutorial: 'Show tutorial',
      sales: 'Sales',
      costMargin: 'Cost & Margin',
      goals: 'Goals',
      stock: 'Stock',
      rotation: 'Rotation',
    };
    return map[key] || key;
  },
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

jest.mock('@/components/SalesReport', () => () => <div data-testid="sales-report" />);
jest.mock('@/components/CostMarginReport', () => () => <div data-testid="cost-report" />);
jest.mock('@/components/GoalsReport', () => () => <div data-testid="goals-report" />);
jest.mock('@/components/StockReport', () => () => <div data-testid="stock-report" />);
jest.mock('@/components/RotationReport', () => () => <div data-testid="rotation-report" />);

import { render, screen, fireEvent } from '@testing-library/react';
import AdminReportsDashboard from '@/components/AdminReportsDashboard';
import { useReportsStore } from '@/stores/reportsStore';

describe('AdminReportsDashboard', () => {
  beforeEach(() => {
    useReportsStore.setState({ activeTab: 'sales' });
  });

  it('renders the analytics heading', () => {
    render(<AdminReportsDashboard />);
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('renders all five tab buttons', () => {
    render(<AdminReportsDashboard />);
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('Cost & Margin')).toBeInTheDocument();
    expect(screen.getByText('Goals')).toBeInTheDocument();
    expect(screen.getByText('Stock')).toBeInTheDocument();
    expect(screen.getByText('Rotation')).toBeInTheDocument();
  });

  it('renders the sales report by default', () => {
    render(<AdminReportsDashboard />);
    expect(screen.getByTestId('sales-report')).toBeInTheDocument();
  });

  it('switches to cost report when Cost & Margin tab is clicked', () => {
    render(<AdminReportsDashboard />);
    fireEvent.click(screen.getByText('Cost & Margin'));
    expect(screen.getByTestId('cost-report')).toBeInTheDocument();
  });

  it('switches to goals report when Goals tab is clicked', () => {
    render(<AdminReportsDashboard />);
    fireEvent.click(screen.getByText('Goals'));
    expect(screen.getByTestId('goals-report')).toBeInTheDocument();
  });

  it('switches to stock report when Stock tab is clicked', () => {
    render(<AdminReportsDashboard />);
    fireEvent.click(screen.getByText('Stock'));
    expect(screen.getByTestId('stock-report')).toBeInTheDocument();
  });

  it('switches to rotation report when Rotation tab is clicked', () => {
    render(<AdminReportsDashboard />);
    fireEvent.click(screen.getByText('Rotation'));
    expect(screen.getByTestId('rotation-report')).toBeInTheDocument();
  });

  it('renders the help button', () => {
    render(<AdminReportsDashboard />);
    expect(screen.getByRole('button', { name: /show tutorial/i })).toBeInTheDocument();
  });
});
