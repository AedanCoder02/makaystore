'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingBag, Check, Tag, Truck, User, HelpCircle } from 'lucide-react';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';

interface Client { id: string; firstName: string; lastName: string; email: string; imageUrl: string; }
interface Product { id: string; title: string; price: number; image: string; category: string; productType: 'storefront' | 'dropshipping'; }
interface CartItem extends Product { qty: number; }

type Step = 'client' | 'products' | 'checkout' | 'done';

export default function SellerSell({ products }: { products: Product[] }) {
  const [step, setStep] = useState<Step>('client');
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
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

  const filteredClients = clients.filter(c =>
    `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(clientSearch.toLowerCase())
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

  const submitOrder = async () => {
    if (!selectedClient || cart.length === 0) return;
    setSubmitting(true);
    const res = await fetch('/api/seller/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: selectedClient.id,
        client_name: `${selectedClient.firstName} ${selectedClient.lastName}`,
        client_email: selectedClient.email,
        items: cart.map(i => ({ id: i.id, title: i.title, price: i.price, qty: i.qty, productType: i.productType })),
        subtotal,
        payment_method: paymentMethod,
        notes,
      }),
    });
    const data = await res.json();
    setOrderId(data.id);
    setSubmitting(false);
    setStep('done');
  };

  const reset = () => {
    setStep('client');
    setSelectedClient(null);
    setCart([]);
    setNotes('');
    setOrderId(null);
    setClientSearch('');
    setProductSearch('');
  };

  // Step indicators
  const STEPS = [
    { key: 'client', label: '1. Select Client' },
    { key: 'products', label: '2. Add Products' },
    { key: 'checkout', label: '3. Checkout' },
  ];

  if (step === 'done') {
    return (
      <div className="seller-page">
        <div className="seller-done">
          <div className="seller-done-icon"><Check size={32} /></div>
          <h2 className="seller-done-title">Sale Complete</h2>
          <p className="seller-done-sub">Order #{orderId} for {selectedClient?.firstName} {selectedClient?.lastName}</p>
          <p className="seller-done-amount">${subtotal.toFixed(2)} · {paymentMethod}</p>
          <div className="seller-done-items">
            {cart.map(i => <span key={i.id} className="seller-done-item">{i.title} × {i.qty}</span>)}
          </div>
          <button className="seller-btn-primary" onClick={reset}>New Sale</button>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-page">
      {tutorialUI}
      <div className="seller-page-header">
        <div>
          <h1 className="seller-page-title">Sell to Client</h1>
          <p className="seller-page-sub">Select a client, build their cart, and process the sale.</p>
        </div>
        {cart.length > 0 && (
          <div className="seller-cart-badge">
            <ShoppingBag size={16} /> {cart.length} item{cart.length > 1 ? 's' : ''} · ${subtotal.toFixed(2)}
          </div>
        )}
        <button className="seller-btn-ghost help-button" onClick={() => tutorialStore.showTutorial('seller-sell-tour')} aria-label="Show tutorial"><HelpCircle size={16} /></button>
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
            <input className="seller-search with-icon" placeholder="Search clients by name or email..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} />
          </div>
          <div className="seller-clients-grid">
            {filteredClients.length === 0 && <p className="seller-empty">No clients found.</p>}
            {filteredClients.map(c => (
              <button key={c.id} className={`seller-client-card${selectedClient?.id === c.id ? ' selected' : ''}`} onClick={() => setSelectedClient(c)}>
                {c.imageUrl ? <img src={c.imageUrl} alt={c.firstName} className="seller-client-avatar" /> : <div className="seller-client-avatar-placeholder"><User size={20} /></div>}
                <div className="seller-client-info">
                  <span className="seller-client-name">{c.firstName} {c.lastName}</span>
                  <span className="seller-client-email">{c.email}</span>
                </div>
                {selectedClient?.id === c.id && <Check size={16} className="seller-client-check" />}
              </button>
            ))}
          </div>
          <div className="seller-step-footer">
            <button className="seller-btn-primary" disabled={!selectedClient} onClick={() => setStep('products')}>
              Continue to Products →
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
                <User size={14} /> Selling to: <strong>{selectedClient?.firstName} {selectedClient?.lastName}</strong>
                <button className="seller-change-btn" onClick={() => setStep('client')}>Change</button>
              </div>
              <div className="seller-search-wrap">
                <Search size={16} className="seller-search-icon" />
                <input className="seller-search with-icon" placeholder="Search products..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
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
              <h3 className="seller-cart-title">Cart</h3>
              {cart.length === 0 ? (
                <p className="seller-empty">Add products from the left.</p>
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
                    <span>Subtotal</span>
                    <strong>${subtotal.toFixed(2)}</strong>
                  </div>
                  <button className="seller-btn-primary full" onClick={() => setStep('checkout')}>
                    Proceed to Checkout →
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
            <div className="seller-checkout-summary">
              <h3 className="seller-section-title">Order Summary</h3>
              <div className="seller-checkout-client">
                <User size={16} />
                <div>
                  <p className="seller-checkout-client-name">{selectedClient?.firstName} {selectedClient?.lastName}</p>
                  <p className="seller-checkout-client-email">{selectedClient?.email}</p>
                </div>
              </div>
              {cart.map(i => (
                <div key={i.id} className="seller-checkout-item">
                  <span>{i.title} × {i.qty}</span>
                  <span>${(i.price * i.qty).toFixed(2)}</span>
                </div>
              ))}
              <div className="seller-checkout-total">
                <strong>Total</strong>
                <strong>${subtotal.toFixed(2)}</strong>
              </div>
            </div>

            <div className="seller-checkout-form">
              <h3 className="seller-section-title">Payment</h3>
              <div className="seller-payment-options">
                {['cash', 'card', 'transfer', 'credit'].map(m => (
                  <button key={m} className={`seller-payment-btn${paymentMethod === m ? ' selected' : ''}`} onClick={() => setPaymentMethod(m)}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
              <label className="seller-label">Notes (optional)</label>
              <textarea className="seller-textarea" placeholder="Add any notes about this sale..." value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
              <div className="seller-checkout-actions">
                <button className="seller-btn-ghost" onClick={() => setStep('products')}>← Back</button>
                <button className="seller-btn-primary" onClick={submitOrder} disabled={submitting}>
                  {submitting ? 'Processing...' : `Complete Sale · $${subtotal.toFixed(2)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
