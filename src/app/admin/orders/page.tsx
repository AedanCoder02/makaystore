'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import AdminSidebar from '@/components/AdminSidebar';

interface Order {
  id: number;
  seller_id: string;
  seller_name: string;
  client_name: string;
  subtotal: string;
  items: any[];
  payment_method: string;
  created_at: string;
}

export default function AdminOrdersPage() {
  const t = useTranslations('admin');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeller, setFilterSeller] = useState('');

  useEffect(() => {
    fetch('/api/admin/orders')
      .then((r) => r.json())
      .then((data) => { setOrders(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const sellers = [...new Map(orders.map((o) => [o.seller_id, o.seller_name])).entries()];
  const filtered = filterSeller ? orders.filter((o) => o.seller_id === filterSeller) : orders;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="dashboard-header">
          <h1>{t('allOrders')}</h1>
        </div>

        <div className="admin-filter-row">
          <select
            className="admin-select"
            value={filterSeller}
            onChange={(e) => setFilterSeller(e.target.value)}
          >
            <option value="">{t('allSellers')}</option>
            {sellers.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <span className="admin-count">{filtered.length} orders</span>
        </div>

        {loading ? (
          <p className="admin-loading">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="admin-empty">No orders found.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('orderNumber')}</th>
                  <th>{t('seller')}</th>
                  <th>{t('client')}</th>
                  <th>{t('total')}</th>
                  <th>{t('items')}</th>
                  <th>{t('paymentMethod')}</th>
                  <th>{t('date')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id}>
                    <td className="admin-order-id">#{order.id}</td>
                    <td>{order.seller_name}</td>
                    <td>{order.client_name || '—'}</td>
                    <td className="admin-amount">${Number(order.subtotal).toFixed(2)}</td>
                    <td>{Array.isArray(order.items) ? order.items.length : '—'}</td>
                    <td className="admin-payment-badge">{order.payment_method || '—'}</td>
                    <td className="admin-date">{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
