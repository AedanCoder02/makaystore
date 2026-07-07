/**
 * Unit tests for useCart hook
 */
import { renderHook, act } from '@testing-library/react';
import { useCart } from '@/hooks/useCart';
import { useCartStore } from '@/stores/cartStore';

describe('useCart', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it('returns empty items initially', () => {
    const { result } = renderHook(() => useCart());
    expect(result.current.items).toHaveLength(0);
  });

  it('returns totalItems as 0 initially', () => {
    const { result } = renderHook(() => useCart());
    expect(result.current.totalItems).toBe(0);
  });

  it('returns totalPrice as 0 initially', () => {
    const { result } = renderHook(() => useCart());
    expect(result.current.totalPrice).toBe(0);
  });

  it('addToCart adds an item', () => {
    const { result } = renderHook(() => useCart());
    act(() => {
      result.current.addToCart({ productId: 'p1', variantId: 'v1', quantity: 1, price: 50, title: 'Shirt', category: 'Shirts' });
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.totalItems).toBe(1);
  });

  it('totalPrice reflects added items', () => {
    const { result } = renderHook(() => useCart());
    act(() => {
      result.current.addToCart({ productId: 'p1', variantId: 'v1', quantity: 2, price: 25, title: 'Shirt', category: 'Shirts' });
    });
    expect(result.current.totalPrice).toBe(50);
  });

  it('removeFromCart removes an item', () => {
    const { result } = renderHook(() => useCart());
    act(() => {
      result.current.addToCart({ productId: 'p1', variantId: 'v1', quantity: 1, price: 50, title: 'Shirt', category: 'Shirts' });
    });
    act(() => {
      result.current.removeFromCart('p1', 'v1');
    });
    expect(result.current.items).toHaveLength(0);
  });

  it('updateQuantity changes item quantity', () => {
    const { result } = renderHook(() => useCart());
    act(() => {
      result.current.addToCart({ productId: 'p1', variantId: 'v1', quantity: 1, price: 50, title: 'Shirt', category: 'Shirts' });
    });
    act(() => {
      result.current.updateQuantity('p1', 'v1', 3);
    });
    expect(result.current.items[0].quantity).toBe(3);
    expect(result.current.totalItems).toBe(3);
  });

  it('clearCart empties all items', () => {
    const { result } = renderHook(() => useCart());
    act(() => {
      result.current.addToCart({ productId: 'p1', variantId: 'v1', quantity: 2, price: 50, title: 'Shirt', category: 'Shirts' });
    });
    act(() => {
      result.current.clearCart();
    });
    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalItems).toBe(0);
  });
});
