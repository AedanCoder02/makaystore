'use client';

import { useTranslations } from 'next-intl';
import { CartItem as CartItemType } from '@/stores/cartStore';

interface Props {
  item: CartItemType;
  onRemove: () => void;
  onQuantityChange: (qty: number) => void;
}

export default function CartItem({ item, onRemove, onQuantityChange }: Props) {
  const subtotal = item.price * item.quantity;
  const t = useTranslations('cart');

  return (
    <div className="cart-item">
      <div className="cart-item-image">
        M
      </div>

      <div className="cart-item-info">
        <h3>{item.title}</h3>
        <p className="category-badge">{item.category}</p>
        <p className="price-per-unit">${item.price.toFixed(2)} {t('each')}</p>
      </div>

      <div className="cart-item-controls">
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) =>
            onQuantityChange(Math.max(1, parseInt(e.target.value, 10) || 1))
          }
          className="qty-input"
        />
        <p className="subtotal">${subtotal.toFixed(2)}</p>
      </div>

      <button className="remove-btn" onClick={onRemove} aria-label={t('remove')}>
        ✕
      </button>
    </div>
  );
}
