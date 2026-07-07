/**
 * Component tests for BulkRotationActions
 */
import React from 'react';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      selected: '{count} selected',
      rotateAllNow: 'Rotate All Now',
      scheduleRotationAll: 'Schedule All',
      archiveAll: 'Archive All',
      clearSelection: 'Clear Selection',
      confirmBulkAction: 'Confirm Action',
      rotateBulkConfirm: 'Rotate {count} products?',
      archiveBulkConfirm: 'Archive {count} products?',
      confirm: 'Confirm',
      cancel: 'Cancel',
    };
    return map[key] || key;
  },
}));

const mockClearSelection = jest.fn();
let mockSelected: string[] = [];

jest.mock('@/stores/rotationStore', () => ({
  useRotationStore: () => ({
    selectedProducts: mockSelected,
    clearSelection: mockClearSelection,
  }),
}));

import { render, screen, fireEvent } from '@testing-library/react';
import BulkRotationActions from '@/components/BulkRotationActions';

describe('BulkRotationActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelected = ['p1', 'p2'];
  });

  it('renders nothing when no products are selected', () => {
    mockSelected = [];
    const { container } = render(<BulkRotationActions onRotateAll={jest.fn()} onScheduleAll={jest.fn()} onArchiveAll={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the bulk actions bar when products are selected', () => {
    render(<BulkRotationActions onRotateAll={jest.fn()} onScheduleAll={jest.fn()} onArchiveAll={jest.fn()} />);
    expect(screen.getByText('Rotate All Now')).toBeInTheDocument();
  });

  it('renders the selection count', () => {
    render(<BulkRotationActions onRotateAll={jest.fn()} onScheduleAll={jest.fn()} onArchiveAll={jest.fn()} />);
    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  it('calls onScheduleAll directly when Schedule All is clicked', () => {
    const onScheduleAll = jest.fn();
    render(<BulkRotationActions onRotateAll={jest.fn()} onScheduleAll={onScheduleAll} onArchiveAll={jest.fn()} />);
    fireEvent.click(screen.getByText('Schedule All'));
    expect(onScheduleAll).toHaveBeenCalledTimes(1);
  });

  it('shows confirm dialog when Rotate All Now is clicked', () => {
    render(<BulkRotationActions onRotateAll={jest.fn()} onScheduleAll={jest.fn()} onArchiveAll={jest.fn()} />);
    fireEvent.click(screen.getByText('Rotate All Now'));
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
  });

  it('shows confirm dialog when Archive All is clicked', () => {
    render(<BulkRotationActions onRotateAll={jest.fn()} onScheduleAll={jest.fn()} onArchiveAll={jest.fn()} />);
    fireEvent.click(screen.getByText('Archive All'));
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
  });

  it('calls onRotateAll when confirm is clicked after rotate action', () => {
    const onRotateAll = jest.fn();
    render(<BulkRotationActions onRotateAll={onRotateAll} onScheduleAll={jest.fn()} onArchiveAll={jest.fn()} />);
    fireEvent.click(screen.getByText('Rotate All Now'));
    fireEvent.click(screen.getByText('Confirm'));
    expect(onRotateAll).toHaveBeenCalledTimes(1);
  });

  it('calls onArchiveAll when confirm is clicked after archive action', () => {
    const onArchiveAll = jest.fn();
    render(<BulkRotationActions onRotateAll={jest.fn()} onScheduleAll={jest.fn()} onArchiveAll={onArchiveAll} />);
    fireEvent.click(screen.getByText('Archive All'));
    fireEvent.click(screen.getByText('Confirm'));
    expect(onArchiveAll).toHaveBeenCalledTimes(1);
  });

  it('dismisses confirm dialog when Cancel is clicked', () => {
    render(<BulkRotationActions onRotateAll={jest.fn()} onScheduleAll={jest.fn()} onArchiveAll={jest.fn()} />);
    fireEvent.click(screen.getByText('Rotate All Now'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Confirm Action')).toBeNull();
  });

  it('calls clearSelection when Clear Selection is clicked', () => {
    render(<BulkRotationActions onRotateAll={jest.fn()} onScheduleAll={jest.fn()} onArchiveAll={jest.fn()} />);
    fireEvent.click(screen.getByText('Clear Selection'));
    expect(mockClearSelection).toHaveBeenCalledTimes(1);
  });
});
