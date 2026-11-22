'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';

export const PENDING_REDIRECT_KEY = 'makay-pending-redirect-order';

/** Clears the cart when the customer comes back from an external checkout (Binance Pay) for this order. */
export default function ClearCartOnReturn({ orderId }: { orderId: string }) {
  const clearCart = useCartStore(s => s.clearCart);
  useEffect(() => {
    try {
      if (sessionStorage.getItem(PENDING_REDIRECT_KEY) === orderId) {
        sessionStorage.removeItem(PENDING_REDIRECT_KEY);
        clearCart();
      }
    } catch { /* storage unavailable */ }
  }, [orderId, clearCart]);
  return null;
}
