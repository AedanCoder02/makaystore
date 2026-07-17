'use client';

import { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';
import ProductSelectionStep from './ProductSelectionStep';
import ImageUploadStep from './ImageUploadStep';
import GenerationProgressStep from './GenerationProgressStep';
import ModelPreviewStep from './ModelPreviewStep';
import SaveConfirmationStep from './SaveConfirmationStep';
import SuccessStep from './SuccessStep';

type WizardStep = 'select' | 'upload' | 'generating' | 'preview' | 'confirm' | 'success';

export default function ProductGenerationWizard() {
  const [step, setStep] = useState<WizardStep>('select');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [requestId, setRequestId] = useState('');
  const [glbUrl, setGlbUrl] = useState('');
  const [error, setError] = useState('');
  const tutorialStore = useTutorialStore();
  const tutorialUI = useTutorialOverlay('admin-products');

  useEffect(() => {
    if (!tutorialStore.isCompleted('admin-products') && !tutorialStore.currentTutorial) {
      tutorialStore.showTutorial('admin-products');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProductSelected = (productId: string) => {
    setSelectedProductId(productId);
    setStep('upload');
  };

  const handleImageUploaded = (imageUrl: string) => {
    setUploadedImageUrl(imageUrl);
  };

  const handleGenerateClicked = async () => {
    if (!selectedProductId || !uploadedImageUrl) {
      setError('Product and image required');
      return;
    }

    try {
      const response = await fetch('/api/admin/products/generate-3d', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          imageUrl: uploadedImageUrl,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setRequestId(data.requestId);
      setStep('generating');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    }
  };

  const handleGenerationComplete = (glbUrl: string) => {
    setGlbUrl(glbUrl);
    setStep('preview');
  };

  const handleSaveModel = async () => {
    if (!selectedProductId || !glbUrl) {
      setError('Product ID and GLB URL required');
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/products/${selectedProductId}/attach-model`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ glbUrl }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleReset = () => {
    setStep('select');
    setSelectedProductId('');
    setUploadedImageUrl('');
    setRequestId('');
    setGlbUrl('');
    setError('');
  };

  return (
    <div className="wizard-container generation-wizard">
      {tutorialUI}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <h1>Generate 3D Product Model</h1>
        <button className="help-button" onClick={() => tutorialStore.showTutorial('admin-products')} aria-label="Show tutorial" style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}>
          <HelpCircle size={18} />
        </button>
      </div>

      {/* Step Indicator */}
      <div className="step-indicator wizard-step">
        {(['select', 'upload', 'generating', 'preview', 'confirm', 'success'] as WizardStep[]).map(
          (s, idx) => (
            <div
              key={s}
              className={`step-dot ${step === s ? 'active' : ''} ${
                (idx === 0 ||
                  (idx === 1 && step !== 'select') ||
                  (idx === 2 && ['generating', 'preview', 'confirm', 'success'].includes(step)) ||
                  (idx === 3 && ['preview', 'confirm', 'success'].includes(step)) ||
                  (idx === 4 && ['confirm', 'success'].includes(step)) ||
                  (idx === 5 && step === 'success'))
                  ? 'done'
                  : ''
              }`}
            >
              {idx + 1}
            </div>
          )
        )}
      </div>

      {/* Error Display */}
      {error && <div className="error-banner">{error}</div>}

      {/* Steps */}
      {step === 'select' && (
        <ProductSelectionStep onProductSelected={handleProductSelected} />
      )}
      {step === 'upload' && (
        <ImageUploadStep
          onImageUploaded={handleImageUploaded}
          onGenerateClick={handleGenerateClicked}
          productId={selectedProductId}
        />
      )}
      {step === 'generating' && (
        <GenerationProgressStep
          requestId={requestId}
          onComplete={handleGenerationComplete}
          onCancel={() => setStep('upload')}
        />
      )}
      {step === 'preview' && (
        <ModelPreviewStep
          glbUrl={glbUrl}
          onSave={() => setStep('confirm')}
          onDiscard={() => {
            setStep('upload');
            setGlbUrl('');
          }}
        />
      )}
      {step === 'confirm' && (
        <SaveConfirmationStep
          productId={selectedProductId}
          imageUrl={uploadedImageUrl}
          glbUrl={glbUrl}
          onSave={handleSaveModel}
          onDiscard={() => {
            setStep('upload');
            setGlbUrl('');
          }}
        />
      )}
      {step === 'success' && (
        <SuccessStep
          productId={selectedProductId}
          onGenerateAnother={handleReset}
        />
      )}
    </div>
  );
}
