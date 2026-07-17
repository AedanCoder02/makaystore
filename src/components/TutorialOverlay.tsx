'use client';

import { CSSProperties, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { TutorialStep } from '@/lib/tutorials';

interface TutorialOverlayProps {
  tutorialId: string;
  step: TutorialStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}

export default function TutorialOverlay({
  tutorialId,
  step,
  stepIndex,
  totalSteps,
  onNext,
  onSkip,
}: TutorialOverlayProps) {
  const t = useTranslations('tutorial');
  const [position, setPosition] = useState<CSSProperties>({});
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const updatePositions = () => {
      const target = document.querySelector(step.target);
      if (!target) {
        console.warn(`Tutorial target not found: ${step.target}`);
        return;
      }

      const rect = target.getBoundingClientRect();
      setHighlightRect(rect);

      const overlay = document.querySelector('.tutorial-overlay-card') as HTMLElement;
      if (!overlay) return;

      const overlayHeight = 160;
      const overlayWidth = 280;
      const offset = 20;

      let top = 0,
        left = 0;

      switch (step.placement) {
        case 'bottom':
          top = rect.bottom + offset;
          left = Math.max(
            0,
            Math.min(
              window.innerWidth - overlayWidth - 10,
              rect.left + rect.width / 2 - overlayWidth / 2
            )
          );
          break;
        case 'top':
          top = Math.max(0, rect.top - overlayHeight - offset);
          left = Math.max(
            0,
            Math.min(
              window.innerWidth - overlayWidth - 10,
              rect.left + rect.width / 2 - overlayWidth / 2
            )
          );
          break;
        case 'left':
          top = Math.max(0, rect.top + rect.height / 2 - overlayHeight / 2);
          left = Math.max(0, rect.left - overlayWidth - offset);
          break;
        case 'right':
          top = Math.max(0, rect.top + rect.height / 2 - overlayHeight / 2);
          left = Math.min(
            window.innerWidth - overlayWidth - 10,
            rect.right + offset
          );
          break;
      }

      setPosition({ top, left });
    };

    updatePositions();
    window.addEventListener('resize', updatePositions);
    window.addEventListener('scroll', updatePositions);

    return () => {
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('scroll', updatePositions);
    };
  }, [step.target, step.placement]);

  const handleNext = () => {
    if (stepIndex === totalSteps - 1) {
      onSkip();
    } else {
      onNext();
    }
  };

  return (
    <>
      <div className="tutorial-backdrop" onClick={onSkip} />
      {highlightRect && (
        <div
          className="tutorial-highlight"
          style={{
            top: highlightRect.top - 4,
            left: highlightRect.left - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
          }}
        />
      )}
      <div
        className="tutorial-overlay-card"
        style={{ ...position, position: 'fixed' }}
      >
        <div className="tutorial-step-counter">
          {t('step')} {stepIndex + 1} {t('of')} {totalSteps}
        </div>
        <h3 className="tutorial-title">
          {t(`tours.${tutorialId}.steps.${step.id}.title` as Parameters<typeof t>[0])}
        </h3>
        <p className="tutorial-description">
          {t(`tours.${tutorialId}.steps.${step.id}.description` as Parameters<typeof t>[0])}
        </p>
        <div className="tutorial-actions">
          <button className="btn btn-primary" onClick={handleNext}>
            {t(`tours.${tutorialId}.steps.${step.id}.actionText` as Parameters<typeof t>[0]) ||
              (stepIndex === totalSteps - 1 ? t('complete') : t('next'))}
          </button>
          {step.skipAllowed !== false && (
            <button className="btn btn-secondary" onClick={onSkip}>
              {t('skip')}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
