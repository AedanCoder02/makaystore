/**
 * Component tests for StatusCard
 */
import React from 'react';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => ({
    clockedInStatus: 'Clocked In',
    clockedOutStatus: 'Clocked Out',
    workingFor: 'Working for {time}',
  }[key] || key),
}));

import { render, screen } from '@testing-library/react';
import StatusCard from '@/components/StatusCard';

describe('StatusCard', () => {
  it('renders clocked-out status when clockedIn is false', () => {
    render(<StatusCard clockedIn={false} />);
    expect(screen.getByText('Clocked Out')).toBeInTheDocument();
  });

  it('renders clocked-in status when clockedIn is true', () => {
    render(<StatusCard clockedIn={true} startTime={new Date().toISOString()} />);
    expect(screen.getByText('Clocked In')).toBeInTheDocument();
  });

  it('applies clocked-in class when clockedIn is true', () => {
    const { container } = render(<StatusCard clockedIn={true} startTime={new Date().toISOString()} />);
    expect(container.querySelector('.clocked-in')).not.toBeNull();
  });

  it('applies clocked-out class when clockedIn is false', () => {
    const { container } = render(<StatusCard clockedIn={false} />);
    expect(container.querySelector('.clocked-out')).not.toBeNull();
  });

  it('does not render elapsed time when not clocked in', () => {
    render(<StatusCard clockedIn={false} />);
    expect(screen.queryByText(/Working for/)).toBeNull();
  });
});
