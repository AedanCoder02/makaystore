/**
 * Component tests for DailySummaryCard
 */
import React from 'react';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => ({
    todaySummary: "Today's Summary",
    workersClockIn: 'Workers Clocked In',
    totalHours: 'Total Hours',
  }[key] || key),
}));

import { render, screen } from '@testing-library/react';
import DailySummaryCard from '@/components/DailySummaryCard';

describe('DailySummaryCard', () => {
  it('renders the heading', () => {
    render(<DailySummaryCard totalWorkers={10} workersClockIn={7} totalHours="42.5" />);
    expect(screen.getByText("Today's Summary")).toBeInTheDocument();
  });

  it('renders workers clocked in ratio', () => {
    render(<DailySummaryCard totalWorkers={10} workersClockIn={7} totalHours="42.5" />);
    expect(screen.getByText('7/10')).toBeInTheDocument();
  });

  it('renders total hours', () => {
    render(<DailySummaryCard totalWorkers={10} workersClockIn={7} totalHours="42.5" />);
    expect(screen.getByText('42.5h')).toBeInTheDocument();
  });

  it('renders with zero workers', () => {
    render(<DailySummaryCard totalWorkers={0} workersClockIn={0} totalHours="0.0" />);
    expect(screen.getByText('0/0')).toBeInTheDocument();
  });
});
