import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'worker' | 'supervisor' | 'admin';

interface TutorialState {
  currentTutorial: string | null;
  currentStep: number;
  completed: Set<string>;
  userRole: UserRole;
  showTutorial: (tutorialId: string) => void;
  nextStep: () => void;
  skip: () => void;
  complete: () => void;
  resetTutorial: (tutorialId: string) => void;
  setUserRole: (role: UserRole) => void;
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set) => ({
      currentTutorial: null,
      currentStep: 0,
      completed: new Set<string>(),
      userRole: 'admin',

      showTutorial: (tutorialId) =>
        set({ currentTutorial: tutorialId, currentStep: 0 }),

      nextStep: () =>
        set((state) => ({ currentStep: state.currentStep + 1 })),

      skip: () =>
        set({ currentTutorial: null, currentStep: 0 }),

      complete: () =>
        set((state) => ({
          completed: new Set([...Array.from(state.completed), state.currentTutorial || '']),
          currentTutorial: null,
          currentStep: 0,
        })),

      resetTutorial: (tutorialId) =>
        set({ currentTutorial: tutorialId, currentStep: 0 }),

      setUserRole: (role) =>
        set({ userRole: role }),
    }),
    {
      name: 'makay-tutorials',
      version: 1,
    }
  )
);
