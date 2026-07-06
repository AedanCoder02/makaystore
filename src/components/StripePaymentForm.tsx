'use client';

import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface Props {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  loading?: boolean;
}

export default function StripePaymentForm({
  amount,
  onSuccess,
  onError,
  loading = false,
}: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe is not loaded');
      return;
    }

    setProcessing(true);
    setError('');

    // In test mode, simulate a successful payment using createPaymentMethod
    // In production, this would call backend: POST /api/create-payment-intent
    const mockPaymentIntentId = `pi_test_${Date.now()}`;

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const result = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
        onError(result.error.message || 'Payment failed');
      } else {
        // Simulate successful payment in test mode
        onSuccess(mockPaymentIntentId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      onError(message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="stripe-payment-form">
      <h2>Payment Information</h2>

      <div className="test-card-info">
        <p>Test Mode</p>
        <p className="test-card">Card: 4242 4242 4242 4242</p>
        <p className="test-card-desc">Expires: 12/25, CVC: any 3 digits</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card-element-wrapper">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#fa755a',
                },
              },
            }}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          type="submit"
          className="btn-primary"
          disabled={!stripe || processing || loading}
        >
          {processing || loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </button>
      </form>
    </div>
  );
}
