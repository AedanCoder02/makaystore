/**
 * Unit tests for useTutorial hook
 */
import { renderHook, act } from '@testing-library/react';
import { useTutorial } from '@/hooks/useTutorial';
import { useTutorialStore } from '@/stores/tutorialStore';

describe('useTutorial', () => {
  beforeEach(() => {
    // Reset the tutorial store state between tests
    useTutorialStore.setState({
      currentTutorial: null,
      currentStep: 0,
      completedTutorials: [],
    });
  });

  it('is initially inactive', () => {
    const { result } = renderHook(() => useTutorial('worker-clock-in'));
    expect(result.current.isActive).toBe(false);
  });

  it('returns steps for a known tutorial', () => {
    const { result } = renderHook(() => useTutorial('worker-clock-in'));
    expect(result.current.steps.length).toBeGreaterThan(0);
  });

  it('becomes active when the tutorial store activates it', () => {
    const { result } = renderHook(() => useTutorial('worker-clock-in'));

    act(() => { useTutorialStore.getState().showTutorial('worker-clock-in'); });

    expect(result.current.isActive).toBe(true);
    expect(result.current.currentStep).toBe(0);
  });

  it('advances step on next()', () => {
    const { result } = renderHook(() => useTutorial('worker-clock-in'));
    act(() => { useTutorialStore.getState().showTutorial('worker-clock-in'); });

    act(() => { result.current.next(); });
    expect(result.current.currentStep).toBe(1);
  });

  it('deactivates on skip()', () => {
    const { result } = renderHook(() => useTutorial('worker-clock-in'));
    act(() => { useTutorialStore.getState().showTutorial('worker-clock-in'); });

    act(() => { result.current.skip(); });
    expect(result.current.isActive).toBe(false);
  });

  it('computes progress correctly', () => {
    const { result } = renderHook(() => useTutorial('worker-clock-in'));
    act(() => { useTutorialStore.getState().showTutorial('worker-clock-in'); });

    // Step 0 of 3 → progress = round((0+1)/3 * 100) = 33
    expect(result.current.progress).toBe(33);
  });

  it('returns empty steps for unknown tutorial id', () => {
    const { result } = renderHook(() => useTutorial('nonexistent-tutorial'));
    expect(result.current.steps).toHaveLength(0);
    expect(result.current.totalSteps).toBe(0);
  });
});
