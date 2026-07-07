/**
 * Unit tests for useTutorial hook
 */
import { renderHook, act } from '@testing-library/react';

// useTutorial uses useTutorialStore + TUTORIAL_DEFINITIONS
// No external deps to mock — it uses the real Zustand store

describe('useTutorial', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  const renderTutorial = (tutorialId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useTutorial } = require('@/hooks/useTutorial');
    return renderHook(() => useTutorial(tutorialId));
  };

  it('is initially inactive', () => {
    const { result } = renderTutorial('worker-clock-in');
    expect(result.current.isActive).toBe(false);
  });

  it('returns steps for a known tutorial', () => {
    const { result } = renderTutorial('worker-clock-in');
    expect(result.current.steps.length).toBeGreaterThan(0);
  });

  it('becomes active when the tutorial store activates it', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useTutorialStore } = require('@/stores/tutorialStore');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useTutorial } = require('@/hooks/useTutorial');

    const { result } = renderHook(() => useTutorial('worker-clock-in'));

    act(() => { useTutorialStore.getState().showTutorial('worker-clock-in'); });

    expect(result.current.isActive).toBe(true);
    expect(result.current.currentStep).toBe(0);
  });

  it('advances step on next()', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useTutorialStore } = require('@/stores/tutorialStore');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useTutorial } = require('@/hooks/useTutorial');

    const { result } = renderHook(() => useTutorial('worker-clock-in'));
    act(() => { useTutorialStore.getState().showTutorial('worker-clock-in'); });

    act(() => { result.current.next(); });
    expect(result.current.currentStep).toBe(1);
  });

  it('deactivates on skip()', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useTutorialStore } = require('@/stores/tutorialStore');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useTutorial } = require('@/hooks/useTutorial');

    const { result } = renderHook(() => useTutorial('worker-clock-in'));
    act(() => { useTutorialStore.getState().showTutorial('worker-clock-in'); });

    act(() => { result.current.skip(); });
    expect(result.current.isActive).toBe(false);
  });

  it('computes progress correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useTutorialStore } = require('@/stores/tutorialStore');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useTutorial } = require('@/hooks/useTutorial');

    const { result } = renderHook(() => useTutorial('worker-clock-in'));
    act(() => { useTutorialStore.getState().showTutorial('worker-clock-in'); });

    // Step 0 of 3 → progress = round((0+1)/3 * 100) = 33
    expect(result.current.progress).toBe(33);
  });

  it('returns empty steps for unknown tutorial id', () => {
    const { result } = renderTutorial('nonexistent-tutorial');
    expect(result.current.steps).toHaveLength(0);
    expect(result.current.totalSteps).toBe(0);
  });
});
