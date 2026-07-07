'use client';

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

export const PRODUCTS_MOCK: ProductRow[] = [
  { id: 'prod-001', name: 'Linen Shirt', status: 'active', lastRotated: '2026-06-15', sku: 'LINEN-001' },
  { id: 'prod-002', name: 'Cotton Pants', status: 'active', lastRotated: '2026-06-10', sku: 'COTTON-002' },
  { id: 'prod-003', name: 'Silk Blend Top', status: 'paused', lastRotated: '2026-05-20', sku: 'SILK-001' },
  { id: 'prod-004', name: 'Wool Sweater', status: 'archived', lastRotated: '2026-04-01', sku: 'WOOL-001' },
  { id: 'prod-005', name: 'Denim Jacket', status: 'active', lastRotated: '2026-06-12', sku: 'DENIM-001' },
  { id: 'prod-006', name: 'Beach Shorts', status: 'active', lastRotated: '2026-06-20', sku: 'BEACH-001' },
  { id: 'prod-007', name: 'Winter Coat', status: 'paused', lastRotated: '2026-03-15', sku: 'WINTER-001' },
  { id: 'prod-008', name: 'Summer Dress', status: 'active', lastRotated: '2026-06-18', sku: 'DRESS-001' },
  { id: 'prod-009', name: 'Cargo Pants', status: 'active', lastRotated: '2026-06-05', sku: 'CARGO-001' },
  { id: 'prod-010', name: 'Polo Shirt', status: 'active', lastRotated: '2026-06-14', sku: 'POLO-001' },
  { id: 'prod-011', name: 'Blazer Classic', status: 'paused', lastRotated: '2026-05-01', sku: 'BLAZ-001' },
  { id: 'prod-012', name: 'Running Tee', status: 'active', lastRotated: '2026-06-22', sku: 'RUN-001' },
  { id: 'prod-013', name: 'Chino Shorts', status: 'active', lastRotated: '2026-06-11', sku: 'CHINO-001' },
  { id: 'prod-014', name: 'Cashmere Scarf', status: 'archived', lastRotated: '2026-02-15', sku: 'CASH-001' },
  { id: 'prod-015', name: 'Leather Belt', status: 'active', lastRotated: '2026-06-08', sku: 'BELT-001' },
  { id: 'prod-016', name: 'Canvas Tote', status: 'active', lastRotated: '2026-06-19', sku: 'TOTE-001' },
  { id: 'prod-017', name: 'Sport Hoodie', status: 'paused', lastRotated: '2026-04-20', sku: 'HOOD-001' },
];

interface RotationTableProps {
  onRotateNow: (product: ProductRow) => void;
  onSchedule: (product: ProductRow) => void;
}

export default function RotationTable({ onRotateNow, onSchedule }: RotationTableProps) {
  const { selectProduct, deselectProduct, selectedProducts } = useRotationStore();
  const t = useTranslations('rotation');

  const allSelected = PRODUCTS_MOCK.every((p) => selectedProducts.includes(p.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      PRODUCTS_MOCK.forEach((p) => selectProduct(p.id));
    } else {
      PRODUCTS_MOCK.forEach((p) => deselectProduct(p.id));
    }
  };

  const handleRowToggle = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      deselectProduct(productId);
    } else {
      selectProduct(productId);
    }
  };

  return (
    <div className="table-container">
      <table className="rotation-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                aria-label={t('selectAll')}
                checked={allSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </th>
            <th>{t('productName')}</th>
            <th>{t('sku')}</th>
            <th>{t('currentStatus')}</th>
            <th>{t('lastRotated')}</th>
            <th>{t('actions')}</th>
          </tr>
        </thead>
        <tbody>
          {PRODUCTS_MOCK.map((product) => {
            const isSelected = selectedProducts.includes(product.id);
            return (
              <tr key={product.id} className={isSelected ? 'selected' : ''}>
                <td data-label="Select">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleRowToggle(product.id)}
                    aria-label={t('selectProduct').replace('{name}', product.name)}
                  />
                </td>
                <td data-label={t('productName')}>{product.name}</td>
                <td data-label={t('sku')}>{product.sku}</td>
                <td data-label={t('currentStatus')}>
                  <RotationStatusBadge status={product.status} />
                </td>
                <td data-label={t('lastRotated')}>{product.lastRotated}</td>
                <td data-label={t('actions')} className="action-buttons">
                  <button
                    className="btn btn-small"
                    onClick={() => onRotateNow(product)}
                    disabled={product.status === 'archived'}
                  >
                    {t('rotateNow')}
                  </button>
                  <button
                    className="btn btn-small btn-secondary"
                    onClick={() => onSchedule(product)}
                  >
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
