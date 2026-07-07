/**
 * Component tests for RotationScheduleForm
 */
import React from 'react';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      scheduleRotation: 'Schedule Rotation',
      currently: 'Currently',
      newStatus: 'New Status',
      scheduledDate: 'Scheduled Date',
      notes: 'Notes',
      notesPlaceholder: 'Add notes...',
      schedule: 'Schedule',
      cancel: 'Cancel',
      statusActive: 'Active',
      statusPaused: 'Paused',
      statusArchived: 'Archived',
      errorDateRequired: 'Date is required',
      errorPastDate: 'Date cannot be in the past',
      errorSameStatus: 'Status must be different',
    };
    return map[key] || key;
  },
}));

jest.mock('@/stores/rotationStore', () => ({
  useRotationStore: () => ({
    addRotation: jest.fn(),
  }),
}));

import { render, screen, fireEvent } from '@testing-library/react';
import RotationScheduleForm from '@/components/RotationScheduleForm';
import type { ProductRow } from '@/components/RotationTable';

const product: ProductRow = {
  id: 'p1',
  name: 'Beach Shirt',
  status: 'active',
  category: 'Shirts',
  lastRotated: '',
};

describe('RotationScheduleForm', () => {
  it('renders the heading', () => {
    render(<RotationScheduleForm product={product} onClose={jest.fn()} />);
    expect(screen.getByText('Schedule Rotation')).toBeInTheDocument();
  });

  it('renders the product name', () => {
    render(<RotationScheduleForm product={product} onClose={jest.fn()} />);
    expect(screen.getByText('Beach Shirt')).toBeInTheDocument();
  });

  it('renders the status select', () => {
    render(<RotationScheduleForm product={product} onClose={jest.fn()} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders the date input', () => {
    render(<RotationScheduleForm product={product} onClose={jest.fn()} />);
    expect(screen.getByLabelText('Scheduled Date')).toBeInTheDocument();
  });

  it('renders the notes textarea', () => {
    render(<RotationScheduleForm product={product} onClose={jest.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows error when submitted without a date', () => {
    render(<RotationScheduleForm product={product} onClose={jest.fn()} />);
    fireEvent.submit(screen.getByText('Schedule').closest('form')!);
    expect(screen.getByText('Date is required')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = jest.fn();
    render(<RotationScheduleForm product={product} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay backdrop is clicked', () => {
    const onClose = jest.fn();
    const { container } = render(<RotationScheduleForm product={product} onClose={onClose} />);
    fireEvent.click(container.querySelector('.modal-overlay')!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
