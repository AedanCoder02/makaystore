'use client';

import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import CartItem from '@/components/CartItem';
import CartSummary from '@/components/CartSummary';
import '@/styles/cart.css';

export default function CartPage() {
  const { items, totalPrice, removeFromCart, updateQuantity } = useCart();

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <div className="cart-empty-content">
          <span className="empty-icon">🛒</span>
          <h1>Your cart is empty</h1>
          <p>Add some products and come back here.</p>
          <Link href="/products" className="btn-primary">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Shopping Cart</h1>

      <div className="cart-container">
        <div className="cart-items">
          {items.map((item) => (
            <CartItem
              key={`${item.productId}-${item.variantId}`}
              item={item}
              onRemove={() => removeFromCart(item.productId, item.variantId)}
              onQuantityChange={(qty) =>
                updateQuantity(item.productId, item.variantId, qty)
              }
            />
          ))}
        </div>

        <CartSummary items={items} totalPrice={totalPrice} />
      </div>
    </div>
  );
}
