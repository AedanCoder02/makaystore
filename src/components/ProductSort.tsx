'use client';

import { ChangeEvent } from 'react';

export type SortOption = 'price-low' | 'price-high' | 'newest' | 'popular';

interface Props {
  sort: SortOption;
  onChange: (sort: SortOption) => void;
}

export default function ProductSort({ sort, onChange }: Props) {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as SortOption);
  };

  return (
    <div className="product-sort">
      <label htmlFor="sort" className="sort-label">Ordenar:</label>
      <select id="sort" value={sort} onChange={handleChange} className="sort-select">
        <option value="popular">Más Popular</option>
        <option value="newest">Más Nuevo</option>
        <option value="price-low">Precio: Menor a Mayor</option>
        <option value="price-high">Precio: Mayor a Menor</option>
      </select>
    </div>
  );
}
