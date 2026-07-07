'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CartItem } from '@/stores/cartStore';

interface Props {
  items: CartItem[];
  totalPrice: number;
}

export default function CartSummary({ items, totalPrice }: Props) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const discount = 0;
  const total = totalPrice - discount;
  const isEmpty = items.length === 0;
  const t = useTranslations('cart');

  return (
    <div className="cart-summary">
      <h2>{t('orderSummary')}</h2>

      <div className="summary-row">
        <span>{t('items')}</span>
        <span>{itemCount}</span>
      </div>

      <div className="summary-row">
        <span>{t('subtotal')}</span>
        <span>${totalPrice.toFixed(2)}</span>
      </div>

      {discount > 0 && (
        <div className="summary-row discount">
          <span>{t('discount')}</span>
          <span>-${discount.toFixed(2)}</span>
        </div>
      )}

      <div className="summary-row total">
        <span>{t('total')}</span>
        <span>${total.toFixed(2)}</span>
      </div>

      <div className="summary-actions">
        <Link href="/products" className="btn-secondary">
          {t('continueShopping')}
        </Link>
        <Link
          href="/checkout"
          className={`btn-primary${isEmpty ? ' disabled' : ''}`}
          onClick={(e) => {
            if (isEmpty) e.preventDefault();
          }}
          aria-disabled={isEmpty}
        >
          {t('proceedToCheckout')}
        </Link>
      </div>
    </div>
  );
}
