'use client';

export interface ShippingMethod {
  id: 'standard' | 'express' | 'overnight';
  label: string;
  days: string;
  cost: number;
}

const SHIPPING_OPTIONS: ShippingMethod[] = [
  { id: 'standard', label: 'Standard Shipping', days: '5-7 business days', cost: 5 },
  { id: 'express', label: 'Express Shipping', days: '2-3 business days', cost: 15 },
  { id: 'overnight', label: 'Overnight Shipping', days: 'Next business day', cost: 30 },
];

interface Props {
  selected: string;
  onChange: (method: string) => void;
}

export default function ShippingMethodSelector({ selected, onChange }: Props) {
  return (
    <div className="shipping-method-selector">
      <h2>Shipping Method</h2>
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
              <span className="option-label">{option.label}</span>
              <span className="option-days">{option.days}</span>
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
