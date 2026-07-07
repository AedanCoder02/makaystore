/**
 * Component tests for ProductGrid
 */
import React from 'react';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => ({
    noProducts: 'No products found',
    noProductsHint: 'Try adjusting your filters',
    add: 'Add',
    viewDetails: 'View Details',
  }[key] || key),
  useLocale: () => 'en',
}));

jest.mock('next/link', () => {
  return function MockLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
    return <a href={href} className={className}>{children}</a>;
  };
});

jest.mock('@/hooks/useCart', () => ({
  useCart: () => ({
    addToCart: jest.fn(),
    items: [],
    totalItems: 0,
    totalPrice: 0,
    removeFromCart: jest.fn(),
    updateQuantity: jest.fn(),
    clearCart: jest.fn(),
  }),
}));

import { render, screen } from '@testing-library/react';
import ProductGrid from '@/components/ProductGrid';
import type { Product } from '@/lib/mockData';

const mockProducts = [
  { id: '1', title: 'Beach Shirt', price: 79.99, description: 'A nice shirt', category: 'Shirts', variants: [], images: [], rating: 4.5, reviewCount: 10 },
  { id: '2', title: 'Swim Shorts', price: 49.99, description: 'Comfortable shorts', category: 'Shorts', variants: [], images: [], rating: 4.0, reviewCount: 5 },
] as unknown as Product[];

describe('ProductGrid', () => {
  it('renders empty state when no products', () => {
    render(<ProductGrid products={[]} />);
    expect(screen.getByText('No products found')).toBeInTheDocument();
  });

  it('renders hint text in empty state', () => {
    render(<ProductGrid products={[]} />);
    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
  });

  it('renders a ProductCard for each product', () => {
    render(<ProductGrid products={mockProducts} />);
    expect(screen.getByText('Beach Shirt')).toBeInTheDocument();
    expect(screen.getByText('Swim Shorts')).toBeInTheDocument();
  });

  it('renders the grid container when products exist', () => {
    const { container } = render(<ProductGrid products={mockProducts} />);
    expect(container.querySelector('.product-grid')).not.toBeNull();
  });
});
