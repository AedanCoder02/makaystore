'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import RotationStatusBadge from './RotationStatusBadge';
import { useRotationStore } from '@/stores/rotationStore';
import type { RotationStatus } from '@/stores/rotationStore';

export interface ProductRow {
  id: string;
  name: string;
  status: RotationStatus;
  lastRotated: string;
  sku: string;
}

interface RotationTableProps {
  onRotateNow: (product: ProductRow) => void;
  onSchedule: (product: ProductRow) => void;
  onProductsLoaded?: (products: ProductRow[]) => void;
}

export default function RotationTable({ onRotateNow, onSchedule, onProductsLoaded }: RotationTableProps) {
  const { selectProduct, deselectProduct, selectedProducts } = useRotationStore();
  const t = useTranslations('rotation');
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/seller/rotation')
      .then(r => r.ok ? r.json() : [])
      .then((rows: { id: number | string; title: string; sku: string | null; status: string; last_rotated_at: string | null }[]) => {
        const mapped: ProductRow[] = rows.map(r => ({
          id: String(r.id),
          name: r.title,
          sku: r.sku ?? `SKU-${r.id}`,
          status: (['active','paused','archived'].includes(r.status) ? r.status : 'active') as RotationStatus,
          lastRotated: r.last_rotated_at
            ? new Date(r.last_rotated_at).toISOString().split('T')[0]
            : '—',
        }));
        setProducts(mapped);
        onProductsLoaded?.(mapped);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [onProductsLoaded]);

  const reload = () => {
    setLoading(true);
    fetch('/api/seller/rotation')
      .then(r => r.ok ? r.json() : [])
      .then((rows: { id: number | string; title: string; sku: string | null; status: string; last_rotated_at: string | null }[]) => {
        setProducts(rows.map(r => ({
          id: String(r.id),
          name: r.title,
          sku: r.sku ?? `SKU-${r.id}`,
          status: (['active','paused','archived'].includes(r.status) ? r.status : 'active') as RotationStatus,
          lastRotated: r.last_rotated_at ? new Date(r.last_rotated_at).toISOString().split('T')[0] : '—',
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  // Expose reload so parent can call it after rotate
  const handleRotateNow = (product: ProductRow) => {
    onRotateNow({ ...product, _reload: reload } as ProductRow & { _reload: () => void });
  };

  const allSelected = products.length > 0 && products.every(p => selectedProducts.includes(p.id));

  const handleSelectAll = (checked: boolean) => {
    products.forEach(p => checked ? selectProduct(p.id) : deselectProduct(p.id));
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--makay-mauve)', fontStyle: 'italic' }}>Loading products…</div>;
  }

  if (products.length === 0) {
    return <div style={{ padding: '2rem', color: 'var(--makay-mauve)', fontStyle: 'italic' }}>No products found.</div>;
  }

  return (
    <div className="table-container">
      <table className="rotation-table">
        <thead>
          <tr>
            <th>
              <input type="checkbox" aria-label={t('selectAll')} checked={allSelected}
                onChange={e => handleSelectAll(e.target.checked)} />
            </th>
            <th>{t('productName')}</th>
            <th>{t('sku')}</th>
            <th>{t('currentStatus')}</th>
            <th>{t('lastRotated')}</th>
            <th>{t('actions')}</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => {
            const isSelected = selectedProducts.includes(product.id);
            return (
              <tr key={product.id} className={isSelected ? 'selected' : ''}>
                <td>
                  <input type="checkbox" checked={isSelected}
                    onChange={() => isSelected ? deselectProduct(product.id) : selectProduct(product.id)}
                    aria-label={t('selectProduct').replace('{name}', product.name)} />
                </td>
                <td data-label={t('productName')}>{product.name}</td>
                <td data-label={t('sku')}>{product.sku}</td>
                <td data-label={t('currentStatus')}>
                  <RotationStatusBadge status={product.status} />
                </td>
                <td data-label={t('lastRotated')}>{product.lastRotated}</td>
                <td data-label={t('actions')} className="action-buttons">
                  <button className="btn btn-small" onClick={() => handleRotateNow(product)}
                    disabled={product.status === 'archived'}>
                    {t('rotateNow')}
                  </button>
                  <button className="btn btn-small btn-secondary" onClick={() => onSchedule(product)}>
                    {t('schedule')}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
