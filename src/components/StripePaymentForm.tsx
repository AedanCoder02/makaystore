'use client';

import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useTranslations } from 'next-intl';
import { Lock } from 'lucide-react';

interface Props {
  amount: number;
  /** Creates the order (if needed) and returns the PaymentIntent client secret from the server. */
  getClientSecret: () => Promise<string>;
  /** Called after Stripe reports the PaymentIntent succeeded. */
  onSuccess: (paymentIntentId: string) => void | Promise<void>;
  onError: (error: string) => void;
  billing?: { name?: string; email?: string };
  loading?: boolean;
}

const isTestKey = (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '').startsWith('pk_test_');

export default function StripePaymentForm({
  amount,
  getClientSecret,
  onSuccess,
  onError,
  billing,
  loading = false,
}: Props) {
  const t = useTranslations('checkout.pay');
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const fail = (message: string) => {
    setError(message);
    onError(message);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const card = elements.getElement(CardElement);
    if (!card) return;

    setProcessing(true);
    setError('');
    try {
      const clientSecret = await getClientSecret();
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card, billing_details: { name: billing?.name, email: billing?.email } },
      });
      if (result.error) {
        fail(result.error.message || t('errors.generic'));
      } else if (result.paymentIntent?.status === 'succeeded') {
        await onSuccess(result.paymentIntent.id);
      } else {
        fail(t('errors.generic'));
      }
    } catch (err) {
      fail(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setProcessing(false);
    }
  };

  const busy = processing || loading;

  return (
    <form className="pay-card-form" onSubmit={handleSubmit}>
      <p className="pay-field-label">{t('cardTitle')}</p>
      {isTestKey && <p className="pay-test-note">{t('testMode')}</p>}

      <div className="pay-card-element">
        <CardElement
          options={{
            hidePostalCode: true,
            style: {
              base: {
                fontSize: '16px',
                color: '#1f2a44',
                fontFamily: 'Montserrat, system-ui, sans-serif',
                '::placeholder': { color: '#a99f95' },
              },
              invalid: { color: '#dc2626' },
            },
          }}
        />
      </div>

      {error && <div className="pay-error" role="alert">{error}</div>}

      <button type="submit" className="pay-submit" disabled={!stripe || busy}>
        {busy ? t('processing') : t('payCard', { amount: amount.toFixed(2) })}
      </button>
      <p className="pay-secure"><Lock size={12} /> {t('secure')}</p>
    </form>
  );
}
