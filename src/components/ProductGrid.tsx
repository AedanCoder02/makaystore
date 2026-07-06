'use client';

import ProductCard from './ProductCard';
import { Product } from '@/lib/mockData';

interface Props {
  products: Product[];
}

export default function ProductGrid({ products }: Props) {
  if (products.length === 0) {
    return (
      <div className="products-empty">
        <div className="products-empty-icon">🔍</div>
        <p>No se encontraron productos.</p>
        <small>Intenta ajustar tus filtros o limpiar la búsqueda.</small>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
