'use client';

import { useTranslations } from 'next-intl';

export interface ShippingMethod {
  id: 'standard' | 'express' | 'overnight';
  cost: number;
}

const SHIPPING_OPTIONS: ShippingMethod[] = [
  { id: 'standard', cost: 5 },
  { id: 'express', cost: 15 },
  { id: 'overnight', cost: 30 },
];

interface Props {
  selected: string;
  onChange: (method: string) => void;
}

export default function ShippingMethodSelector({ selected, onChange }: Props) {
  const t = useTranslations('checkout');

  return (
    <div className="shipping-method-selector">
      <h2>{t('shippingMethod')}</h2>
      <div className="shipping-options">
        {SHIPPING_OPTIONS.map((option) => (
          <label key={option.id} className="shipping-option">
            <input
              type="radio"
              name="shipping"
              value={option.id}
              checked={selected === option.id}
              onChange={() => onChange(option.id)}
            />
            <div className="option-content">
              <span className="option-label">{t(`shippingMethods.${option.id}`)}</span>
              <span className="option-days">{t(`shippingMethods.${option.id}Days`)}</span>
            </div>
            <span className="option-price">${option.cost}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function getShippingCost(method: string): number {
  return SHIPPING_OPTIONS.find((o) => o.id === method)?.cost || 0;
}
