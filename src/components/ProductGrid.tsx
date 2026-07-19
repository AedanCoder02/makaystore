'use client';

import { useTranslations } from 'next-intl';
import ProductCard from './ProductCard';
import { Product } from '@/lib/mockData';

interface Props {
  products: Product[];
  emptyText?: string;
}

export default function ProductGrid({ products, emptyText }: Props) {
  const t = useTranslations('storefront');

  if (products.length === 0) {
    return (
      <div className="products-empty">
        <div className="products-empty-icon">🔍</div>
        <p>{emptyText || t('noProducts')}</p>
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
