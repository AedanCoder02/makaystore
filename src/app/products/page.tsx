'use client';

import { useState, useMemo } from 'react';
import ProductFilters, { Filters } from '@/components/ProductFilters';
import ProductSort, { SortOption } from '@/components/ProductSort';
import ProductGrid from '@/components/ProductGrid';
import { mockProducts } from '@/lib/mockData';
import '@/styles/products.css';

export default function ProductsPage() {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: [],
    priceMin: 0,
    priceMax: 160,
  });
  const [sort, setSort] = useState<SortOption>('popular');

  // Filter products
  const filtered = useMemo(() => {
    return mockProducts.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        p.description.toLowerCase().includes(filters.search.toLowerCase());
      const matchesPrice = p.price >= filters.priceMin && p.price <= filters.priceMax;
      const matchesCategory =
        filters.category.length === 0 || filters.category.includes(p.category);
      return matchesSearch && matchesPrice && matchesCategory;
    });
  }, [filters]);

  // Sort products
  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sort === 'price-low') {
      copy.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
      copy.sort((a, b) => b.price - a.price);
    } else if (sort === 'newest') {
      copy.sort((a, b) => parseInt(b.id) - parseInt(a.id));
    }
    // 'popular' keeps original order (mockProducts order)
    return copy;
  }, [filtered, sort]);

  return (
    <main className="products-page">
      <div className="products-header">
        <h1 className="products-title">Nuestra Colección</h1>
        <p className="products-subtitle">
          {mockProducts.length} piezas cuidadosamente seleccionadas para ti
        </p>
      </div>

      <div className="products-container">
        <aside className="products-sidebar">
          <ProductFilters filters={filters} onChange={setFilters} />
        </aside>

        <div className="products-main">
          <div className="products-toolbar">
            <span className="products-count">
              Mostrando <strong>{sorted.length}</strong> de {mockProducts.length} productos
            </span>
            <ProductSort sort={sort} onChange={setSort} />
          </div>

          <ProductGrid products={sorted} />
        </div>
      </div>
    </main>
  );
}
