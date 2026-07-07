'use client';

import { ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';

export type SortOption = 'price-low' | 'price-high' | 'newest' | 'popular';

interface Props {
  sort: SortOption;
  onChange: (sort: SortOption) => void;
}

export default function ProductSort({ sort, onChange }: Props) {
  const t = useTranslations('storefront');

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as SortOption);
  };

  return (
    <div className="product-sort">
      <label htmlFor="sort" className="sort-label">{t('sortBy')}</label>
      <select id="sort" value={sort} onChange={handleChange} className="sort-select">
        <option value="popular">{t('sortOptions.popular')}</option>
        <option value="newest">{t('sortOptions.newest')}</option>
        <option value="price-low">{t('sortOptions.priceAsc')}</option>
        <option value="price-high">{t('sortOptions.priceDesc')}</option>
      </select>
    </div>
  );
}
