/**
 * Component tests for CartPage
 */
import React from 'react';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => ({
    empty: 'Your cart is empty',
    emptyDesc: 'No items yet',
    browseProducts: 'Browse Products',
    title: 'Your Cart',
  }[key] || key),
  useLocale: () => 'en',
}));

jest.mock('next/link', () => {
  return function MockLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
    return <a href={href} className={className}>{children}</a>;
  };
});

// Mock cart styles import
jest.mock('@/styles/cart.css', () => ({}), { virtual: true });

const mockRemoveFromCart = jest.fn();
const mockUpdateQuantity = jest.fn();
let mockItems: { productId: string; variantId: string; quantity: number; price: number; title: string; category: string }[] = [];
let mockTotalPrice = 0;

jest.mock('@/hooks/useCart', () => ({
  useCart: () => ({
    items: mockItems,
    totalPrice: mockTotalPrice,
    removeFromCart: mockRemoveFromCart,
    updateQuantity: mockUpdateQuantity,
    addToCart: jest.fn(),
    clearCart: jest.fn(),
    totalItems: mockItems.reduce((s, i) => s + i.quantity, 0),
  }),
}));

jest.mock('@/components/CartItem', () => {
  return function MockCartItem({ item }: { item: { title: string } }) {
    return <div data-testid="cart-item">{item.title}</div>;
  };
});

jest.mock('@/components/CartSummary', () => {
  return function MockCartSummary({ totalPrice }: { totalPrice: number }) {
    return <div data-testid="cart-summary">${totalPrice.toFixed(2)}</div>;
  };
});

import { render, screen } from '@testing-library/react';
import CartPage from '@/components/CartPage';

describe('CartPage — empty state', () => {
  beforeEach(() => {
    mockItems = [];
    mockTotalPrice = 0;
  });

  it('shows empty cart message', () => {
    render(<CartPage />);
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  it('shows browse products link', () => {
    render(<CartPage />);
    expect(screen.getByText('Browse Products').closest('a')).toHaveAttribute('href', '/products');
  });
});

describe('CartPage — with items', () => {
  beforeEach(() => {
    mockItems = [
      { productId: '1', variantId: 'v1', quantity: 1, price: 59.99, title: 'Beach Shirt', category: 'Shirts' },
      { productId: '2', variantId: 'v2', quantity: 2, price: 39.99, title: 'Swim Shorts', category: 'Shorts' },
    ];
    mockTotalPrice = 139.97;
  });

  it('renders CartItem for each item', () => {
    render(<CartPage />);
    const items = screen.getAllByTestId('cart-item');
    expect(items).toHaveLength(2);
  });

  it('renders CartSummary', () => {
    render(<CartPage />);
    expect(screen.getByTestId('cart-summary')).toBeInTheDocument();
  });

  it('renders the cart title', () => {
    render(<CartPage />);
    expect(screen.getByText('Your Cart')).toBeInTheDocument();
  });
});
