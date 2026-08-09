'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingBag, Check, Tag, Truck, User, HelpCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';

interface Client { id: string; name: string; email: string; imageUrl: string; }
interface Product { id: string; title: string; price: number; image: string; category: string; productType: 'storefront' | 'dropshipping'; }
interface CartItem extends Product { qty: number; }
interface PaymentEntry { method: string; amount: number; transactionId: string; description: string; }

type Step = 'client' | 'products' | 'checkout' | 'done';

const PAYMENT_METHODS = ['cash', 'card', 'transfer', 'credit', 'pago_movil'] as const;
const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia',
  credit: 'Crédito', pago_movil: 'Pago Móvil',
};
const NEEDS_TRANSACTION_ID = new Set(['card', 'transfer', 'pago_movil']);

const EMPTY_PAYMENT: PaymentEntry = { method: 'cash', amount: 0, transactionId: '', description: '' };

export default function SellerSell({ products }: { products: Product[] }) {
  const t = useTranslations('seller');
  const ts = useTranslations('seller.sell');
  const [step, setStep] = useState<Step>('client');
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [draft, setDraft] = useState<PaymentEntry>({ ...EMPTY_PAYMENT });
  const [clientBalance, setClientBalance] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [orderId, setOrderId] = useState<number | null>(null);
  const tutorialStore = useTutorialStore();
  const tutorialUI = useTutorialOverlay('seller-sell-tour');

  useEffect(() => {
    if (!tutorialStore.isCompleted('seller-sell-tour') && !tutorialStore.currentTutorial) {
      tutorialStore.showTutorial('seller-sell-tour');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step === 'client' && clients.length === 0) {
      fetch('/api/seller/clients').then(r => r.json()).then(setClients).catch(() => {});
    }
  }, [step, clients.length]);

  // Fetch client wallet balance when entering checkout
  useEffect(() => {
    if (step === 'checkout' && selectedClient) {
      fetch('/api/seller/client-balance?client_id=' + selectedClient.id)
        .then(r => r.ok ? r.json() : null)
        .then(d => setClientBalance(d?.dollar_balance ?? null))
        .catch(() => {});
    }
  }, [step, selectedClient]);

  const filteredClients = clients.filter(c =>
    `${c.name} ${c.email}`.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(productSearch.toLowerCase()) || p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  const addToCart = (p: Product) => {
    setCart(c => {
      const existing = c.find(i => i.id === p.id);
      if (existing) return c.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...c, { ...p, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(c => c.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const removeItem = (id: string) => setCart(c => c.filter(i => i.id !== id));

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  // Payment helpers
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, subtotal - totalPaid);
  const needsId = NEEDS_TRANSACTION_ID.has(draft.method);

  const canAddDraft =
    draft.amount > 0 &&
    totalPaid + draft.amount <= subtotal + 0.001 &&
    (!needsId || draft.transactionId.trim().length >= 4);

  const addPayment = () => {
    if (!canAddDraft) return;
    setPayments(p => [...p, { ...draft }]);
    // Reset draft, pre-fill remaining amount
    const newRemaining = remaining - draft.amount;
    setDraft({ ...EMPTY_PAYMENT, amount: Math.max(0, newRemaining) });
  };

  const removePayment = (idx: number) => {
    setPayments(p => {
      const next = p.filter((_, i) => i !== idx);
      const newTotal = next.reduce((s, x) => s + x.amount, 0);
      setDraft(d => ({ ...d, amount: Math.max(0, subtotal - newTotal) }));
      return next;
    });
  };

  // Auto-fill draft amount with remaining when method changes
  const setDraftMethod = (method: string) => {
    setDraft(d => ({ ...d, method, amount: d.amount === 0 ? remaining : d.amount }));
  };

  const canSubmit =
    payments.length > 0 &&
    Math.abs(totalPaid - subtotal) < 0.01;

  const submitOrder = async () => {
    if (!selectedClient || cart.length === 0 || !canSubmit) return;
    setSubmitting(true);
    setSubmitError('');
    const res = await fetch('/api/seller/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: selectedClient.id,
        client_name: selectedClient.name,
        client_email: selectedClient.email,
        items: cart.map(i => ({ id: i.id, title: i.title, price: i.price, qty: i.qty, productType: i.productType })),
        subtotal,
        payment_methods: payments,
        notes,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setSubmitError(data.error ?? 'Error al procesar el pago');
      setSubmitting(false);
      return;
    }
    setOrderId(data.id);
    setSubmitting(false);
    setStep('done');
  };

  const reset = () => {
    setStep('client');
    setSelectedClient(null);
    setCart([]);
    setPayments([]);
    setDraft({ ...EMPTY_PAYMENT });
    setNotes('');
    setOrderId(null);
    setClientSearch('');
    setProductSearch('');
    setClientBalance(null);
    setSubmitError('');
  };

  // Step indicators
  const STEPS = [
    { key: 'client',   label: ts('step1') },
    { key: 'products', label: ts('step2') },
    { key: 'checkout', label: ts('step3') },
  ];

  if (step === 'done') {
    return (
      <div className="seller-page">
        <div className="seller-done">
          <div className="seller-done-icon"><Check size={32} /></div>
          <h2 className="seller-done-title">{ts('saleComplete')}</h2>
          <p className="seller-done-sub">{ts('orderFor', { id: String(orderId ?? ''), name: selectedClient?.name ?? '' })}</p>
          <p className="seller-done-amount">${subtotal.toFixed(2)}</p>
          <div className="seller-done-items" style={{ flexDirection: 'column', gap: '0.3rem', alignItems: 'center' }}>
            {payments.map((p, i) => (
              <span key={i} className="seller-done-item">
                {PAYMENT_LABELS[p.method] ?? p.method} · ${p.amount.toFixed(2)}
                {p.transactionId && ` · ID: ${p.transactionId}`}
              </span>
            ))}
          </div>
          <div className="seller-done-items">
            {cart.map(i => <span key={i.id} className="seller-done-item">{i.title} × {i.qty}</span>)}
          </div>
          <button className="seller-btn-primary" onClick={reset}>{ts('newSale')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-page">
      {tutorialUI}
      <div className="seller-page-header">
        <div>
          <h1 className="seller-page-title">{ts('title')}</h1>
          <p className="seller-page-sub">{ts('subtitle')}</p>
        </div>
        {cart.length > 0 && (
          <div className="seller-cart-badge">
            <ShoppingBag size={16} /> {cart.length} {t('items')} · ${subtotal.toFixed(2)}
          </div>
        )}
        <button className="seller-btn-ghost help-button" onClick={() => tutorialStore.showTutorial('seller-sell-tour')} aria-label={t('showTutorial')}><HelpCircle size={16} /></button>
      </div>

      {/* Step nav */}
      <div className="seller-steps">
        {STEPS.map(s => (
          <div key={s.key} className={`seller-step${step === s.key ? ' active' : ''}${(step === 'products' && s.key === 'client') || (step === 'checkout' && s.key !== 'checkout') ? ' done' : ''}`}>
            {s.label}
          </div>
        ))}
      </div>

      {/* STEP 1: Client selection */}
      {step === 'client' && (
        <div className="seller-step-content">
          <div className="seller-search-wrap">
            <Search size={16} className="seller-search-icon" />
            <input className="seller-search with-icon" placeholder={ts('searchClients')} value={clientSearch} onChange={e => setClientSearch(e.target.value)} />
          </div>
          <div className="seller-clients-grid">
            {filteredClients.length === 0 && <p className="seller-empty">{ts('noClients')}</p>}
            {filteredClients.map(c => (
              <button key={c.id} className={`seller-client-card${selectedClient?.id === c.id ? ' selected' : ''}`} onClick={() => setSelectedClient(c)}>
                {c.imageUrl ? <img src={c.imageUrl} alt={c.name} className="seller-client-avatar" /> : <div className="seller-client-avatar-placeholder"><User size={20} /></div>}
                <div className="seller-client-info">
                  <span className="seller-client-name">{c.name}</span>
                  <span className="seller-client-email">{c.email}</span>
                </div>
                {selectedClient?.id === c.id && <Check size={16} className="seller-client-check" />}
              </button>
            ))}
          </div>
          <div className="seller-step-footer">
            <button className="seller-btn-primary" disabled={!selectedClient} onClick={() => setStep('products')}>
              {ts('continueToProducts')}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Products */}
      {step === 'products' && (
        <div className="seller-step-content">
          <div className="seller-sell-layout">
            <div className="seller-product-panel">
              <div className="seller-selected-client-bar">
                <User size={14} /> {ts('sellingTo')} <strong>{selectedClient?.name}</strong>
                <button className="seller-change-btn" onClick={() => setStep('client')}>{ts('change')}</button>
              </div>
              <div className="seller-search-wrap">
                <Search size={16} className="seller-search-icon" />
                <input className="seller-search with-icon" placeholder={ts('searchProducts')} value={productSearch} onChange={e => setProductSearch(e.target.value)} />
              </div>
              <div className="seller-sell-products">
                {filteredProducts.map(p => {
                  const inCart = cart.find(i => i.id === p.id);
                  return (
                    <div key={p.id} className={`seller-sell-product${inCart ? ' in-cart' : ''}`}>
                      <img src={p.image} alt={p.title} className="seller-sell-img" onError={e => { (e.target as HTMLImageElement).src = '/images/product-tshirt.jpg'; }} />
                      <div className="seller-sell-product-info">
                        <span className="seller-sell-title">{p.title}</span>
                        <div className="seller-sell-meta">
                          <span className="seller-sell-price">${p.price.toFixed(2)}</span>
                          <span className={`seller-type-badge ${p.productType}`}>
                            {p.productType === 'dropshipping' ? <Truck size={10} /> : <Tag size={10} />}
                            {p.productType}
                          </span>
                        </div>
                      </div>
                      <button className="seller-add-btn" onClick={() => addToCart(p)}>
                        <Plus size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="seller-cart-panel">
              <h3 className="seller-cart-title">{ts('cartTitle')}</h3>
              {cart.length === 0 ? (
                <p className="seller-empty">{ts('cartEmpty')}</p>
              ) : (
                <>
                  <div className="seller-cart-items">
                    {cart.map(i => (
                      <div key={i.id} className="seller-cart-item">
                        <span className="seller-cart-item-name">{i.title}</span>
                        <div className="seller-cart-item-controls">
                          <button className="seller-qty-btn sm" onClick={() => updateQty(i.id, -1)}><Minus size={12} /></button>
                          <span className="seller-cart-qty">{i.qty}</span>
                          <button className="seller-qty-btn sm" onClick={() => updateQty(i.id, 1)}><Plus size={12} /></button>
                          <button className="seller-qty-btn sm danger" onClick={() => removeItem(i.id)}><Trash2 size={12} /></button>
                        </div>
                        <span className="seller-cart-item-total">${(i.price * i.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="seller-cart-subtotal">
                    <span>{ts('subtotal')}</span>
                    <strong>${subtotal.toFixed(2)}</strong>
                  </div>
                  <button className="seller-btn-primary full" onClick={() => setStep('checkout')}>
                    {ts('proceedToCheckout')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Checkout */}
      {step === 'checkout' && (
        <div className="seller-step-content">
          <div className="seller-checkout-layout">

            {/* ── Order summary ── */}
            <div className="seller-checkout-summary">
              <h3 className="seller-section-title">{ts('orderSummary')}</h3>
              <div className="seller-checkout-client">
                <User size={16} />
                <div>
                  <p className="seller-checkout-client-name">{selectedClient?.name}</p>
                  <p className="seller-checkout-client-email">{selectedClient?.email}</p>
                  {clientBalance !== null && (
                    <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: '#059669', margin: '0.25rem 0 0', fontWeight: 600 }}>
                      Saldo Makay: ${clientBalance.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
              {cart.map(i => (
                <div key={i.id} className="seller-checkout-item">
                  <span>{i.title} × {i.qty}</span>
                  <span>${(i.price * i.qty).toFixed(2)}</span>
                </div>
              ))}
              <div className="seller-checkout-total">
                <strong>{ts('subtotal')}</strong>
                <strong>${subtotal.toFixed(2)}</strong>
              </div>

              {/* Payments already added */}
              {payments.length > 0 && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {payments.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--makay-sand-cream)', borderRadius: 8 }}>
                      <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.8rem', fontWeight: 600, flex: 1, color: 'var(--makay-dark-navy)' }}>
                        {PAYMENT_LABELS[p.method]} · ${p.amount.toFixed(2)}
                        {p.transactionId && <span style={{ color: 'var(--makay-mauve)', fontWeight: 400 }}> · #{p.transactionId}</span>}
                      </span>
                      <button onClick={() => removePayment(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.2rem', display: 'flex' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', paddingTop: '0.5rem', borderTop: '1px solid var(--makay-sand-cream)' }}>
                    <span style={{ color: 'var(--makay-mauve)' }}>Pagado</span>
                    <strong style={{ color: totalPaid >= subtotal - 0.001 ? '#059669' : 'var(--makay-dark-navy)' }}>${totalPaid.toFixed(2)}</strong>
                  </div>
                  {remaining > 0.001 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem' }}>
                      <span style={{ color: '#dc2626' }}>Pendiente</span>
                      <strong style={{ color: '#dc2626' }}>${remaining.toFixed(2)}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Payment form ── */}
            <div className="seller-checkout-form">
              <h3 className="seller-section-title">Agregar Pago</h3>

              {/* Method selector */}
              <label className="seller-label" style={{ marginBottom: '0.5rem' }}>Método</label>
              <div className="seller-payment-options" style={{ marginBottom: '0.875rem' }}>
                {Object.entries(PAYMENT_LABELS).map(([m, label]) => (
                  <button
                    key={m}
                    className={`seller-payment-btn${draft.method === m ? ' selected' : ''}`}
                    onClick={() => setDraftMethod(m)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Amount */}
              <label className="seller-label">Monto ($)</label>
              <input
                type="number"
                className="seller-input"
                style={{ marginBottom: '0.75rem' }}
                min={0.01}
                step={0.01}
                max={remaining}
                value={draft.amount || ''}
                placeholder={`Máx. $${remaining.toFixed(2)}`}
                onChange={e => setDraft(d => ({ ...d, amount: parseFloat(e.target.value) || 0 }))}
              />

              {/* Transaction ID — required for non-cash */}
              {needsId && (
                <>
                  <label className="seller-label">
                    ID de Transacción <span style={{ color: '#ef4444' }}>*</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--makay-mauve)', fontWeight: 400, marginLeft: '0.35rem' }}>mín. 4 caracteres</span>
                  </label>
                  <input
                    type="text"
                    className="seller-input"
                    style={{ marginBottom: '0.75rem', letterSpacing: '0.05em' }}
                    placeholder="Ej. 4821 o TXN-2048"
                    value={draft.transactionId}
                    onChange={e => setDraft(d => ({ ...d, transactionId: e.target.value }))}
                  />
                </>
              )}

              {/* Credit warning */}
              {draft.method === 'credit' && clientBalance !== null && (
                <div style={{ padding: '0.5rem 0.75rem', background: draft.amount > clientBalance ? '#fef2f2' : '#f0fdf4', border: `1px solid ${draft.amount > clientBalance ? '#fecaca' : '#bbf7d0'}`, borderRadius: 8, marginBottom: '0.75rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: draft.amount > clientBalance ? '#dc2626' : '#059669' }}>
                  {draft.amount > clientBalance
                    ? `Saldo insuficiente. Disponible: $${clientBalance.toFixed(2)}`
                    : `Saldo disponible: $${clientBalance.toFixed(2)}`}
                </div>
              )}

              {/* Description */}
              <label className="seller-label">Descripción (opcional)</label>
              <textarea
                className="seller-textarea sm"
                style={{ marginBottom: '0.875rem' }}
                placeholder="Detalles adicionales del pago..."
                rows={2}
                value={draft.description}
                onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
              />

              <button
                className="seller-btn-primary full"
                style={{ marginBottom: '1.25rem' }}
                disabled={!canAddDraft || (draft.method === 'credit' && clientBalance !== null && draft.amount > clientBalance)}
                onClick={addPayment}
              >
                + Agregar Pago
              </button>

              {/* Global notes */}
              <label className="seller-label">{ts('notesLabel')}</label>
              <textarea
                className="seller-textarea"
                placeholder={ts('notesPlaceholder')}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                style={{ marginBottom: '1rem' }}
              />

              {submitError && (
                <div style={{ padding: '0.625rem 0.875rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: '#dc2626', marginBottom: '0.875rem' }}>
                  {submitError}
                </div>
              )}

              <div className="seller-checkout-actions">
                <button className="seller-btn-ghost" onClick={() => setStep('products')}>{ts('back')}</button>
                <button
                  className="seller-btn-primary"
                  onClick={submitOrder}
                  disabled={submitting || !canSubmit}
                  title={!canSubmit ? `Faltan $${remaining.toFixed(2)} por asignar` : undefined}
                >
                  {submitting ? ts('processing') : `${ts('completeSale')} · $${subtotal.toFixed(2)}`}
                </button>
              </div>
              {!canSubmit && payments.length > 0 && (
                <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: '#dc2626', textAlign: 'right', margin: '0.4rem 0 0' }}>
                  Faltan ${remaining.toFixed(2)} por cubrir
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
