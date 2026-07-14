'use client';

import { useState } from 'react';
import { Plus, Minus, Check } from 'lucide-react';

interface StockRow { id: string; title: string; sku: string; category: string; defaultStock: number; currentStock: number; }

export default function SellerStock({ products }: { products: StockRow[] }) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(products.map(p => [p.id, p.currentStock]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const adjust = (id: string, delta: number) => {
    setQuantities(q => ({ ...q, [id]: Math.max(0, (q[id] ?? 0) + delta) }));
  };

  const save = async (id: string) => {
    setSaving(id);
    await fetch('/api/seller/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: id, quantity: quantities[id] }),
    });
    setSaving(null);
    setSaved(s => ({ ...s, [id]: true }));
    setTimeout(() => setSaved(s => ({ ...s, [id]: false })), 2000);
  };

  const lowStock = products.filter(p => (quantities[p.id] ?? p.currentStock) < 10);

  return (
    <div className="seller-page">
      <div className="seller-page-header">
        <div>
          <h1 className="seller-page-title">Stock Management</h1>
          <p className="seller-page-sub">Adjust quantities per product. Changes are saved to the database.</p>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="seller-alert">
          <strong>{lowStock.length} product{lowStock.length > 1 ? 's' : ''} low on stock</strong>
          {' — '}{lowStock.map(p => p.title).join(', ')}
        </div>
      )}

      <div className="seller-stock-list">
        {products.map(p => {
          const qty = quantities[p.id] ?? p.currentStock;
          const isLow = qty < 10;
          return (
            <div key={p.id} className="seller-stock-row">
              <div className="seller-stock-info">
                <span className="seller-stock-title">{p.title}</span>
                <span className="seller-stock-sku">{p.sku} · {p.category}</span>
              </div>
              <div className="seller-stock-controls">
                <button className="seller-qty-btn" onClick={() => adjust(p.id, -5)}>-5</button>
                <button className="seller-qty-btn" onClick={() => adjust(p.id, -1)}><Minus size={14} /></button>
                <input
                  className={`seller-qty-input${isLow ? ' low' : ''}`}
                  type="number"
                  value={qty}
                  min={0}
                  onChange={e => setQuantities(q => ({ ...q, [p.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                />
                <button className="seller-qty-btn" onClick={() => adjust(p.id, 1)}><Plus size={14} /></button>
                <button className="seller-qty-btn" onClick={() => adjust(p.id, 5)}>+5</button>
              </div>
              <button
                className={`seller-stock-save${saved[p.id] ? ' saved' : ''}`}
                onClick={() => save(p.id)}
                disabled={saving === p.id}
              >
                {saved[p.id] ? <><Check size={14} /> Saved</> : saving === p.id ? 'Saving...' : 'Save'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
