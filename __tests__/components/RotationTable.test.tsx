/**
 * Component tests for RotationTable
 */
import React from 'react';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      selectAll: 'Select all',
      productName: 'Product Name',
      sku: 'SKU',
      currentStatus: 'Status',
      lastRotated: 'Last Rotated',
      actions: 'Actions',
      rotateNow: 'Rotate Now',
      schedule: 'Schedule',
      selectProduct: 'Select {name}',
      statusActive: 'Active',
      statusPaused: 'Paused',
      statusArchived: 'Archived',
      statusPending: 'Pending',
    };
    return map[key] || key;
  },
}));

jest.mock('@/stores/rotationStore', () => ({
  useRotationStore: () => ({
    selectedProducts: [],
    selectProduct: jest.fn(),
    deselectProduct: jest.fn(),
    clearSelection: jest.fn(),
  }),
}));

import { render, screen, fireEvent } from '@testing-library/react';
import RotationTable from '@/components/RotationTable';

describe('RotationTable', () => {
  const onRotateNow = jest.fn();
  const onSchedule = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('renders the table', () => {
    render(<RotationTable onRotateNow={onRotateNow} onSchedule={onSchedule} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<RotationTable onRotateNow={onRotateNow} onSchedule={onSchedule} />);
    expect(screen.getByText('Product Name')).toBeInTheDocument();
    expect(screen.getByText('SKU')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders product rows from mock data', () => {
    render(<RotationTable onRotateNow={onRotateNow} onSchedule={onSchedule} />);
    expect(screen.getByText('Linen Shirt')).toBeInTheDocument();
    expect(screen.getByText('LINEN-001')).toBeInTheDocument();
  });

  it('renders Rotate Now buttons', () => {
    render(<RotationTable onRotateNow={onRotateNow} onSchedule={onSchedule} />);
    const buttons = screen.getAllByText('Rotate Now');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('calls onRotateNow when Rotate Now is clicked for active product', () => {
    render(<RotationTable onRotateNow={onRotateNow} onSchedule={onSchedule} />);
    // First row is Linen Shirt (active) — click first enabled Rotate Now button
    const rotateButtons = screen.getAllByText('Rotate Now');
    const enabledButton = rotateButtons.find(b => !(b as HTMLButtonElement).disabled)!;
    fireEvent.click(enabledButton);
    expect(onRotateNow).toHaveBeenCalledTimes(1);
  });

  it('calls onSchedule when Schedule is clicked', () => {
    render(<RotationTable onRotateNow={onRotateNow} onSchedule={onSchedule} />);
    const scheduleButtons = screen.getAllByText('Schedule');
    fireEvent.click(scheduleButtons[0]);
    expect(onSchedule).toHaveBeenCalledTimes(1);
  });

  it('disables Rotate Now for archived products', () => {
    render(<RotationTable onRotateNow={onRotateNow} onSchedule={onSchedule} />);
    const rotateButtons = screen.getAllByText('Rotate Now') as HTMLButtonElement[];
    // Wool Sweater is archived — its button should be disabled
    const disabledButtons = rotateButtons.filter(b => b.disabled);
    expect(disabledButtons.length).toBeGreaterThan(0);
  });

  it('renders select-all checkbox', () => {
    render(<RotationTable onRotateNow={onRotateNow} onSchedule={onSchedule} />);
    expect(screen.getByLabelText('Select all')).toBeInTheDocument();
  });
});
