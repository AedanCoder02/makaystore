import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import sql from '@/lib/db';
import { syncBinanceOrder } from '@/lib/binancePay';
import { binanceApiEnabled, parseJsonArray } from '@/lib/payments';
import ClearCartOnReturn from '@/components/orders/ClearCartOnReturn';

interface OrderRow {
  id: string;
  items: Array<{ title: string; price: number; quantity: number; image?: string }>;
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_address: { name: string; address: string; city: string; zip: string; country: string };
  shipping_method: string;
  status: string;
  payment_status: string | null;
  payment_methods: Array<{ method: string }>;
  created_at: string;
}

const STATUS_ICON: Record<string, string> = {
  awaiting_payment: '…', pending_verification: '⏳', paid: '✓', verified: '✓', rejected: '✕',
};

async function fetchOrder(id: string): Promise<OrderRow | null> {
  try {
    const rows = await sql`SELECT * FROM orders WHERE id = ${id}`;
    if (!rows[0]) return null;
    const r = rows[0] as any;
    return {
      ...r,
      items: typeof r.items === 'string' ? JSON.parse(r.items) : (r.items ?? []),
      shipping_address: typeof r.shipping_address === 'string' ? JSON.parse(r.shipping_address) : (r.shipping_address ?? {}),
      payment_methods: parseJsonArray(r.payment_methods),
    };
  } catch {
    return null;
  }
}

const METHOD_LABEL: Record<string, string> = {
  standard: 'Standard (5-7 days)',
  express: 'Express (2-3 days)',
  overnight: 'Overnight (1 day)',
};

export default async function OrderConfirmationRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let order = await fetchOrder(id);

  // Returning from Binance Pay: ask Binance for the real status before rendering.
  if (order?.payment_status === 'awaiting_payment' && order.payment_methods[0]?.method === 'binance' && binanceApiEnabled()) {
    const synced = await syncBinanceOrder(order.id).catch(() => null);
    if (synced && synced !== order.payment_status) order = await fetchOrder(id);
  }
  const tStatus = await getTranslations('checkout.paymentStatus');

  if (!order) {
    return (
      <div className="order-confirmation-container">
        <div className="confirmation-card" style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair-display)' }}>Order not found</h1>
          <p style={{ marginTop: '1rem' }}>
            <Link href="/products" style={{ color: 'var(--makay-peachy-rose)' }}>Continue shopping</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-confirmation-container">
      <div className="confirmation-card">
        <ClearCartOnReturn orderId={order.id} />
        {order.payment_status ? (
          <>
            <div className={`confirmation-icon confirmation-icon--${order.payment_status}`}>
              {STATUS_ICON[order.payment_status] ?? '✓'}
            </div>
            <h1>{tStatus(`${order.payment_status}.title` as 'paid.title')}</h1>
            <p className="confirmation-number">Order {order.id}</p>
            <p className="confirmation-message">{tStatus(`${order.payment_status}.body` as 'paid.body')}</p>
            {order.payment_status === 'awaiting_payment' && (
              <p style={{ textAlign: 'center' }}>
                <Link href={`/order-confirmation/${order.id}`} className="btn-secondary">{tStatus('refresh')}</Link>
              </p>
            )}
          </>
        ) : (
          <>
            <div className="confirmation-icon">✓</div>
            <h1>Order Confirmed!</h1>
            <p className="confirmation-number">Order {order.id}</p>
            <p className="confirmation-message">
              Thank you for your purchase. We&apos;ll send updates as your order is processed.
            </p>
          </>
        )}

        <div className="order-summary-section">
          <h2>Order Summary</h2>
          <div className="items-list">
            {order.items.map((item, i) => (
              <div key={i} className="order-item">
                <div className="order-item-details">
                  <span className="item-title">{item.title}</span>
                  <span className="item-quantity">× {item.quantity}</span>
                </div>
                <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="order-totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>${Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Shipping ({METHOD_LABEL[order.shipping_method] ?? order.shipping_method})</span>
              <span>${Number(order.shipping_cost).toFixed(2)}</span>
            </div>
            <div className="total-row total-final">
              <span>Total</span>
              <span>${Number(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {order.shipping_address?.address && (
          <div className="order-summary-section">
            <h2>Shipping To</h2>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.9rem', color: 'var(--makay-mauve)', lineHeight: 1.6 }}>
              {order.shipping_address.name}<br />
              {order.shipping_address.address}<br />
              {order.shipping_address.city}, {order.shipping_address.zip}<br />
              {order.shipping_address.country}
            </p>
          </div>
        )}

        <div className="confirmation-actions">
          <Link href={`/orders/${order.id}`} className="btn-primary">Track Order</Link>
          <Link href="/products" className="btn-secondary">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
