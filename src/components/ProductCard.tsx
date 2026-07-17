'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Product } from '@/lib/mockData';
import { useCartStore } from '@/stores/cartStore';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [imgError, setImgError] = useState(false);
  const t = useTranslations('storefront');
  const addToCart = useCartStore((s) => s.addToCart);

  const variant = product.variants[selectedVariant];
  const price = variant?.price ?? product.price;
  const monogram = product.category.charAt(0).toUpperCase();

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    addToCart({
      productId: product.id,
      variantId: variant?.id ?? product.id,
      quantity: 1,
      price,
      title: product.title,
      category: product.category,
    });
  }

  return (
    <div className="product-card">
      <Link href={`/products/${product.id}`} className="product-image-link">
        {product.image && !imgError ? (
          <img
            src={product.image}
            alt={product.title}
            className="product-image"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="product-image-placeholder">
            <span className="placeholder-monogram">{monogram}</span>
            <span className="placeholder-label">{product.category}</span>
          </div>
        )}
      </Link>

      <div className="product-info">
        <span className="product-category-badge">{product.category}</span>

        <h3 className="product-title">
          <Link href={`/products/${product.id}`}>{product.title}</Link>
        </h3>

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
            onClick={handleAdd}
          >
            {t('add')}
          </button>
        </div>
      </div>
    </div>
  );
}
