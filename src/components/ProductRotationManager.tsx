'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';
import { useRotationStore } from '@/stores/rotationStore';
import RotationTable from './RotationTable';
import RotationScheduleForm from './RotationScheduleForm';
import BulkRotationActions from './BulkRotationActions';
import type { ProductRow } from './RotationTable';

export default function ProductRotationManager() {
  const [scheduleTarget, setScheduleTarget] = useState<ProductRow | null>(null);
  const tutorialStore = useTutorialStore();
  const tutorialUI = useTutorialOverlay('rotation-tour');
  const { rotateNow, bulkRotate, selectedProducts, clearSelection } = useRotationStore();
  const t = useTranslations('rotation');
  const tAdmin = useTranslations('admin');

  useEffect(() => {
    if (!tutorialStore.isCompleted('rotation-tour')) {
      tutorialStore.showTutorial('rotation-tour');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRotateNow = async (product: ProductRow & { _reload?: () => void }) => {
    const nextStatus = product.status === 'active' ? 'paused' : 'active';
    if (window.confirm(t('rotateNowConfirm').replace('{name}', product.name).replace('{from}', product.status))) {
      rotateNow(product.id, product.status, nextStatus);
      // Persist to DB
      await fetch('/api/seller/rotation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, status: nextStatus }),
      });
      product._reload?.();
    }
  };

  const handleSchedule = (product: ProductRow) => {
    setScheduleTarget(product);
  };

  const handleRotateAll = () => {
    bulkRotate(selectedProducts, 'paused');
    clearSelection();
  };

  const handleArchiveAll = () => {
    bulkRotate(selectedProducts, 'archived');
    clearSelection();
  };

  const handleScheduleAll = () => {
    window.alert(t('scheduleAllHint'));
  };

  return (
    <div className="admin-rotation-layout">
      <div className="rotation-header dashboard-header">
        <div>
          <h1>{t('title')}</h1>
          <p className="rotation-subtitle">
            {t('subtitle')}
          </p>
        </div>
        <button
          className="help-button"
          onClick={() => tutorialStore.showTutorial('rotation-tour')}
          aria-label={tAdmin('showTutorial')}
          title={tAdmin('showTutorial')}
        >
          ?
        </button>
      </div>

      <RotationTable onRotateNow={handleRotateNow} onSchedule={handleSchedule} />

      <BulkRotationActions
        onRotateAll={handleRotateAll}
        onScheduleAll={handleScheduleAll}
        onArchiveAll={handleArchiveAll}
      />

      {scheduleTarget && (
        <RotationScheduleForm
          product={scheduleTarget}
          onClose={() => setScheduleTarget(null)}
        />
      )}

      {tutorialUI}
    </div>
  );
}
