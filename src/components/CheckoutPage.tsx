'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCart } from '@/hooks/useCart';
import ShippingForm from '@/components/ShippingForm';
import ShippingMethodSelector, { getShippingCost } from '@/components/ShippingMethodSelector';
import PaymentStep, { type PaymentEntry } from '@/components/PaymentStep';
import OrderSummaryCheckout from '@/components/OrderSummaryCheckout';
import StripeProvider from '@/components/StripeProvider';
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
    name: '', email: '', address: '', city: '', zip: '', country: '',
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
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentSuccess = async (paymentMethods: PaymentEntry[]) => {
    setLoading(true);
    setError('');
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
          payment_id: paymentMethods[0]?.receipt_url ?? '',
          customer_email: formData.email,
          payment_methods: paymentMethods,
        }),
      });
      const order = await res.json();
      clearCart();
      router.push(`/order-confirmation/${order.id}`);
    } catch {
      setError('No se pudo guardar el pedido. Contacta soporte.');
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-forms">
          {step === 'shipping' && (
            <>
              <ShippingForm
                formData={formData}
                onChange={handleFormChange}
                onSubmit={() => setStep('payment')}
                loading={loading}
              />
              <ShippingMethodSelector
                selected={shippingMethod}
                onChange={setShippingMethod}
              />
            </>
          )}

          {step === 'payment' && (
            <StripeProvider>
              <PaymentStep
                total={finalTotal}
                onSuccess={handlePaymentSuccess}
                onBack={() => setStep('shipping')}
                loading={loading}
                error={error}
              />
            </StripeProvider>
          )}
        </div>

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
