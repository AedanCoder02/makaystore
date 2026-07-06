'use client';

import { mockProducts } from '@/lib/mockData';
import ProductCard from '@/components/ProductCard';

interface Props {
  currentProductId: string;
  category: string;
}

export default function RelatedProducts({ currentProductId, category }: Props) {
  const related = mockProducts
    .filter((p) => p.category === category && p.id !== currentProductId)
    .slice(0, 4);

  if (related.length === 0) {
    return null;
  }

  return (
    <section className="related-products">
      <h2>Productos Relacionados</h2>
      <div className="related-grid">
        {related.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
