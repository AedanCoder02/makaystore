'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Product } from '@/lib/mockData';
import ProductCard from '@/components/ProductCard';

interface Props {
  currentProductId: string;
  category: string;
  titleOverride?: string;
}

export default function RelatedProducts({ currentProductId, category, titleOverride }: Props) {
  const [related, setRelated] = useState<Product[]>([]);
  const t = useTranslations('storefront');

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data: Product[]) => {
        if (!Array.isArray(data)) return;
        setRelated(data.filter((p) => p.category === category && p.id !== currentProductId).slice(0, 4));
      })
      .catch(() => {});
  }, [currentProductId, category]);

  if (related.length === 0) return null;

  return (
    <section className="related-products">
      <h2>{titleOverride || t('relatedProducts')}</h2>
      <div className="related-grid">
        {related.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
