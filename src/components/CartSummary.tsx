'use client';

import Link from 'next/link';
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

  return (
    <div className="cart-summary">
      <h2>Order Summary</h2>

      <div className="summary-row">
        <span>Items</span>
        <span>{itemCount}</span>
      </div>

      <div className="summary-row">
        <span>Subtotal</span>
        <span>${totalPrice.toFixed(2)}</span>
      </div>

      {discount > 0 && (
        <div className="summary-row discount">
          <span>Discount</span>
          <span>-${discount.toFixed(2)}</span>
        </div>
      )}

      <div className="summary-row total">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>

      <div className="summary-actions">
        <Link href="/products" className="btn-secondary">
          Continue Shopping
        </Link>
        <Link
          href="/checkout"
          className={`btn-primary${isEmpty ? ' disabled' : ''}`}
          onClick={(e) => {
            if (isEmpty) e.preventDefault();
          }}
          aria-disabled={isEmpty}
        >
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}
