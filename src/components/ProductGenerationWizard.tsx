'use client';

import { useState, useEffect } from 'react';
import { HelpCircle, Box } from 'lucide-react';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';
import ProductSelectionStep from './ProductSelectionStep';
import ImageUploadStep from './ImageUploadStep';
import GenerationProgressStep from './GenerationProgressStep';
import ModelPreviewStep from './ModelPreviewStep';
import SaveConfirmationStep from './SaveConfirmationStep';
import SuccessStep from './SuccessStep';

type WizardStep = 'select' | 'upload' | 'generating' | 'preview' | 'confirm' | 'success';

const STEPS: { key: WizardStep; label: string }[] = [
  { key: 'select',     label: 'Product' },
  { key: 'upload',     label: 'Image' },
  { key: 'generating', label: 'Generate' },
  { key: 'preview',    label: 'Preview' },
  { key: 'confirm',    label: 'Confirm' },
  { key: 'success',    label: 'Done' },
];

function stepIndex(s: WizardStep) {
  return STEPS.findIndex((x) => x.key === s);
}

export default function ProductGenerationWizard() {
  const [step, setStep] = useState<WizardStep>('select');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [requestId, setRequestId] = useState('');
  const [glbUrl, setGlbUrl] = useState('');
  const [error, setError] = useState('');
  const tutorialStore = useTutorialStore();
  const tutorialUI = useTutorialOverlay('seller-3d-tour');

  useEffect(() => {
    if (!tutorialStore.isCompleted('seller-3d-tour') && !tutorialStore.currentTutorial) {
      tutorialStore.showTutorial('seller-3d-tour');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentIdx = stepIndex(step);

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
    setError('');
    try {
      const response = await fetch('/api/admin/products/generate-3d', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ productId: selectedProductId, imageUrl: uploadedImageUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setRequestId(data.requestId);
      setStep('generating');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    }
  };

  const handleGenerationComplete = (url: string) => {
    setGlbUrl(url);
    setStep('preview');
  };

  const handleSaveModel = async () => {
    if (!selectedProductId || !glbUrl) return;
    setError('');
    try {
      const response = await fetch(`/api/admin/products/${selectedProductId}/attach-model`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ glbUrl }),
      });
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
    <div className="gen3d-container">
      {tutorialUI}

      {/* Header */}
      <div className="gen3d-header">
        <div className="gen3d-header-icon">
          <Box size={22} />
        </div>
        <div>
          <h1 className="gen3d-title">Generate 3D Model</h1>
          <p className="gen3d-subtitle">Turn your product photos into interactive 3D experiences</p>
        </div>
        <button
          className="gen3d-help-btn"
          onClick={() => tutorialStore.showTutorial('seller-3d-tour')}
          aria-label="Show tutorial"
        >
          <HelpCircle size={16} />
        </button>
      </div>

      {/* Step Indicator */}
      <div className="gen3d-steps">
        {STEPS.map(({ key, label }, idx) => {
          const isDone = idx < currentIdx;
          const isActive = idx === currentIdx;
          return (
            <div key={key} className="gen3d-step">
              {idx > 0 && <div className={`gen3d-step-line${isDone || isActive ? ' filled' : ''}`} />}
              <div className={`gen3d-step-dot${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}>
                {isDone ? '✓' : idx + 1}
              </div>
              <span className={`gen3d-step-label${isActive ? ' active' : ''}`}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="gen3d-error">
          <span>⚠</span> {error}
        </div>
      )}

      {/* Steps */}
      <div className="gen3d-body">
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
            onDiscard={() => { setStep('upload'); setGlbUrl(''); }}
          />
        )}
        {step === 'confirm' && (
          <SaveConfirmationStep
            productId={selectedProductId}
            imageUrl={uploadedImageUrl}
            glbUrl={glbUrl}
            onSave={handleSaveModel}
            onDiscard={() => { setStep('upload'); setGlbUrl(''); }}
          />
        )}
        {step === 'success' && (
          <SuccessStep productId={selectedProductId} onGenerateAnother={handleReset} />
        )}
      </div>
    </div>
  );
}
