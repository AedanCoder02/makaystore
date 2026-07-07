'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Product } from '@/lib/mockData';

// Emoji map for placeholder visuals
const CATEGORY_EMOJI: Record<string, string> = {
  Shirts: '👕',
  Shorts: '🩳',
  Dresses: '👗',
  Accessories: '🧣',
};

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const [selectedVariant, setSelectedVariant] = useState(0);
  const t = useTranslations('storefront');

  const variant = product.variants[selectedVariant];
  const price = variant?.price ?? product.price;
  const emoji = CATEGORY_EMOJI[product.category] ?? '🛍️';

  return (
    <div className="product-card">
      {/* Image / Placeholder */}
      <Link href={`/products/${product.id}`} className="product-image-link">
        <div className="product-image-placeholder">
          <span className="placeholder-emoji">{emoji}</span>
          <span className="placeholder-label">{product.category}</span>
        </div>
      </Link>

      <div className="product-info">
        <span className="product-category-badge">{product.category}</span>

        <h3 className="product-title">
          <Link href={`/products/${product.id}`}>{product.title}</Link>
        </h3>

        {/* Variant Selector */}
        {product.variants.length > 1 && (
          <div className="product-variants">
            {product.variants.map((v, idx) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariant(idx)}
                className={`variant-btn${selectedVariant === idx ? ' active' : ''}`}
                title={`${v.name} — $${v.price.toFixed(2)}`}
              >
                {v.name}
              </button>
            ))}
          </div>
        )}

        <div className="product-footer">
          <div className="product-price">${price.toFixed(2)}</div>
          <button
            className="product-add-btn"
            aria-label={`${t('add')} ${product.title}`}
          >
            {t('add')}
          </button>
        </div>
      </div>
    </div>
  );
}
