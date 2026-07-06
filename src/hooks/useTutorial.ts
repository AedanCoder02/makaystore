'use client';

import { useTutorialStore } from '@/stores/tutorialStore';
import { TUTORIAL_DEFINITIONS, TutorialStep } from '@/lib/tutorials';

interface UseTutorialReturn {
  steps: TutorialStep[];
  currentStep: number;
  currentStepObj: TutorialStep | undefined;
  isActive: boolean;
  totalSteps: number;
  progress: number;
  next: () => void;
  skip: () => void;
  restart: () => void;
}

export const useTutorial = (tutorialId: string): UseTutorialReturn => {
  const store = useTutorialStore();
  const tutorial = TUTORIAL_DEFINITIONS[tutorialId];
  const steps = tutorial?.steps || [];
  const currentStepObj = steps[store.currentStep];

  return {
    steps,
    currentStep: store.currentStep,
    currentStepObj,
    isActive: store.currentTutorial === tutorialId,
    totalSteps: steps.length,
    progress:
      steps.length > 0
        ? Math.round(((store.currentStep + 1) / steps.length) * 100)
        : 0,
    next: store.nextStep,
    skip: store.skip,
    restart: () => store.resetTutorial(tutorialId),
  };
};
