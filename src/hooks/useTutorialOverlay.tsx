'use client';

import { ReactNode } from 'react';
import { useTutorial } from './useTutorial';
import TutorialOverlay from '@/components/TutorialOverlay';

export const useTutorialOverlay = (tutorialId: string): ReactNode => {
  const tutorial = useTutorial(tutorialId);

  if (!tutorial.isActive || !tutorial.currentStepObj) {
    return null;
  }

  return (
    <TutorialOverlay
      tutorialId={tutorialId}
      step={tutorial.currentStepObj}
      stepIndex={tutorial.currentStep}
      totalSteps={tutorial.totalSteps}
      onNext={tutorial.next}
      onSkip={tutorial.skip}
    />
  );
};
