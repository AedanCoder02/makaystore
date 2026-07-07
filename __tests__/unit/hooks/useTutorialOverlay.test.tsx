/**
 * Unit tests for useTutorialOverlay hook
 * useTutorialOverlay(tutorialId) returns a ReactNode:
 *   - null when tutorial is inactive
 *   - TutorialOverlay element when tutorial is active with a current step
 */
import React from 'react';
import { renderHook } from '@testing-library/react';
import { act } from '@testing-library/react';

// ─── Mocks ────────────────────────────────────────────────────────────────────
// Mock TutorialOverlay so renderHook doesn't require full component tree
jest.mock('@/components/TutorialOverlay', () => {
  return function MockTutorialOverlay({ step }: { step: { title: string } }) {
    return <div data-testid="tutorial-overlay">{step.title}</div>;
  };
});

import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';
import { useTutorialStore } from '@/stores/tutorialStore';

describe('useTutorialOverlay', () => {
  beforeEach(() => {
    // Reset store to clean state
    useTutorialStore.setState({
      currentTutorial: null,
      currentStep: 0,
      completed: new Set<string>(),
      userRole: 'admin',
    });
  });

  it('returns null when tutorial is not active', () => {
    const { result } = renderHook(() => useTutorialOverlay('worker-clock-in'));
    expect(result.current).toBeNull();
  });

  it('returns a React element when the tutorial is active', () => {
    act(() => {
      useTutorialStore.getState().showTutorial('worker-clock-in');
    });

    const { result } = renderHook(() => useTutorialOverlay('worker-clock-in'));
    expect(result.current).not.toBeNull();
    expect(React.isValidElement(result.current)).toBe(true);
  });

  it('returns null for a different tutorialId when another is active', () => {
    act(() => {
      useTutorialStore.getState().showTutorial('worker-clock-in');
    });

    const { result } = renderHook(() => useTutorialOverlay('admin-tour'));
    expect(result.current).toBeNull();
  });

  it('returns null after tutorial is skipped', () => {
    act(() => {
      useTutorialStore.getState().showTutorial('worker-clock-in');
    });

    act(() => {
      useTutorialStore.getState().skip();
    });

    const { result } = renderHook(() => useTutorialOverlay('worker-clock-in'));
    expect(result.current).toBeNull();
  });

  it('returns null for a tutorialId with no defined steps', () => {
    act(() => {
      useTutorialStore.getState().showTutorial('nonexistent-tutorial-id');
    });

    const { result } = renderHook(() => useTutorialOverlay('nonexistent-tutorial-id'));
    // No steps → currentStepObj is undefined → should return null
    expect(result.current).toBeNull();
  });
});
