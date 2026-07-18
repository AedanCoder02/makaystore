'use client';

import { useState, useEffect } from 'react';
import { Plus, Minus, Check, HelpCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';

interface StockRow { id: string; title: string; sku: string; category: string; defaultStock: number; currentStock: number; }

export default function SellerStock({ products }: { products: StockRow[] }) {
  const t = useTranslations('seller.stock');
  const ts = useTranslations('seller');
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(products.map(p => [p.id, p.currentStock]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const tutorialStore = useTutorialStore();
  const tutorialUI = useTutorialOverlay('seller-stock-tour');

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

  const lowStock = products.filter(p => (quantities[p.id] ?? p.currentStock) < 10);

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

      {lowStock.length > 0 && (
        <div className="seller-alert">
          <strong>{t('lowStockAlert', { count: lowStock.length })}</strong>
          {' — '}{lowStock.map(p => p.title).join(', ')}
        </div>
      )}

      <div className="seller-stock-list">
        {products.map(p => {
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
