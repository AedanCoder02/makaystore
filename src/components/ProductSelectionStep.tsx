'use client';

import { useEffect, useState } from 'react';

interface Product {
  id: string;
  title: string;
  price: number;
}

export default function ProductSelectionStep({
  onProductSelected,
}: {
  onProductSelected: (productId: string) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    // Mock data (will fetch from Payload in production)
    const mockProducts = [
      { id: '1', title: 'Beach Cover-Up Dress', price: 45 },
      { id: '2', title: 'Linen Shorts', price: 35 },
      { id: '3', title: 'Resort Hat', price: 25 },
    ];
    setProducts(mockProducts);
  }, []);

  return (
    <div className="step-card">
      <h2>Select Product</h2>
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="product-select"
      >
        <option value="">Choose a product...</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title} (${p.price})
          </option>
        ))}
      </select>

      <button
        className="btn btn-primary"
        onClick={() => onProductSelected(selectedId)}
        disabled={!selectedId}
      >
        Next: Upload Image
      </button>
    </div>
  );
}
