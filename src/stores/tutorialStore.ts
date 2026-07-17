import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserRole = 'worker' | 'supervisor' | 'admin' | 'seller' | 'customer';

interface TutorialState {
  currentTutorial: string | null;
  currentStep: number;
  completed: string[]; // Array instead of Set — avoids JSON serialization crash
  userRole: UserRole;
  showTutorial: (tutorialId: string) => void;
  nextStep: () => void;
  skip: () => void;
  complete: () => void;
  resetTutorial: (tutorialId: string) => void;
  setUserRole: (role: UserRole) => void;
  isCompleted: (tutorialId: string) => boolean;
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set, get) => ({
      currentTutorial: null,
      currentStep: 0,
      completed: [],
      userRole: 'admin',

      showTutorial: (tutorialId) =>
        set({ currentTutorial: tutorialId, currentStep: 0 }),

      nextStep: () =>
        set((state) => ({ currentStep: state.currentStep + 1 })),

      skip: () =>
        set((state) => ({
          // Skipping counts as seen — won't auto-show again. HelpCircle can still replay via showTutorial().
          completed: state.currentTutorial
            ? [...new Set([...state.completed, state.currentTutorial])]
            : state.completed,
          currentTutorial: null,
          currentStep: 0,
        })),

      complete: () =>
        set((state) => ({
          completed: [...new Set([...state.completed, state.currentTutorial || ''])],
          currentTutorial: null,
          currentStep: 0,
        })),

      resetTutorial: (tutorialId) =>
        set({ currentTutorial: tutorialId, currentStep: 0 }),

      setUserRole: (role) =>
        set({ userRole: role }),

      isCompleted: (tutorialId) =>
        get().completed.includes(tutorialId),
    }),
    {
      name: 'makay-tutorials',
      version: 2,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
