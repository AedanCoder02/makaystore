'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Order } from '@/lib/mockOrders';

export default function OrderConfirmationPage({ order }: { order: Order }) {
  const t = useTranslations('checkout');

  const shippingMethodLabel: Record<string, string> = {
    standard: t('shippingMethods.standardLabel'),
    express: t('shippingMethods.expressLabel'),
    overnight: t('shippingMethods.overnightLabel'),
  };

  return (
    <div className="order-confirmation-container">
      <div className="confirmation-card">
        <div className="confirmation-icon">✓</div>

        <h1>{t('orderConfirmed')}</h1>
        <p className="confirmation-number">{t('orderNumber')}{order.id}</p>
        <p className="confirmation-message">
          {t('thankYou')}
        </p>

        <div className="order-summary-section">
          <h2>{t('orderSummary')}</h2>
          <div className="items-list">
            {order.items.map((item) => (
              <div key={`${item.productId}-${item.variantId}`} className="summary-item">
                <span>{item.title}</span>
                <span>{t('qty')}: {item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="summary-totals">
            <div className="total-row">
              <span>{t('subtotal')}:</span>
              <span>${(order.total - order.shippingCost).toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>{t('shippingCost')}:</span>
              <span>${order.shippingCost.toFixed(2)}</span>
            </div>
            <div className="total-row total">
              <span>{t('total')}:</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="shipping-section">
          <h2>{t('shippingDetails')}</h2>
          <p>
            <strong>{t('name')}:</strong> {order.shippingAddress.name}
          </p>
          <p>
            <strong>{t('address')}:</strong> {order.shippingAddress.address}
          </p>
          <p>
            <strong>{t('city')}, {t('zipCode')}:</strong> {order.shippingAddress.city}, {order.shippingAddress.zip}
          </p>
          <p>
            <strong>{t('country')}:</strong> {order.shippingAddress.country}
          </p>
          <p>
            <strong>{t('shippingMethod')}:</strong> {shippingMethodLabel[order.shippingMethod]}
          </p>
        </div>

        <div className="status-section">
          <p className="status-badge">
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </p>
        </div>

        <div className="confirmation-actions">
          <Link href="/products" className="btn btn-primary">
            {t('continueShopping')}
          </Link>
          <p className="secondary-link">
            <a href="#orders">{t('viewAllOrders')}</a> {t('comingSoon')}
          </p>
        </div>
      </div>
    </div>
  );
}
