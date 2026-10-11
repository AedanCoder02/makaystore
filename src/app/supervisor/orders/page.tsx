'use client';

import { useEffect, useState, useCallback } from 'react';
import { ShoppingBag, CreditCard, Smartphone, PocketKnife, Banknote, ExternalLink, ChevronDown, ChevronUp, Gift, ShieldCheck } from 'lucide-react';

interface PaymentEntry {
  method: string;
  amount: number;
  transactionId?: string;
  description?: string;
  receipt_url?: string;
}

interface OrderItem {
  title: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customer_id: string;
  customer_email: string;
  customer_name?: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  items: OrderItem[];
  status: string;
  shipping_method: string;
  payment_id: string;
  payment_methods: PaymentEntry[];
  created_at: string;
  source: 'storefront' | 'in-person';
  is_gift: boolean;
  payment_confirmed?: boolean;
}

const METHOD_LABEL: Record<string, string> = {
  stripe: 'Tarjeta', pago_movil: 'Pago Móvil', punto_venta: 'P.d.V.', cash: 'Efectivo',
};
const METHOD_ICON: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  stripe: CreditCard, pago_movil: Smartphone, punto_venta: PocketKnife, cash: Banknote,
};
const STATUS_COLOR: Record<string, string> = {
  placed: '#f59e0b', confirmed: '#3b82f6', shipped: '#8b5cf6',
  delivered: '#10b981', cancelled: '#ef4444', completed: '#10b981',
};

