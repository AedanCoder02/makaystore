import { useCartStore } from '@/stores/cartStore';
export type { CartItem } from '@/stores/cartStore';

export const useCart = () => {
  const store = useCartStore();

  return {
    items: store.items,
    totalItems: store.getTotalItems(),
    totalPrice: store.getTotalPrice(),
    addToCart: store.addToCart,
    removeFromCart: store.removeFromCart,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
  };
};
