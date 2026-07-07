'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('rotation');

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
            <h2>{t('confirmBulkAction')}</h2>
            <p>
              {confirmAction === 'rotate'
                ? t('rotateBulkConfirm').replace('{count}', String(count))
                : t('archiveBulkConfirm').replace('{count}', String(count))}
            </p>
            <div className="form-actions">
              <button
                className={`btn ${confirmAction === 'archive' ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleConfirm}
              >
                {t('confirm')}
              </button>
              <button className="btn btn-secondary" onClick={() => setConfirmAction(null)}>
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bulk-actions-bar">
        <span className="selection-count">
          {count} {t('selected').replace('{count}', '')}
        </span>
        <div className="action-buttons">
          <button className="btn btn-small btn-white" onClick={handleRotateAll}>
            {t('rotateAllNow')}
          </button>
          <button className="btn btn-small btn-white-outline" onClick={onScheduleAll}>
            {t('scheduleRotationAll')}
          </button>
          <button className="btn btn-small btn-danger" onClick={handleArchiveAll}>
            {t('archiveAll')}
          </button>
          <button className="btn btn-small btn-gray" onClick={clearSelection}>
            {t('clearSelection')}
          </button>
        </div>
      </div>
    </>
  );
}
