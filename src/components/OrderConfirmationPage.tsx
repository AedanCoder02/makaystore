'use client';

import Link from 'next/link';
import { Order } from '@/lib/mockOrders';

export default function OrderConfirmationPage({ order }: { order: Order }) {
  const shippingMethods: Record<string, string> = {
    standard: 'Standard (5-7 days)',
    express: 'Express (2-3 days)',
    overnight: 'Overnight (next day)',
  };

  return (
    <div className="order-confirmation-container">
      <div className="confirmation-card">
        <div className="confirmation-icon">✓</div>

        <h1>Order Confirmed!</h1>
        <p className="confirmation-number">Order #{order.id}</p>
        <p className="confirmation-message">
          Thank you for your purchase. We'll notify you when your order ships.
        </p>

        <div className="order-summary-section">
          <h2>Order Summary</h2>
          <div className="items-list">
            {order.items.map((item) => (
              <div key={`${item.productId}-${item.variantId}`} className="summary-item">
                <span>{item.title}</span>
                <span>Qty: {item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="summary-totals">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>${(order.total - order.shippingCost).toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Shipping:</span>
              <span>${order.shippingCost.toFixed(2)}</span>
            </div>
            <div className="total-row total">
              <span>Total:</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="shipping-section">
          <h2>Shipping Details</h2>
          <p>
            <strong>Name:</strong> {order.shippingAddress.name}
          </p>
          <p>
            <strong>Address:</strong> {order.shippingAddress.address}
          </p>
          <p>
            <strong>City, ZIP:</strong> {order.shippingAddress.city}, {order.shippingAddress.zip}
          </p>
          <p>
            <strong>Country:</strong> {order.shippingAddress.country}
          </p>
          <p>
            <strong>Shipping Method:</strong> {shippingMethods[order.shippingMethod]}
          </p>
        </div>

        <div className="status-section">
          <p className="status-badge">
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </p>
        </div>

        <div className="confirmation-actions">
          <Link href="/products" className="btn btn-primary">
            Continue Shopping
          </Link>
          <p className="secondary-link">
            <a href="#orders">View All Orders</a> (coming soon)
          </p>
        </div>
      </div>
    </div>
  );
}
