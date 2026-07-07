'use client';

import { useState } from 'react';
import { useRotationStore } from '@/stores/rotationStore';

interface BulkRotationActionsProps {
  onRotateAll: () => void;
  onScheduleAll: () => void;
  onArchiveAll: () => void;
}

export default function BulkRotationActions({
  onRotateAll,
  onScheduleAll,
  onArchiveAll,
}: BulkRotationActionsProps) {
  const { selectedProducts, clearSelection } = useRotationStore();
  const [confirmAction, setConfirmAction] = useState<'rotate' | 'archive' | null>(null);

  const count = selectedProducts.length;
  if (count === 0) return null;

  const handleRotateAll = () => setConfirmAction('rotate');
  const handleArchiveAll = () => setConfirmAction('archive');

  const handleConfirm = () => {
    if (confirmAction === 'rotate') onRotateAll();
    if (confirmAction === 'archive') onArchiveAll();
    setConfirmAction(null);
  };

  return (
    <>
      {confirmAction && (
        <div className="modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="modal modal-confirm" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Bulk Action</h2>
            <p>
              {confirmAction === 'rotate'
                ? `Rotate ${count} product${count > 1 ? 's' : ''} to Paused now?`
                : `Archive ${count} product${count > 1 ? 's' : ''}? This cannot be undone.`}
            </p>
            <div className="form-actions">
              <button
                className={`btn ${confirmAction === 'archive' ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleConfirm}
              >
                Confirm
              </button>
              <button className="btn btn-secondary" onClick={() => setConfirmAction(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bulk-actions-bar">
        <span className="selection-count">
          {count} product{count > 1 ? 's' : ''} selected
        </span>
        <div className="action-buttons">
          <button className="btn btn-small btn-white" onClick={handleRotateAll}>
            Rotate All Now
          </button>
          <button className="btn btn-small btn-white-outline" onClick={onScheduleAll}>
            Schedule Rotation
          </button>
          <button className="btn btn-small btn-danger" onClick={handleArchiveAll}>
            Archive All
          </button>
          <button className="btn btn-small btn-gray" onClick={clearSelection}>
            Clear Selection
          </button>
        </div>
      </div>
    </>
  );
}
