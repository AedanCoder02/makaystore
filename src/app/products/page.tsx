'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal, X } from 'lucide-react';
import ProductFilters, { Filters } from '@/components/ProductFilters';
import ProductSort, { SortOption } from '@/components/ProductSort';
import ProductGrid from '@/components/ProductGrid';
import { Product } from '@/lib/mockData';
import '@/styles/products.css';

export default function ProductsPage() {
  const t = useTranslations('storefront');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: [],
    priceMin: 0,
    priceMax: 160,
  });
  const [sort, setSort] = useState<SortOption>('popular');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => { setProducts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        p.description.toLowerCase().includes(filters.search.toLowerCase());
      const matchesPrice = p.price >= filters.priceMin && p.price <= filters.priceMax;
      const matchesCategory =
        filters.category.length === 0 || filters.category.includes(p.category);
      return matchesSearch && matchesPrice && matchesCategory;
    });
  }, [filters, products]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sort === 'price-low') copy.sort((a, b) => a.price - b.price);
    else if (sort === 'price-high') copy.sort((a, b) => b.price - a.price);
    else if (sort === 'newest') copy.sort((a, b) => parseInt(b.id) - parseInt(a.id));
    return copy;
  }, [filtered, sort]);

  return (
    <main className="products-page">
      <div className="products-header">
        <h1 className="products-title">{t('collection')}</h1>
        <p className="products-subtitle">
          {t('collectionSubtitle', { count: products.length })}
        </p>
      </div>

      {/* Mobile filter toggle */}
      <div className="products-mobile-toolbar">
        <span className="products-count">
          <strong>{sorted.length}</strong> of {products.length}
        </span>
        <div className="products-mobile-toolbar-right">
          <ProductSort sort={sort} onChange={setSort} />
          <button
            className="products-filter-toggle"
            onClick={() => setFiltersOpen(true)}
          >
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="products-filter-drawer">
          <div className="products-filter-drawer-header">
            <span>Filters</span>
            <button onClick={() => setFiltersOpen(false)} className="products-filter-close">
              <X size={20} />
            </button>
          </div>
          <div className="products-filter-drawer-body">
            <ProductFilters filters={filters} onChange={(f) => { setFilters(f); }} />
          </div>
          <div className="products-filter-drawer-footer">
            <button className="products-filter-apply" onClick={() => setFiltersOpen(false)}>
              Show {sorted.length} results
            </button>
          </div>
        </div>
      )}
      {filtersOpen && <div className="products-filter-backdrop" onClick={() => setFiltersOpen(false)} />}

      <div className="products-container">
        <aside className="products-sidebar">
          <ProductFilters filters={filters} onChange={setFilters} />
        </aside>

        <div className="products-main">
          <div className="products-toolbar products-toolbar-desktop">
            <span className="products-count">
              {loading ? 'Loading…' : <>{t('showing')} <strong>{sorted.length}</strong> {t('of')} {products.length} {t('productsCount')}</>}
            </span>
            <ProductSort sort={sort} onChange={setSort} />
          </div>

          {loading ? (
            <div className="products-loading">Loading products…</div>
          ) : (
            <ProductGrid products={sorted} />
          )}
        </div>
      </div>
    </main>
  );
}
