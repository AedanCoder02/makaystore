'use client';

import { useTranslations } from 'next-intl';
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
  const t = useTranslations('storefront');

  if (related.length === 0) {
    return null;
  }

  return (
    <section className="related-products">
      <h2>{t('relatedProducts')}</h2>
      <div className="related-grid">
        {related.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
