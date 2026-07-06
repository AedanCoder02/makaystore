'use client';

import { ChangeEvent } from 'react';

export interface Filters {
  search: string;
  category: string[];
  priceMin: number;
  priceMax: number;
}

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const CATEGORIES = ['Shirts', 'Shorts', 'Dresses', 'Accessories'];
const PRICE_MAX = 160;

export default function ProductFilters({ filters, onChange }: Props) {
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value });
  };

  const handlePriceMinChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChange({ ...filters, priceMin: Math.min(val, filters.priceMax - 1) });
  };

  const handlePriceMaxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChange({ ...filters, priceMax: Math.max(val, filters.priceMin + 1) });
  };

  const handleCategoryChange = (category: string) => {
    const updated = filters.category.includes(category)
      ? filters.category.filter((c) => c !== category)
      : [...filters.category, category];
    onChange({ ...filters, category: updated });
  };

  const resetFilters = () => {
    onChange({ search: '', category: [], priceMin: 0, priceMax: PRICE_MAX });
  };

  return (
    <div className="product-filters">
      <div className="filters-header">
        <h3>Filtros</h3>
        <button onClick={resetFilters} className="filters-reset">
          Limpiar
        </button>
      </div>

      {/* Search */}
      <div className="filter-section">
        <label htmlFor="search" className="filter-label">Buscar</label>
        <input
          id="search"
          type="text"
          placeholder="Buscar por nombre..."
          value={filters.search}
          onChange={handleSearchChange}
          className="filter-input"
        />
      </div>

      {/* Price Range */}
      <div className="filter-section">
        <label className="filter-label">Rango de Precio</label>
        <div className="price-range">
          <input
            type="range"
            min="0"
            max={PRICE_MAX}
            step="1"
            value={filters.priceMin}
            onChange={handlePriceMinChange}
            className="price-slider"
            aria-label="Precio mínimo"
          />
          <input
            type="range"
            min="0"
            max={PRICE_MAX}
            step="1"
            value={filters.priceMax}
            onChange={handlePriceMaxChange}
            className="price-slider"
            aria-label="Precio máximo"
          />
        </div>
        <div className="price-display">
          ${filters.priceMin.toFixed(0)} &ndash; ${filters.priceMax.toFixed(0)}
        </div>
      </div>

      {/* Categories */}
      <div className="filter-section">
        <label className="filter-label">Categoría</label>
        <div className="filter-checkboxes">
          {CATEGORIES.map((category) => (
            <label key={category} className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.category.includes(category)}
                onChange={() => handleCategoryChange(category)}
              />
              <span>{category}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
