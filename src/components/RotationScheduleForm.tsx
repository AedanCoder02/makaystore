'use client';

import { useState } from 'react';
import { useRotationStore } from '@/stores/rotationStore';
import type { RotationStatus } from '@/stores/rotationStore';
import type { ProductRow } from './RotationTable';

const STATUS_OPTIONS: RotationStatus[] = ['active', 'paused', 'archived'];

interface RotationScheduleFormProps {
  product: ProductRow;
  onClose: () => void;
}

export default function RotationScheduleForm({ product, onClose }: RotationScheduleFormProps) {
  const availableStatuses = STATUS_OPTIONS.filter((s) => s !== product.status);
  const [newStatus, setNewStatus] = useState<RotationStatus>(availableStatuses[0]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const { addRotation } = useRotationStore();

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!scheduledDate) {
      setError('Please select a scheduled date.');
      return;
    }

    if (scheduledDate < today) {
      setError('Scheduled date cannot be in the past.');
      return;
    }

    if (newStatus === product.status) {
      setError('New status must differ from the current status.');
      return;
    }

    addRotation(product.id, product.status, newStatus, scheduledDate, notes || undefined);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Schedule Rotation</h2>
        <p className="modal-subtitle">
          <strong>{product.name}</strong> — currently{' '}
          <span style={{ color: product.status === 'active' ? '#10b981' : product.status === 'paused' ? '#f59e0b' : '#6b7280' }}>
            {product.status}
          </span>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="rotation-status">New Status</label>
            <select
              id="rotation-status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as RotationStatus)}
            >
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="rotation-date">Scheduled Date</label>
            <input
              id="rotation-date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={today}
            />
          </div>

          <div className="form-group">
            <label htmlFor="rotation-notes">Notes (Optional)</label>
            <textarea
              id="rotation-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this rotation..."
              rows={3}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Schedule
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
