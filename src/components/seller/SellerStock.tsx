'use client';

import { useState, useEffect } from 'react';
import { Plus, Minus, Check, HelpCircle, Search, ArrowUp, ArrowDown, PackageX, AlertTriangle, PackageCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';

interface StockRow { id: string; title: string; sku: string; category: string; defaultStock: number; currentStock: number; }
type SortField = 'title' | 'sku' | 'category' | 'stock';
type Level = 'out' | 'low' | 'ok';
type Filter = 'all' | Level;

const LOW_THRESHOLD = 10;
const levelOf = (qty: number): Level => (qty <= 0 ? 'out' : qty < LOW_THRESHOLD ? 'low' : 'ok');
const LEVEL_RANK: Record<Level, number> = { out: 0, low: 1, ok: 2 };

export default function SellerStock({ products }: { products: StockRow[] }) {
  const t = useTranslations('seller.stock');
  const ts = useTranslations('seller');
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(products.map(p => [p.id, p.currentStock]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [persisted, setPersisted] = useState<Record<string, number>>(
    Object.fromEntries(products.map(p => [p.id, p.currentStock]))
  );
  const [filter, setFilter] = useState<Filter>('all');
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
    setFailed(f => ({ ...f, [id]: false }));
    const res = await fetch('/api/seller/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: id, quantity: quantities[id] }),
    }).catch(() => null);
    setSaving(null);
    if (!res?.ok) { setFailed(f => ({ ...f, [id]: true })); return; }
    setPersisted(p => ({ ...p, [id]: quantities[id] }));
    setSaved(s => ({ ...s, [id]: true }));
    setTimeout(() => setSaved(s => ({ ...s, [id]: false })), 2000);
  };

  const qtyOf = (p: StockRow) => quantities[p.id] ?? p.currentStock;
  // Counts follow the saved value so a row doesn't jump buckets while you type.
  const savedLevel = (p: StockRow) => levelOf(persisted[p.id] ?? p.currentStock);
  const counts = products.reduce<Record<Level, number>>((acc, p) => { acc[savedLevel(p)]++; return acc; }, { out: 0, low: 0, ok: 0 });

  const q = search.trim().toLowerCase();
  const filtered = products.filter(p =>
    (filter === 'all' || savedLevel(p) === filter) &&
    (!q || p.title.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q) || (p.category ?? '').toLowerCase().includes(q))
  );

  // Out of stock always first, then low, then the chosen sort.
  const sorted = [...filtered].sort((a, b) => {
    const rank = LEVEL_RANK[savedLevel(a)] - LEVEL_RANK[savedLevel(b)];
    if (rank !== 0) return rank;
    let cmp = 0;
    if (sortField === 'stock') cmp = qtyOf(a) - qtyOf(b);
    else if (sortField === 'title') cmp = a.title.localeCompare(b.title);
    else if (sortField === 'sku') cmp = (a.sku ?? '').localeCompare(b.sku ?? '');
    else cmp = (a.category ?? '').localeCompare(b.category ?? '');
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const FILTERS: { id: Filter; icon?: typeof PackageX; count: number }[] = [
    { id: 'all', count: products.length },
    { id: 'out', icon: PackageX, count: counts.out },
    { id: 'low', icon: AlertTriangle, count: counts.low },
    { id: 'ok', icon: PackageCheck, count: counts.ok },
  ];

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

      <div className="stk-summary" role="tablist" aria-label={t('filterLabel')}>
        {FILTERS.map(({ id, icon: Icon, count }) => (
          <button key={id} role="tab" aria-selected={filter === id}
            className={`stk-chip stk-chip--${id}${filter === id ? ' active' : ''}`} onClick={() => setFilter(id)}>
            {Icon && <Icon size={16} aria-hidden="true" />}
            <span className="stk-chip-count">{count}</span>
            <span className="stk-chip-label">{t(`filter.${id}`)}</span>
          </button>
        ))}
      </div>

      <div className="stk-toolbar">
        <div className="seller-search-wrap">
          <Search size={16} className="seller-search-icon" />
          <input className="seller-search with-icon" placeholder={t('searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="sp-sort-toolbar">
          <span className="sp-sort-label">{t('sortBy')}</span>
          {(['title', 'sku', 'category', 'stock'] as SortField[]).map(f => (
            <button key={f} className={`sp-sort-btn${sortField === f ? ' active' : ''}`} onClick={() => toggleSort(f)}>
              {t(`sort.${f}`)} <SortIcon field={f} />
            </button>
          ))}
        </div>
      </div>

      <div className="seller-stock-list">
        {sorted.length === 0 && <p className="seller-empty">{t('empty')}</p>}
        {sorted.map(p => {
          const qty = qtyOf(p);
          const level = levelOf(qty);
          const dirty = qty !== (persisted[p.id] ?? p.currentStock);
          return (
            <div key={p.id} className={`seller-stock-row stk-row--${level}${dirty ? ' is-dirty' : ''}`}>
              <span className={`stk-level stk-level--${level}`} aria-hidden="true" />
              <div className="seller-stock-info">
                <div className="stk-title-row">
                  <span className="seller-stock-title">{p.title}</span>
                  <span className={`seller-stock-badge stk-badge--${level}`}>{t(`badge.${level}`)}</span>
                </div>
                <span className="seller-stock-sku">{[p.sku, p.category].filter(Boolean).join(' · ')}</span>
              </div>
              <div className="seller-stock-controls">
                <button className="seller-qty-btn" onClick={() => adjust(p.id, -5)} aria-label={t('minus', { n: 5 })}>-5</button>
                <button className="seller-qty-btn" onClick={() => adjust(p.id, -1)} aria-label={t('minus', { n: 1 })}><Minus size={14} /></button>
                <input
                  className={`seller-qty-input${level !== 'ok' ? ' low' : ''}`}
                  type="number"
                  inputMode="numeric"
                  aria-label={t('quantityFor', { product: p.title })}
                  value={qty}
                  min={0}
                  onChange={e => setQuantities(q => ({ ...q, [p.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                />
                <button className="seller-qty-btn" onClick={() => adjust(p.id, 1)} aria-label={t('plus', { n: 1 })}><Plus size={14} /></button>
                <button className="seller-qty-btn" onClick={() => adjust(p.id, 5)} aria-label={t('plus', { n: 5 })}>+5</button>
              </div>
              <button
                className={`seller-stock-save${saved[p.id] ? ' saved' : ''}${failed[p.id] ? ' failed' : ''}`}
                onClick={() => save(p.id)}
                disabled={saving === p.id || (!dirty && !failed[p.id])}
              >
                {saved[p.id] ? <><Check size={14} /> {t('saved')}</> : saving === p.id ? t('saving') : failed[p.id] ? t('retry') : t('save')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
