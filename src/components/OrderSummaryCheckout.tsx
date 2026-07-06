'use client';

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

  return (
    <div className="order-summary-checkout">
      <h2>Order Summary</h2>

      <div className="summary-items">
        <p className="summary-label">Items ({itemCount})</p>
        {items.map((item) => (
          <div key={`${item.productId}-${item.variantId}`} className="summary-item-line">
            <span>{item.title} &times; {item.quantity}</span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="summary-row">
        <span>Subtotal</span>
        <span>${totalPrice.toFixed(2)}</span>
      </div>

      <div className="summary-row">
        <span>Shipping</span>
        <span>${shippingCost.toFixed(2)}</span>
      </div>

      <div className="summary-row total">
        <span>Total</span>
        <span>${finalTotal.toFixed(2)}</span>
      </div>
    </div>
  );
}
