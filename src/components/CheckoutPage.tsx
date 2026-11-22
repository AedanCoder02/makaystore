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
  const tPay = useTranslations('checkout.pay');

  const [formData, setFormData] = useState<FormData>({
    name: '', email: '', address: '', city: '', zip: '', country: '',
  });
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');

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

  const createOrder = async (entries: PaymentEntry[]): Promise<string> => {
    const fd = new FormData();
    fd.append('payload', JSON.stringify({
      items,
      subtotal: totalPrice,
      shipping_cost: shippingCost,
      total: finalTotal,
      shipping_address: formData,
      shipping_method: shippingMethod,
      customer_email: formData.email,
      payment_methods: entries.map(e => ({ method: e.method, amount: e.amount, reference: e.reference })),
    }));
    entries.forEach((e, i) => { if (e.proof) fd.append(`proof_${i}`, e.proof); });

    const res = await fetch('/api/orders', { method: 'POST', body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.id) throw new Error(data.error || tPay('errors.order'));
    return data.id as string;
  };

  const handleComplete = (orderId: string) => {
    clearCart();
    router.push(`/order-confirmation/${orderId}`);
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
                loading={false}
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
                customer={{ name: formData.name, email: formData.email }}
                createOrder={createOrder}
                onComplete={handleComplete}
                onBack={() => setStep('shipping')}
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
