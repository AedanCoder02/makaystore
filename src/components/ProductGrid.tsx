'use client';

import { useTranslations } from 'next-intl';
import ProductCard from './ProductCard';
import { Product } from '@/lib/mockData';

interface Props {
  products: Product[];
}

export default function ProductGrid({ products }: Props) {
  const t = useTranslations('storefront');

  if (products.length === 0) {
    return (
      <div className="products-empty">
        <div className="products-empty-icon">🔍</div>
        <p>{t('noProducts')}</p>
        <small>{t('noProductsHint')}</small>
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
