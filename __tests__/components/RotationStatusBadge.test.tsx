/**
 * Component tests for RotationStatusBadge
 */
import React from 'react';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => ({
    statusActive: 'Active',
    statusPaused: 'Paused',
    statusArchived: 'Archived',
    statusPending: 'Pending',
  }[key] || key),
}));

import { render, screen } from '@testing-library/react';
import RotationStatusBadge from '@/components/RotationStatusBadge';

describe('RotationStatusBadge', () => {
  it('renders active status', () => {
    render(<RotationStatusBadge status="active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders paused status', () => {
    render(<RotationStatusBadge status="paused" />);
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('renders archived status', () => {
    render(<RotationStatusBadge status="archived" />);
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('renders pending status', () => {
    render(<RotationStatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('applies background color style for active', () => {
    render(<RotationStatusBadge status="active" />);
    const badge = screen.getByText('Active');
    expect(badge).toHaveStyle({ backgroundColor: '#10b981' });
  });

  it('applies background color style for paused', () => {
    render(<RotationStatusBadge status="paused" />);
    expect(screen.getByText('Paused')).toHaveStyle({ backgroundColor: '#f59e0b' });
  });
});
