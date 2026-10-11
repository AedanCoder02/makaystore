'use client';

import { useState, useEffect } from 'react';
import { Plus, Minus, Check, HelpCircle, Search, ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';

interface StockRow { id: string; title: string; sku: string; category: string; defaultStock: number; currentStock: number; }
type SortField = 'title' | 'sku' | 'category' | 'stock';

export default function SellerStock({ products }: { products: StockRow[] }) {
  const t = useTranslations('seller.stock');
  const ts = useTranslations('seller');
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(products.map(p => [p.id, p.currentStock]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('stock');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const tutorialStore = useTutorialStore();
  const tutorialUI = useTutorialOverlay('seller-stock-tour');

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };
  const SortIcon = ({ field }: { field: SortField }) =>
    sortField !== field ? null : (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />);

  useEffect(() => {
    if (!tutorialStore.isCompleted('seller-stock-tour') && !tutorialStore.currentTutorial) {
      tutorialStore.showTutorial('seller-stock-tour');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adjust = (id: string, delta: number) => {
    setQuantities(q => ({ ...q, [id]: Math.max(0, (q[id] ?? 0) + delta) }));
  };

  const save = async (id: string) => {
    setSaving(id);
    await fetch('/api/seller/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: id, quantity: quantities[id] }),
    });
    setSaving(null);
    setSaved(s => ({ ...s, [id]: true }));
    setTimeout(() => setSaved(s => ({ ...s, [id]: false })), 2000);
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return !q || p.title.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q) || (p.category ?? '').toLowerCase().includes(q);
  });
  const lowStock = products.filter(p => (quantities[p.id] ?? p.currentStock) < 10);

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'stock') cmp = (quantities[a.id] ?? a.currentStock) - (quantities[b.id] ?? b.currentStock);
    else if (sortField === 'title') cmp = a.title.localeCompare(b.title);
    else if (sortField === 'sku') cmp = (a.sku ?? '').localeCompare(b.sku ?? '');
    else cmp = (a.category ?? '').localeCompare(b.category ?? '');
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return (
    <div className="seller-page">
      {tutorialUI}
      <div className="seller-page-header">
        <div>
          <h1 className="seller-page-title">{t('title')}</h1>
          <p className="seller-page-sub">{t('subtitle')}</p>
        </div>
        <button className="seller-btn-ghost help-button" onClick={() => tutorialStore.showTutorial('seller-stock-tour')} aria-label={ts('showTutorial')}><HelpCircle size={16} /></button>
      </div>

      <div className="seller-search-wrap" style={{ marginBottom: '1rem' }}>
        <Search size={16} className="seller-search-icon" />
        <input
          className="seller-search with-icon"
          placeholder="Buscar por nombre, SKU o categoría…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {lowStock.length > 0 && (() => {
        const sortedLow = lowStock
          .slice()
          .sort((a, b) => (quantities[a.id] ?? a.currentStock) - (quantities[b.id] ?? b.currentStock));
        const topLow = sortedLow.slice(0, 8);
        const remaining = sortedLow.length - topLow.length;
        return (
        <div className="seller-widget" style={{ marginBottom: '1.5rem', borderColor: 'rgba(220,38,38,0.25)' }}>
          <h2 className="seller-widget-title">
            <AlertTriangle size={18} style={{ color: '#c0392b' }} />
            {t('lowStockAlert', { count: lowStock.length })}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '0.5rem' }}>
            {topLow.map(p => {
                const qty = quantities[p.id] ?? p.currentStock;
                return (
                  <div key={p.id} className="seller-lowstock-row" style={{ borderBottom: 'none', background: '#fff', border: '1px solid var(--makay-sand-cream)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                    <span className="seller-lowstock-name">{p.title}</span>
                    <span className={`seller-lowstock-qty ${qty < 5 ? 'critical' : 'low'}`}>{qty} uds.</span>
                  </div>
                );
              })}
          </div>
          {remaining > 0 && (
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-mauve)', margin: '0.75rem 0 0' }}>
              +{remaining} producto{remaining !== 1 ? 's' : ''} más con stock bajo — ordena la tabla de abajo por Stock para verlos todos.
            </p>
          )}
        </div>
        );
      })()}

      <div className="sp-sort-toolbar">
        <span className="sp-sort-label">Ordenar por:</span>
        {(['title', 'sku', 'category', 'stock'] as SortField[]).map(f => (
          <button key={f} className={`sp-sort-btn${sortField === f ? ' active' : ''}`} onClick={() => toggleSort(f)}>
            {f === 'title' ? 'Producto' : f === 'sku' ? 'SKU' : f === 'category' ? 'Categoría' : 'Stock'} <SortIcon field={f} />
          </button>
        ))}
      </div>

      <div className="seller-stock-list">
        {sorted.length === 0 && <p className="seller-empty">No se encontraron productos.</p>}
        {sorted.map(p => {
          const qty = quantities[p.id] ?? p.currentStock;
          const isLow = qty < 10;
          const isCritical = qty < 5;
          const isAbundant = qty > 20;
          const rowClass = isCritical ? ' stock-critical' : isAbundant ? ' stock-ok' : '';
          return (
            <div key={p.id} className={`seller-stock-row${rowClass}`}>
              <div className="seller-stock-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="seller-stock-title">{p.title}</span>
                  {isCritical && <span className="seller-stock-badge critical">{t('badgeLow')}</span>}
                  {isAbundant && <span className="seller-stock-badge ok">{t('badgeInStock')}</span>}
                </div>
                <span className="seller-stock-sku">{p.sku} · {p.category}</span>
              </div>
              <div className="seller-stock-controls">
                <button className="seller-qty-btn" onClick={() => adjust(p.id, -5)}>-5</button>
                <button className="seller-qty-btn" onClick={() => adjust(p.id, -1)}><Minus size={14} /></button>
                <input
                  className={`seller-qty-input${isLow ? ' low' : ''}`}
                  type="number"
                  value={qty}
                  min={0}
                  onChange={e => setQuantities(q => ({ ...q, [p.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                />
                <button className="seller-qty-btn" onClick={() => adjust(p.id, 1)}><Plus size={14} /></button>
                <button className="seller-qty-btn" onClick={() => adjust(p.id, 5)}>+5</button>
              </div>
              <button
                className={`seller-stock-save${saved[p.id] ? ' saved' : ''}`}
                onClick={() => save(p.id)}
                disabled={saving === p.id}
              >
                {saved[p.id] ? <><Check size={14} /> {t('saved')}</> : saving === p.id ? t('saving') : t('save')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
