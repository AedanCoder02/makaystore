'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!tutorialStore.completed.has('rotation-tour')) {
      tutorialStore.showTutorial('rotation-tour');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRotateNow = (product: ProductRow) => {
    if (window.confirm(`Rotate "${product.name}" from ${product.status} to paused now?`)) {
      rotateNow(product.id, product.status, 'paused');
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
    // Bulk schedule opens modal on first selected product as entry point
    window.alert('Select "Schedule" on individual products to set specific dates per product.');
  };

  return (
    <div className="admin-rotation-layout">
      <div className="rotation-header dashboard-header">
        <div>
          <h1>Product Rotation</h1>
          <p className="rotation-subtitle">
            Schedule and manage when products cycle between Active, Paused, and Archived states.
          </p>
        </div>
        <button
          className="help-button"
          onClick={() => tutorialStore.showTutorial('rotation-tour')}
          aria-label="Show tutorial"
          title="Show tutorial"
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
