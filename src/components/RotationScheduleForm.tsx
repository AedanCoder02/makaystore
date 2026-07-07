'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('rotation');

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!scheduledDate) {
      setError(t('errorDateRequired'));
      return;
    }

    if (scheduledDate < today) {
      setError(t('errorPastDate'));
      return;
    }

    if (newStatus === product.status) {
      setError(t('errorSameStatus'));
      return;
    }

    addRotation(product.id, product.status, newStatus, scheduledDate, notes || undefined);
    onClose();
  };

  const statusLabels: Record<RotationStatus, string> = {
    active: t('statusActive'),
    paused: t('statusPaused'),
    archived: t('statusArchived'),
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{t('scheduleRotation')}</h2>
        <p className="modal-subtitle">
          <strong>{product.name}</strong> — {t('currently')}{' '}
          <span style={{ color: product.status === 'active' ? '#10b981' : product.status === 'paused' ? '#f59e0b' : '#6b7280' }}>
            {statusLabels[product.status]}
          </span>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="rotation-status">{t('newStatus')}</label>
            <select
              id="rotation-status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as RotationStatus)}
            >
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="rotation-date">{t('scheduledDate')}</label>
            <input
              id="rotation-date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={today}
            />
          </div>

          <div className="form-group">
            <label htmlFor="rotation-notes">{t('notes')}</label>
            <textarea
              id="rotation-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('notesPlaceholder')}
              rows={3}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {t('schedule')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
