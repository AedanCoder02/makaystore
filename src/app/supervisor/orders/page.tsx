'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';

interface Order {
  id: number;
  customer_name: string;
  status: string;
  subtotal: number;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function SupervisorOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending'>('pending');

  useEffect(() => {
    fetch('/api/seller/orders')
      .then((r) => r.ok ? r.json() : [])
      .then((data: Order[]) => { setOrders(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const visible = filter === 'pending'
    ? orders.filter((o) => o.status === 'placed' || o.status === 'confirmed')
    : orders;

  return (
    <div className="sup-page">
      <div className="sup-page-header">
        <ShoppingBag size={22} className="sup-page-icon" />
        <h1 className="sup-page-title">Orders</h1>
        <div className="sup-filter-tabs">
          <button className={`sup-filter-tab${filter === 'pending' ? ' active' : ''}`} onClick={() => setFilter('pending')}>Pending</button>
          <button className={`sup-filter-tab${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>All</button>
        </div>
      </div>

      {loading ? (
        <p className="sup-loading">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="sup-empty-state">{filter === 'pending' ? 'No pending orders.' : 'No orders yet.'}</p>
      ) : (
        <div className="sup-table-wrap">
          <table className="sup-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => (
                <tr key={o.id}>
                  <td className="sup-td-muted">#{o.id}</td>
                  <td>{o.customer_name || '—'}</td>
                  <td>
                    <span className={`sup-order-status sup-order-status--${o.status}`}>
                      {STATUS_LABELS[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="sup-td-amount">${Number(o.subtotal).toFixed(2)}</td>
                  <td className="sup-td-muted">
                    {new Date(o.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
