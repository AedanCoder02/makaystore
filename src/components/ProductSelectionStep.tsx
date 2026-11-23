'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
}

export default function ProductSelectionStep({
  onProductSelected,
}: {
  onProductSelected: (productId: string) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const selected = products.find((p) => p.id === selectedId);
  const q = search.trim().toLowerCase();
  const matches = q
    ? products.filter(p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 24)
    : [];

  return (
    <div className="wizard-step-card">
      <div className="wizard-step-header">
        <div className="wizard-step-icon">🛍️</div>
        <div>
          <h2 className="wizard-step-title">Select a Product</h2>
          <p className="wizard-step-desc">Choose the product you want to generate a 3D model for</p>
        </div>
      </div>

      <div className="seller-search-wrap" style={{ marginBottom: '1.25rem' }}>
        <Search size={16} className="seller-search-icon" />
        <input
          className="seller-search with-icon"
          placeholder="Buscar producto por nombre o categoría…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {loading ? (
        <div className="wizard-loading">Loading products…</div>
      ) : !q ? (
        <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.85rem', color: 'var(--makay-mauve)', textAlign: 'center', padding: '2rem 0' }}>
          Escribe para buscar entre {products.length} productos.
        </p>
      ) : matches.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.85rem', color: 'var(--makay-mauve)', textAlign: 'center', padding: '2rem 0' }}>
          Sin resultados para &ldquo;{search}&rdquo;.
        </p>
      ) : (
        <div className="product-selection-grid">
          {matches.map((p) => (
            <button
              key={p.id}
              className={`product-select-card${selectedId === p.id ? ' selected' : ''}`}
              onClick={() => setSelectedId(p.id)}
            >
              <div className="psc-image-wrap">
                {p.image ? (
                  <img src={p.image} alt={p.title} className="psc-image" />
                ) : (
                  <div className="psc-placeholder">{p.category.charAt(0)}</div>
                )}
                {selectedId === p.id && <div className="psc-check">✓</div>}
              </div>
              <div className="psc-info">
                <span className="psc-category">{p.category}</span>
                <span className="psc-title">{p.title}</span>
                <span className="psc-price">${p.price.toFixed(2)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="wizard-selection-summary">
          <span>Selected: <strong>{selected.title}</strong></span>
        </div>
      )}

      <div className="wizard-step-actions">
        <button
          className="wizard-btn-primary"
          onClick={() => onProductSelected(selectedId)}
          disabled={!selectedId}
        >
          Next: Upload Image →
        </button>
      </div>
    </div>
  );
}
