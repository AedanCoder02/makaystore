'use client';

import { useTranslations } from 'next-intl';
import { CartItem } from '@/stores/cartStore';

interface Props {
  items: CartItem[];
  totalPrice: number;
  shippingCost: number;
}

export default function OrderSummaryCheckout({
  items,
  totalPrice,
  shippingCost,
}: Props) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const finalTotal = totalPrice + shippingCost;
  const t = useTranslations('checkout');
  const tCart = useTranslations('cart');

  return (
    <div className="order-summary-checkout">
      <h2>{t('orderSummary')}</h2>

      <div className="summary-items">
        <p className="summary-label">{tCart('items')} ({itemCount})</p>
        {items.map((item) => (
          <div key={`${item.productId}-${item.variantId}`} className="summary-item-line">
            <span>{item.title} &times; {item.quantity}</span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="summary-row">
        <span>{t('subtotal')}</span>
        <span>${totalPrice.toFixed(2)}</span>
      </div>

      <div className="summary-row">
        <span>{t('shippingCost')}</span>
        <span>${shippingCost.toFixed(2)}</span>
      </div>

      <div className="summary-row total">
        <span>{t('total')}</span>
        <span>${finalTotal.toFixed(2)}</span>
      </div>
    </div>
  );
}
