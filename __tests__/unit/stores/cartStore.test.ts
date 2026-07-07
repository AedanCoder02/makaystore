/**
 * Unit tests for useCartStore (Zustand)
 * AAA pattern: Arrange → Act → Assert
 */
import { act } from '@testing-library/react';

// Reset module between tests so Zustand state is clean
const getStore = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useCartStore } = require('@/stores/cartStore');
  return useCartStore;
};

const sampleItem = {
  productId: '1',
  variantId: 'v1',
  quantity: 2,
  price: 79.99,
  title: 'Beach Linen Shirt',
  category: 'Shirts',
};

const sampleItem2 = {
  productId: '2',
  variantId: 'v4',
  quantity: 1,
  price: 64.99,
  title: 'Denim Shorts',
  category: 'Shorts',
};

beforeEach(() => {
  jest.resetModules();
});

describe('useCartStore', () => {
  describe('addToCart', () => {
    it('adds a new item to an empty cart', () => {
      // Arrange
      const store = getStore();
      const { addToCart } = store.getState();

      // Act
      act(() => { addToCart(sampleItem); });

      // Assert
      const { items } = store.getState();
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject(sampleItem);
    });

    it('increases quantity when same product+variant is added again', () => {
      // Arrange
      const store = getStore();
      const { addToCart } = store.getState();

      // Act
      act(() => { addToCart(sampleItem); });
      act(() => { addToCart({ ...sampleItem, quantity: 3 }); });

      // Assert
      const { items } = store.getState();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(5);
    });

    it('adds different items as separate cart entries', () => {
      // Arrange
      const store = getStore();
      const { addToCart } = store.getState();

      // Act
      act(() => { addToCart(sampleItem); });
      act(() => { addToCart(sampleItem2); });

      // Assert
      const { items } = store.getState();
      expect(items).toHaveLength(2);
    });
  });

  describe('removeFromCart', () => {
    it('removes item by productId and variantId', () => {
      // Arrange
      const store = getStore();
      act(() => { store.getState().addToCart(sampleItem); });
      act(() => { store.getState().addToCart(sampleItem2); });

      // Act
      act(() => { store.getState().removeFromCart('1', 'v1'); });

      // Assert
      const { items } = store.getState();
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe('2');
    });

    it('does nothing when removing a non-existent item', () => {
      // Arrange
      const store = getStore();
      act(() => { store.getState().addToCart(sampleItem); });

      // Act
      act(() => { store.getState().removeFromCart('NONEXISTENT', 'v999'); });

      // Assert
      expect(store.getState().items).toHaveLength(1);
    });
  });

  describe('updateQuantity', () => {
    it('updates quantity of an existing item', () => {
      // Arrange
      const store = getStore();
      act(() => { store.getState().addToCart(sampleItem); });

      // Act
      act(() => { store.getState().updateQuantity('1', 'v1', 10); });

      // Assert
      expect(store.getState().items[0].quantity).toBe(10);
    });

    it('clamps quantity to minimum of 1', () => {
      // Arrange
      const store = getStore();
      act(() => { store.getState().addToCart(sampleItem); });

      // Act
      act(() => { store.getState().updateQuantity('1', 'v1', 0); });

      // Assert
      expect(store.getState().items[0].quantity).toBe(1);
    });
  });

  describe('clearCart', () => {
    it('removes all items from the cart', () => {
      // Arrange
      const store = getStore();
      act(() => { store.getState().addToCart(sampleItem); });
      act(() => { store.getState().addToCart(sampleItem2); });

      // Act
      act(() => { store.getState().clearCart(); });

      // Assert
      expect(store.getState().items).toHaveLength(0);
    });
  });

  describe('getTotalPrice', () => {
    it('calculates correct total across multiple items', () => {
      // Arrange
      const store = getStore();
      act(() => { store.getState().addToCart(sampleItem); }); // 2 × 79.99 = 159.98
      act(() => { store.getState().addToCart(sampleItem2); }); // 1 × 64.99 = 64.99

      // Act
      const total = store.getState().getTotalPrice();

      // Assert
      expect(total).toBeCloseTo(224.97, 2);
    });

    it('returns 0 for empty cart', () => {
      const store = getStore();
      expect(store.getState().getTotalPrice()).toBe(0);
    });
  });

  describe('getTotalItems', () => {
    it('counts total quantity across all items', () => {
      // Arrange
      const store = getStore();
      act(() => { store.getState().addToCart(sampleItem); }); // qty: 2
      act(() => { store.getState().addToCart(sampleItem2); }); // qty: 1

      // Assert
      expect(store.getState().getTotalItems()).toBe(3);
    });
  });
});
