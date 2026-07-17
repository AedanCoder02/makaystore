'use client';

import { useEffect, useState } from 'react';

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

  return (
    <div className="wizard-step-card">
      <div className="wizard-step-header">
        <div className="wizard-step-icon">🛍️</div>
        <div>
          <h2 className="wizard-step-title">Select a Product</h2>
          <p className="wizard-step-desc">Choose the product you want to generate a 3D model for</p>
        </div>
      </div>

      {loading ? (
        <div className="wizard-loading">Loading products…</div>
      ) : (
        <div className="product-selection-grid">
          {products.map((p) => (
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
