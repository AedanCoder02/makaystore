/**
 * Component tests for TutorialOverlay
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TutorialOverlay from '@/components/TutorialOverlay';
import type { TutorialStep } from '@/lib/tutorials';

const step: TutorialStep = {
  target: '.test-target',
  title: 'Welcome Step',
  description: 'This is the first step of the tutorial.',
  placement: 'bottom',
  skipAllowed: true,
};

describe('TutorialOverlay', () => {
  it('renders the step title', () => {
    render(<TutorialOverlay step={step} stepIndex={0} totalSteps={3} onNext={jest.fn()} onSkip={jest.fn()} />);
    expect(screen.getByText('Welcome Step')).toBeInTheDocument();
  });

  it('renders the step description', () => {
    render(<TutorialOverlay step={step} stepIndex={0} totalSteps={3} onNext={jest.fn()} onSkip={jest.fn()} />);
    expect(screen.getByText('This is the first step of the tutorial.')).toBeInTheDocument();
  });

  it('renders step counter', () => {
    render(<TutorialOverlay step={step} stepIndex={0} totalSteps={3} onNext={jest.fn()} onSkip={jest.fn()} />);
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
  });

  it('renders Next button on non-last step', () => {
    render(<TutorialOverlay step={step} stepIndex={0} totalSteps={3} onNext={jest.fn()} onSkip={jest.fn()} />);
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('renders Finish button on last step', () => {
    render(<TutorialOverlay step={step} stepIndex={2} totalSteps={3} onNext={jest.fn()} onSkip={jest.fn()} />);
    expect(screen.getByText('Finish')).toBeInTheDocument();
  });

  it('renders custom actionText when provided', () => {
    const customStep = { ...step, actionText: 'Got it!' };
    render(<TutorialOverlay step={customStep} stepIndex={0} totalSteps={3} onNext={jest.fn()} onSkip={jest.fn()} />);
    expect(screen.getByText('Got it!')).toBeInTheDocument();
  });

  it('renders Skip button when skipAllowed is true', () => {
    render(<TutorialOverlay step={step} stepIndex={0} totalSteps={3} onNext={jest.fn()} onSkip={jest.fn()} />);
    expect(screen.getByText('Skip')).toBeInTheDocument();
  });

  it('hides Skip button when skipAllowed is false', () => {
    const noSkipStep = { ...step, skipAllowed: false };
    render(<TutorialOverlay step={noSkipStep} stepIndex={0} totalSteps={3} onNext={jest.fn()} onSkip={jest.fn()} />);
    expect(screen.queryByText('Skip')).toBeNull();
  });

  it('calls onNext when Next is clicked on non-last step', () => {
    const onNext = jest.fn();
    render(<TutorialOverlay step={step} stepIndex={0} totalSteps={3} onNext={onNext} onSkip={jest.fn()} />);
    fireEvent.click(screen.getByText('Next'));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('calls onSkip when Finish is clicked on last step', () => {
    const onSkip = jest.fn();
    render(<TutorialOverlay step={step} stepIndex={2} totalSteps={3} onNext={jest.fn()} onSkip={onSkip} />);
    fireEvent.click(screen.getByText('Finish'));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('calls onSkip when Skip button is clicked', () => {
    const onSkip = jest.fn();
    render(<TutorialOverlay step={step} stepIndex={0} totalSteps={3} onNext={jest.fn()} onSkip={onSkip} />);
    fireEvent.click(screen.getByText('Skip'));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('calls onSkip when backdrop is clicked', () => {
    const onSkip = jest.fn();
    const { container } = render(<TutorialOverlay step={step} stepIndex={0} totalSteps={3} onNext={jest.fn()} onSkip={onSkip} />);
    const backdrop = container.querySelector('.tutorial-backdrop')!;
    fireEvent.click(backdrop);
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
