'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ChevronRight } from 'lucide-react';

interface Order {
  id: string;
  total: number;
  status: string;
  items: Array<{ title: string; quantity: number }>;
  created_at: string;
}

const STATUS_COLOR: Record<string, string> = {
  pending:   '#f59e0b',
  confirmed: '#3b82f6',
  shipped:   '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

export default function CustomerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setOrders(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.25rem' }}>
      <h1 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--makay-dark-navy)', marginBottom: '0.5rem' }}>
        My Orders
      </h1>
      <p style={{ fontFamily: 'var(--font-montserrat)', color: 'var(--makay-mauve)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Track and manage your purchases
      </p>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--makay-mauve)', padding: '3rem 0' }}>Loading…</p>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <Package size={48} style={{ color: 'var(--makay-sand-cream)', marginBottom: '1rem' }} />
          <p style={{ fontFamily: 'var(--font-montserrat)', color: 'var(--makay-mauve)', marginBottom: '1.5rem' }}>No orders yet.</p>
          <Link href="/products" style={{ display: 'inline-block', padding: '0.75rem 1.75rem', background: 'var(--makay-dark-navy)', color: '#fff', borderRadius: '100px', fontFamily: 'var(--font-montserrat)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
            Shop Now
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {orders.map(order => {
            const itemCount = order.items.reduce((s, i) => s + (i.quantity ?? 1), 0);
            const preview = order.items.slice(0, 2).map(i => i.title).join(', ');
            return (
              <Link key={order.id} href={`/orders/${order.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  background: '#fff', border: '1px solid var(--makay-sand-cream)',
                  borderRadius: '14px', padding: '1.25rem', cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'var(--makay-sand-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Package size={20} style={{ color: 'var(--makay-mauve)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 600, fontSize: '0.88rem', color: 'var(--makay-dark-navy)' }}>
                        {order.id}
                      </span>
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                        padding: '0.15rem 0.5rem', borderRadius: '100px',
                        background: `${STATUS_COLOR[order.status] ?? '#9ca3af'}18`,
                        color: STATUS_COLOR[order.status] ?? '#9ca3af',
                      }}>
                        {order.status}
                      </span>
                    </div>
                    <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-mauve)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {itemCount} item{itemCount !== 1 ? 's' : ''} · {preview}{order.items.length > 2 ? '…' : ''}
                    </p>
                    <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: '#c4b4a0', margin: '0.15rem 0 0' }}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--makay-peachy-rose)' }}>
                      ${Number(order.total).toFixed(2)}
                    </span>
                    <ChevronRight size={16} style={{ color: 'var(--makay-mauve)' }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
