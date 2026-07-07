/**
 * Component tests for StripePaymentForm
 * Uses the existing stripe mock.
 */
import React from 'react';

// Mock Stripe before imports
jest.mock('@stripe/react-stripe-js', () => ({
  CardElement: function MockCardElement() {
    return <div data-testid="card-element" />;
  },
  useStripe: jest.fn(),
  useElements: jest.fn(),
}));

import { render, screen, fireEvent, act } from '@testing-library/react';
import StripePaymentForm from '@/components/StripePaymentForm';
import { useStripe, useElements } from '@stripe/react-stripe-js';

const mockCreatePaymentMethod = jest.fn();
const mockGetElement = jest.fn();

describe('StripePaymentForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useStripe as jest.Mock).mockReturnValue({ createPaymentMethod: mockCreatePaymentMethod });
    (useElements as jest.Mock).mockReturnValue({ getElement: mockGetElement });
    mockGetElement.mockReturnValue({ _element: true }); // truthy card element
  });

  it('renders the Payment Information heading', () => {
    render(<StripePaymentForm amount={99.99} onSuccess={jest.fn()} onError={jest.fn()} />);
    expect(screen.getByText('Payment Information')).toBeInTheDocument();
  });

  it('renders the test mode notice', () => {
    render(<StripePaymentForm amount={99.99} onSuccess={jest.fn()} onError={jest.fn()} />);
    expect(screen.getByText('Test Mode')).toBeInTheDocument();
  });

  it('renders the CardElement', () => {
    render(<StripePaymentForm amount={99.99} onSuccess={jest.fn()} onError={jest.fn()} />);
    expect(screen.getByTestId('card-element')).toBeInTheDocument();
  });

  it('renders the pay button with formatted amount', () => {
    render(<StripePaymentForm amount={99.99} onSuccess={jest.fn()} onError={jest.fn()} />);
    expect(screen.getByText('Pay $99.99')).toBeInTheDocument();
  });

  it('shows Processing when loading prop is true', () => {
    render(<StripePaymentForm amount={99.99} onSuccess={jest.fn()} onError={jest.fn()} loading={true} />);
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('calls onSuccess when payment method is created successfully', async () => {
    const onSuccess = jest.fn();
    mockCreatePaymentMethod.mockResolvedValue({ paymentMethod: { id: 'pm_test' } });

    render(<StripePaymentForm amount={50} onSuccess={onSuccess} onError={jest.fn()} />);

    await act(async () => {
      fireEvent.submit(screen.getByRole('button').closest('form')!);
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('calls onError when stripe returns an error', async () => {
    const onError = jest.fn();
    mockCreatePaymentMethod.mockResolvedValue({ error: { message: 'Card declined' } });

    render(<StripePaymentForm amount={50} onSuccess={jest.fn()} onError={onError} />);

    await act(async () => {
      fireEvent.submit(screen.getByRole('button').closest('form')!);
    });

    expect(onError).toHaveBeenCalledWith('Card declined');
    expect(screen.getByText('Card declined')).toBeInTheDocument();
  });

  it('shows error message when stripe is not loaded', async () => {
    (useStripe as jest.Mock).mockReturnValue(null);
    (useElements as jest.Mock).mockReturnValue(null);

    render(<StripePaymentForm amount={50} onSuccess={jest.fn()} onError={jest.fn()} />);

    await act(async () => {
      fireEvent.submit(screen.getByRole('button').closest('form')!);
    });

    expect(screen.getByText('Stripe is not loaded')).toBeInTheDocument();
  });
});
