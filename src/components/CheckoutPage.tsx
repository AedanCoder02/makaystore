'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCart } from '@/hooks/useCart';
import ShippingForm from '@/components/ShippingForm';
import ShippingMethodSelector, {
  getShippingCost,
} from '@/components/ShippingMethodSelector';
import StripePaymentForm from '@/components/StripePaymentForm';
import OrderSummaryCheckout from '@/components/OrderSummaryCheckout';
// orders are persisted via /api/orders
import '@/styles/checkout.css';

interface FormData {
  name: string;
  email: string;
  address: string;
  city: string;
  zip: string;
  country: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const t = useTranslations('checkout');

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    address: '',
    city: '',
    zip: '',
    country: '',
  });

  const [shippingMethod, setShippingMethod] = useState('standard');
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const shippingCost = getShippingCost(shippingMethod);
  const finalTotal = totalPrice + shippingCost;

  if (items.length === 0) {
    return (
      <div className="checkout-empty">
        <h1>{t('emptyCart')}</h1>
        <p>{t('emptyCartDesc')}</p>
        <button onClick={() => router.push('/cart')} className="btn-primary">
          {t('backToCart')}
        </button>
      </div>
    );
  }

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleShippingSubmit = () => {
    setStep('payment');
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          subtotal: totalPrice,
          shipping_cost: shippingCost,
          total: finalTotal,
          shipping_address: formData,
          shipping_method: shippingMethod,
          payment_id: paymentIntentId,
          customer_email: formData.email,
        }),
      });
      const order = await res.json();
      clearCart();
      router.push(`/order-confirmation/${order.id}`);
    } catch {
      setError('Order could not be saved. Please contact support.');
      setLoading(false);
    }
  };

  const handlePaymentError = (paymentError: string) => {
    setError(paymentError);
  };

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        {/* Left column: Forms */}
        <div className="checkout-forms">
          {step === 'shipping' && (
            <>
              <ShippingForm
                formData={formData}
                onChange={handleFormChange}
                onSubmit={handleShippingSubmit}
                loading={loading}
              />
              <ShippingMethodSelector
                selected={shippingMethod}
                onChange={setShippingMethod}
              />
            </>
          )}

          {step === 'payment' && (
            <>
              <button
                className="btn-back"
                onClick={() => setStep('shipping')}
              >
                &larr; {t('backToShipping')}
              </button>
              <StripePaymentForm
                amount={finalTotal}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                loading={loading}
              />
              {error && <div className="error-message">{error}</div>}
            </>
          )}
        </div>

        {/* Right column: Summary */}
        <aside className="checkout-summary">
          <OrderSummaryCheckout
            items={items}
            totalPrice={totalPrice}
            shippingCost={shippingCost}
          />
        </aside>
      </div>
    </div>
  );
}
