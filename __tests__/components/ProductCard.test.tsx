/**
 * Component tests for ProductCard
 */
import React from 'react';

// Setup mocks BEFORE any component imports
const translations = {
  add: 'Add',
  viewDetails: 'View Details',
};

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => translations[key] || key,
  useLocale: () => 'en',
}));

import { render, screen, fireEvent } from '@testing-library/react';
import ProductCard from '@/components/ProductCard';

const singleVariantProduct = {
  id: '1',
  title: 'Makay Beach Linen Shirt',
  description: 'Lightweight linen shirt',
  price: 79.99,
  image: '/shirt.jpg',
  sku: 'MAKAY-001',
  stock: 45,
  category: 'Shirts',
  variants: [
    { id: 'v1', name: 'Medium', type: 'storefront' as const, price: 79.99 },
  ],
};

const multiVariantProduct = {
  ...singleVariantProduct,
  id: '2',
  title: 'Makay Denim Shorts',
  category: 'Shorts',
  variants: [
    { id: 'v1', name: 'Small', type: 'storefront' as const, price: 79.99 },
    { id: 'v2', name: 'Medium', type: 'dropshipping' as const, price: 74.99 },
    { id: 'v3', name: 'Large', type: 'storefront' as const, price: 79.99 },
  ],
};

describe('ProductCard', () => {
  it('renders the product title', () => {
    render(<ProductCard product={singleVariantProduct} />);
    expect(screen.getByText('Makay Beach Linen Shirt')).toBeInTheDocument();
  });

  it('renders the product category badge', () => {
    render(<ProductCard product={singleVariantProduct} />);
    expect(screen.getAllByText('Shirts').length).toBeGreaterThan(0);
  });

  it('renders the base price for the selected variant', () => {
    render(<ProductCard product={singleVariantProduct} />);
    expect(screen.getByText('$79.99')).toBeInTheDocument();
  });

  it('renders an add-to-cart button', () => {
    render(<ProductCard product={singleVariantProduct} />);
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('does not render variant buttons for single-variant products', () => {
    render(<ProductCard product={singleVariantProduct} />);
    // 'Medium' button should not appear (only shown when >1 variant)
    expect(screen.queryByRole('button', { name: /medium/i })).not.toBeInTheDocument();
  });

  it('renders variant buttons for multi-variant products', () => {
    render(<ProductCard product={multiVariantProduct} />);
    expect(screen.getByRole('button', { name: /Small/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Medium/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Large/i })).toBeInTheDocument();
  });

  it('updates displayed price when a variant is selected', () => {
    render(<ProductCard product={multiVariantProduct} />);

    // Initially shows first variant price
    expect(screen.getByText('$79.99')).toBeInTheDocument();

    // Click on Medium ($74.99)
    fireEvent.click(screen.getByRole('button', { name: /Medium/i }));
    expect(screen.getByText('$74.99')).toBeInTheDocument();
  });
});