export default function SupervisorOrdersPage() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filterMethod, setFilterMethod] = useState('');
  const [filterFrom, setFilterFrom]     = useState('');
  const [filterTo, setFilterTo]         = useState('');
  const [filterGift, setFilterGift]     = useState(false);

  const [fetchError, setFetchError]     = useState('');
  const [confirming, setConfirming]     = useState<string | null>(null);
  const [confirmed, setConfirmed]       = useState<Set<string>>(new Set());

  const confirmPayment = async (orderId: string) => {
    setConfirming(orderId);
    try {
      const res = await fetch(`/api/supervisor/orders/${orderId}/confirm`, { method: 'PATCH' });
      if (res.ok) setConfirmed(s => new Set([...s, orderId]));
    } finally {
      setConfirming(null);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    const params = new URLSearchParams();
    if (filterMethod) params.set('method', filterMethod);
    if (filterFrom)   params.set('from', filterFrom);
    if (filterTo)     params.set('to', filterTo);
    if (filterGift)   params.set('gift', 'true');
    try {
      const res = await fetch(`/api/supervisor/orders?${params}`);
      const data = await res.json();
      if (!res.ok) { setFetchError(data?.error ?? `Error ${res.status}`); setOrders([]); }
      else setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setFetchError((e as Error)?.message ?? 'Error de conexión');
      setOrders([]);
    }
    setLoading(false);
  }, [filterMethod, filterFrom, filterTo, filterGift]);

  useEffect(() => { load(); }, [load]);

  const toggle = (id: string) => setExpanded(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  return (
    <div className="sup-page">
      <div className="sup-page-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShoppingBag size={22} className="sup-page-icon" />
          <h1 className="sup-page-title">Órdenes</h1>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
          <select
            className="seller-input"
            style={{ maxWidth: 160, margin: 0 }}
            value={filterMethod}
            onChange={e => setFilterMethod(e.target.value)}
          >
            <option value="">Todos los métodos</option>
            <option value="stripe">Tarjeta</option>
            <option value="pago_movil">Pago Móvil</option>
            <option value="punto_venta">Punto de Venta</option>
            <option value="cash">Efectivo</option>
          </select>
          <input type="date" className="seller-input" style={{ maxWidth: 145, margin: 0 }} value={filterFrom} onChange={e => setFilterFrom(e.target.value)} placeholder="Desde" />
          <input type="date" className="seller-input" style={{ maxWidth: 145, margin: 0 }} value={filterTo} onChange={e => setFilterTo(e.target.value)} placeholder="Hasta" />
          <button
            onClick={() => setFilterGift(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.875rem', borderRadius: 8, border: `1px solid ${filterGift ? '#10b981' : '#e5e7eb'}`, background: filterGift ? '#f0fdf4' : '#fff', color: filterGift ? '#10b981' : 'var(--makay-mauve)', fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <Gift size={14} /> Regalos {filterGift ? '✓' : ''}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="sup-loading">Cargando órdenes…</p>
      ) : fetchError ? (
        <p className="sup-empty-state" style={{ color: '#ef4444' }}>{fetchError}</p>
      ) : orders.length === 0 ? (
        <p className="sup-empty-state">No se encontraron órdenes.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {orders.map(o => {
            const open = expanded.has(o.id);
            const pms: PaymentEntry[] = Array.isArray(o.payment_methods) ? o.payment_methods : [];
            const hasReceipts = pms.some(p => p.receipt_url);

            return (
              <div key={`${o.source}-${o.id}`} style={{ background: '#fff', border: '1px solid #f0ebe4', borderRadius: 14, overflow: 'hidden' }}>
                {/* Row summary */}
                <button
                  onClick={() => toggle(o.id)}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left' }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '0.82rem', color: 'var(--makay-dark-navy)' }}>#{String(o.id).slice(-8).toUpperCase()}</span>
                      <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.1rem 0.5rem', borderRadius: 100, background: `${STATUS_COLOR[o.status] ?? '#9ca3af'}18`, color: STATUS_COLOR[o.status] ?? '#9ca3af' }}>
                        {o.status}
                      </span>
                      <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', color: 'var(--makay-mauve)', background: '#f5f0ea', padding: '0.1rem 0.5rem', borderRadius: 100 }}>
                        {o.source === 'in-person' ? 'Presencial' : 'Online'}
                      </span>
                      {o.is_gift && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', fontWeight: 700, padding: '0.1rem 0.5rem', borderRadius: 100, background: '#f0fdf4', color: '#10b981', border: '1px solid #bbf7d0' }}>
                          <Gift size={10} /> Regalo
                        </span>
                      )}
                    </div>
                    <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: 'var(--makay-mauve)', margin: 0 }}>
                      {o.customer_name || o.customer_email || '—'} · {new Date(o.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Payment method pills */}
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {pms.length > 0 ? pms.map((pm, i) => {
                      const Icon = METHOD_ICON[pm.method] ?? CreditCard;
                      return (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', background: '#f5f0ea', borderRadius: 100, fontFamily: 'var(--font-montserrat)', fontSize: '0.7rem', color: 'var(--makay-dark-navy)' }}>
                          <Icon size={11} /> {METHOD_LABEL[pm.method] ?? pm.method}
                          {pms.length > 1 && <span style={{ color: 'var(--makay-peachy-rose)', fontWeight: 700 }}>${Number(pm.amount).toFixed(2)}</span>}
                        </span>
                      );
                    }) : o.shipping_method && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', background: '#f5f0ea', borderRadius: 100, fontFamily: 'var(--font-montserrat)', fontSize: '0.7rem', color: 'var(--makay-dark-navy)' }}>
                        <CreditCard size={11} /> {METHOD_LABEL[o.shipping_method] ?? o.shipping_method}
                      </span>
                    )}
                  </div>

                  <span style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--makay-peachy-rose)', flexShrink: 0 }}>
                    ${Number(o.total).toFixed(2)}
                  </span>
                  {open ? <ChevronUp size={16} color="var(--makay-mauve)" /> : <ChevronDown size={16} color="var(--makay-mauve)" />}
                </button>

                {/* Expanded detail */}
                {open && (
                  <div style={{ borderTop: '1px solid #f0ebe4', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Items */}
                    {o.items?.length > 0 && (
                      <div>
                        <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--makay-mauve)', margin: '0 0 0.5rem' }}>Productos</p>
                        {o.items.map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: 'var(--makay-dark-navy)', padding: '0.25rem 0', borderBottom: i < o.items.length - 1 ? '1px solid #f5f0ea' : 'none' }}>
                            <span>{item.title} × {item.quantity}</span>
                            <span style={{ fontWeight: 600 }}>${Number((item.price ?? 0) * (item.quantity ?? 1)).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Payment breakdown */}
                    {pms.length > 0 && (
                      <div>
                        <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--makay-mauve)', margin: '0 0 0.5rem' }}>Métodos de pago</p>
                        {pms.map((pm, i) => {
                          const Icon = METHOD_ICON[pm.method] ?? CreditCard;
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0', borderBottom: i < pms.length - 1 ? '1px solid #f5f0ea' : 'none' }}>
                              <Icon size={13} color="var(--makay-mauve)" />
                              <div style={{ flex: 1 }}>
                                <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: 'var(--makay-dark-navy)' }}>{METHOD_LABEL[pm.method] ?? pm.method}</span>
                                {pm.transactionId && (
                                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--makay-mauve)', marginLeft: '0.5rem', background: '#f5f0ea', padding: '0.1rem 0.4rem', borderRadius: 4 }}>#{pm.transactionId}</span>
                                )}
                                {pm.description && (
                                  <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: 'var(--makay-mauve)', margin: '0.15rem 0 0' }}>{pm.description}</p>
                                )}
                              </div>
                              <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--makay-peachy-rose)' }}>${Number(pm.amount).toFixed(2)}</span>
                              {pm.receipt_url && (
                                pm.receipt_url.startsWith('data:') ? (
                                  <a href={pm.receipt_url} target="_blank" rel="noopener noreferrer" title="Ver comprobante">
                                    <img src={pm.receipt_url} alt="Comprobante" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--makay-sand-cream)', cursor: 'pointer', display: 'block' }} />
                                  </a>
                                ) : (
                                  <a href={pm.receipt_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--makay-ocean-teal)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem' }}>
                                    <ExternalLink size={12} /> Comprobante
                                  </a>
                                )
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Totals */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end' }}>
                      {o.shipping_cost > 0 && (
                        <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-mauve)' }}>
                          <span>Envío</span><span>${Number(o.shipping_cost).toFixed(2)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '1rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.88rem', fontWeight: 700, color: 'var(--makay-dark-navy)' }}>
                        <span>Total</span><span style={{ color: 'var(--makay-peachy-rose)' }}>${Number(o.total).toFixed(2)}</span>
                      </div>
                    </div>

                    {pms.some(p => ['pago_movil','punto_venta'].includes(p.method)) && (
                      (confirmed.has(o.id) || o.payment_confirmed) ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
                          <ShieldCheck size={14} color="#10b981" />
                          <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Pago verificado por supervisor</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: '#fff8ee', border: '1px solid #f59e0b30', borderRadius: 8 }}>
                          <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: '#f59e0b', flex: 1 }}>
                            {hasReceipts ? 'Comprobante adjunto — pendiente de verificación.' : 'Sin comprobante — confirmar pago manualmente.'}
                          </span>
                          <button
                            onClick={() => confirmPayment(o.id)}
                            disabled={confirming === o.id}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: 7, fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', fontWeight: 700, cursor: confirming === o.id ? 'wait' : 'pointer', opacity: confirming === o.id ? 0.7 : 1, whiteSpace: 'nowrap' }}
                          >
                            <ShieldCheck size={12} />
                            {confirming === o.id ? 'Confirmando…' : 'Confirmar pago'}
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
