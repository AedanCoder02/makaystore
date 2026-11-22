/**
 * Component tests for StripePaymentForm (real PaymentIntent flow via confirmCardPayment).
 */
import React from 'react';

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

const mockConfirmCardPayment = jest.fn();
const mockGetElement = jest.fn();

const submit = async () => {
  await act(async () => {
    fireEvent.submit(screen.getByRole('button').closest('form')!);
  });
};

describe('StripePaymentForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useStripe as jest.Mock).mockReturnValue({ confirmCardPayment: mockConfirmCardPayment });
    (useElements as jest.Mock).mockReturnValue({ getElement: mockGetElement });
    mockGetElement.mockReturnValue({ _element: true });
  });

  const baseProps = () => ({
    amount: 50,
    getClientSecret: jest.fn().mockResolvedValue('pi_123_secret_abc'),
    onSuccess: jest.fn(),
    onError: jest.fn(),
  });

  it('renders the CardElement and pay button', () => {
    render(<StripePaymentForm {...baseProps()} />);
    expect(screen.getByTestId('card-element')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('payCard');
  });

  it('shows Processing when loading prop is true', () => {
    render(<StripePaymentForm {...baseProps()} loading />);
    expect(screen.getByRole('button')).toHaveTextContent('Processing...');
  });

  it('confirms the server PaymentIntent and reports success with its id', async () => {
    const props = baseProps();
    mockConfirmCardPayment.mockResolvedValue({ paymentIntent: { id: 'pi_123', status: 'succeeded' } });

    render(<StripePaymentForm {...props} billing={{ name: 'Ana', email: 'a@b.co' }} />);
    await submit();

    expect(props.getClientSecret).toHaveBeenCalledTimes(1);
    expect(mockConfirmCardPayment).toHaveBeenCalledWith('pi_123_secret_abc', {
      payment_method: { card: { _element: true }, billing_details: { name: 'Ana', email: 'a@b.co' } },
    });
    expect(props.onSuccess).toHaveBeenCalledWith('pi_123');
  });

  it('shows the Stripe error and does not report success when the card is declined', async () => {
    const props = baseProps();
    mockConfirmCardPayment.mockResolvedValue({ error: { message: 'Card declined' } });

    render(<StripePaymentForm {...props} />);
    await submit();

    expect(props.onError).toHaveBeenCalledWith('Card declined');
    expect(props.onSuccess).not.toHaveBeenCalled();
    expect(screen.getByText('Card declined')).toBeInTheDocument();
  });

  it('surfaces server errors from creating the PaymentIntent', async () => {
    const props = baseProps();
    props.getClientSecret.mockRejectedValue(new Error('Pagos con tarjeta no configurados'));

    render(<StripePaymentForm {...props} />);
    await submit();

    expect(mockConfirmCardPayment).not.toHaveBeenCalled();
    expect(props.onError).toHaveBeenCalledWith('Pagos con tarjeta no configurados');
  });

  it('does not submit when Stripe has not loaded', async () => {
    (useStripe as jest.Mock).mockReturnValue(null);
    const props = baseProps();
    render(<StripePaymentForm {...props} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
