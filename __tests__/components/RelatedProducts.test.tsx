/**
 * Component tests for RelatedProducts
 */
import React from 'react';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => ({ relatedProducts: 'Related Products' }[key] || key),
}));

jest.mock('next/link', () => {
  return function MockLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
    return <a href={href} className={className}>{children}</a>;
  };
});

jest.mock('@/hooks/useCart', () => ({
  useCart: () => ({ addToCart: jest.fn(), items: [], totalItems: 0, totalPrice: 0, removeFromCart: jest.fn(), updateQuantity: jest.fn(), clearCart: jest.fn() }),
}));

// Mock mockData so we control which products appear as related
jest.mock('@/lib/mockData', () => ({
  mockProducts: [
    { id: 'p1', title: 'Beach Shirt', price: 79.99, category: 'Shirts', variants: [], images: [], rating: 4.5, reviewCount: 10, description: '' },
    { id: 'p2', title: 'Ocean Shirt', price: 69.99, category: 'Shirts', variants: [], images: [], rating: 4.0, reviewCount: 5, description: '' },
    { id: 'p3', title: 'Swim Shorts', price: 49.99, category: 'Shorts', variants: [], images: [], rating: 4.2, reviewCount: 8, description: '' },
  ],
}));

import { render, screen } from '@testing-library/react';
import RelatedProducts from '@/components/RelatedProducts';

describe('RelatedProducts', () => {
  it('renders related products section with heading', () => {
    render(<RelatedProducts currentProductId="p1" category="Shirts" />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Related Products');
  });

  it('renders related product but excludes current product', () => {
    render(<RelatedProducts currentProductId="p1" category="Shirts" />);
    expect(screen.getByText('Ocean Shirt')).toBeInTheDocument();
    expect(screen.queryByText('Beach Shirt')).toBeNull();
  });

  it('renders null when no related products exist', () => {
    const { container } = render(<RelatedProducts currentProductId="p3" category="Shorts" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders null when category has no other products', () => {
    const { container } = render(<RelatedProducts currentProductId="p1" category="Accessories" />);
    expect(container.firstChild).toBeNull();
  });
});
