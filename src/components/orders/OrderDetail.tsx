'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Circle, Package, Truck, MapPin, ArrowLeft } from 'lucide-react';

interface Order {
  id: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  status: string;
  items: Array<{ title: string; quantity: number; price: number; image?: string }>;
  shipping_address: { name: string; address: string; city: string; zip: string; country: string };
  shipping_method: string;
  created_at: string;
}

const STEPS = [
  { key: 'pending',   label: 'Order Placed',  icon: Package },
  { key: 'confirmed', label: 'Confirmed',      icon: CheckCircle },
  { key: 'shipped',   label: 'Shipped',        icon: Truck },
  { key: 'delivered', label: 'Delivered',      icon: MapPin },
];

const STEP_INDEX: Record<string, number> = {
  pending: 0, confirmed: 1, shipped: 2, delivered: 3,
};

const METHOD_LABEL: Record<string, string> = {
  standard:  'Standard (5–7 days)',
  express:   'Express (2–3 days)',
  overnight: 'Overnight (1 day)',
};

export default function OrderDetail({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then(r => { if (r.status === 404) { setNotFound(true); return null; } return r.json(); })
      .then(data => { if (data) setOrder(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [orderId]);

  if (loading) return <p style={{ textAlign: 'center', padding: '4rem', color: 'var(--makay-mauve)', fontFamily: 'var(--font-montserrat)' }}>Loading…</p>;

  if (notFound || !order) return (
    <div style={{ textAlign: 'center', padding: '4rem 1.25rem' }}>
      <p style={{ fontFamily: 'var(--font-montserrat)', color: 'var(--makay-mauve)' }}>Order not found.</p>
      <Link href="/orders" style={{ color: 'var(--makay-peachy-rose)', fontFamily: 'var(--font-montserrat)', fontSize: '0.9rem' }}>← Back to orders</Link>
    </div>
  );

  const currentStep = STEP_INDEX[order.status] ?? 0;

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '2rem 1.25rem' }}>
      <Link href="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--makay-mauve)', fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', textDecoration: 'none', marginBottom: '1.5rem' }}>
        <ArrowLeft size={14} /> Back to orders
      </Link>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--makay-dark-navy)', margin: 0 }}>
          {order.id}
        </h1>
        <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-mauve)' }}>
          {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      {/* Status Timeline */}
      <div style={{ background: '#fff', border: '1px solid var(--makay-sand-cream)', borderRadius: '16px', padding: '1.75rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--makay-mauve)', marginBottom: '1.5rem' }}>
          Order Status
        </h2>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, position: 'relative' }}>
          {STEPS.map((step, i) => {
            const done = i <= currentStep;
            const Icon = step.icon;
            return (
              <div key={step.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {/* connector line */}
                {i < STEPS.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    top: 16, left: '50%', right: '-50%',
                    height: 2,
                    background: i < currentStep ? 'var(--makay-peachy-rose)' : 'var(--makay-sand-cream)',
                    zIndex: 0,
                  }} />
                )}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: done ? 'var(--makay-dark-navy)' : 'var(--makay-sand-cream)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 1, position: 'relative', flexShrink: 0,
                  border: i === currentStep ? '2px solid var(--makay-peachy-rose)' : 'none',
                  transition: 'background 0.3s',
                }}>
                  {done ? <Icon size={14} color="#fff" /> : <Circle size={14} color="var(--makay-mauve)" />}
                </div>
                <span style={{
                  fontFamily: 'var(--font-montserrat)', fontSize: '0.7rem', fontWeight: i === currentStep ? 700 : 500,
                  color: done ? 'var(--makay-dark-navy)' : 'var(--makay-mauve)',
                  marginTop: '0.5rem', textAlign: 'center',
                }}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Items */}
      <div style={{ background: '#fff', border: '1px solid var(--makay-sand-cream)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--makay-mauve)', marginBottom: '1rem' }}>
          Items ({order.items.length})
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {order.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {item.image && (
                <img src={item.image} alt={item.title} style={{ width: 48, height: 48, borderRadius: '8px', objectFit: 'cover', background: 'var(--makay-sand-cream)' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 600, fontSize: '0.88rem', color: 'var(--makay-dark-navy)', margin: 0 }}>{item.title}</p>
                <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: 'var(--makay-mauve)', margin: 0 }}>× {item.quantity}</p>
              </div>
              <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 600, fontSize: '0.88rem', color: 'var(--makay-dark-navy)' }}>
                ${(Number(item.price) * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--makay-sand-cream)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: 'var(--makay-mauve)' }}>
            <span>Subtotal</span><span>${Number(order.subtotal).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: 'var(--makay-mauve)' }}>
            <span>Shipping ({METHOD_LABEL[order.shipping_method] ?? order.shipping_method})</span>
            <span>${Number(order.shipping_cost).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-playfair-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--makay-dark-navy)', marginTop: '0.25rem' }}>
            <span>Total</span><span>${Number(order.total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      {order.shipping_address?.address && (
        <div style={{ background: '#fff', border: '1px solid var(--makay-sand-cream)', borderRadius: '16px', padding: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--makay-mauve)', marginBottom: '0.75rem' }}>
            Shipping Address
          </h2>
          <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.88rem', color: 'var(--makay-dark-navy)', lineHeight: 1.7, margin: 0 }}>
            {order.shipping_address.name}<br />
            {order.shipping_address.address}<br />
            {order.shipping_address.city}, {order.shipping_address.zip}<br />
            {order.shipping_address.country}
          </p>
        </div>
      )}
    </main>
  );
}
