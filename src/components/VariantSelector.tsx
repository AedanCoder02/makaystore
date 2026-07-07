'use client';

import { useTranslations } from 'next-intl';
import { Product } from '@/lib/mockData';
import '@/styles/variant-selector.css';

interface Props {
  variants: Product['variants'];
  selectedVariant: number;
  onChange: (index: number) => void;
  stock: number;
}

export default function VariantSelector({
  variants,
  selectedVariant,
  onChange,
  stock,
}: Props) {
  const t = useTranslations('storefront');

  return (
    <div className="variant-selector">
      <h3>{t('chooseSize')}</h3>
      <div className="variant-buttons">
        {variants.map((variant, index) => (
          <button
            key={variant.id}
            className={`variant-btn${index === selectedVariant ? ' active' : ''}`}
            onClick={() => onChange(index)}
          >
            <span className="variant-name">{variant.name}</span>
            <span className="variant-type">{variant.type}</span>
            <span className="variant-price">${variant.price.toFixed(2)}</span>
          </button>
        ))}
      </div>
      <p className="variant-stock">
        {stock > 0 ? `${t('stock')}: ${stock}` : t('outOfStock')}
      </p>
    </div>
  );
}
