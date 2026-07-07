/**
 * Component tests for ProductDetail
 */
import React from 'react';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      sku: 'SKU',
      price: 'Price',
      addToCart: 'Add to Cart',
      addedToCart: 'Added to cart!',
      outOfStock: 'Out of Stock',
      quantity: 'Quantity',
      stock: 'In Stock',
      outOfStockShort: 'Out of stock',
      chooseSize: 'Choose Size',
      relatedProducts: 'Related Products',
      customerReviews: 'Customer Reviews',
      reviewsComingSoon: 'Reviews Coming Soon',
      reviewsComingSoonDesc: 'Be first to review',
    };
    return map[key] || key;
  },
  useLocale: () => 'en',
}));

jest.mock('next/link', () => {
  return function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('@/styles/product-detail.css', () => ({}), { virtual: true });
jest.mock('@/styles/variant-selector.css', () => ({}), { virtual: true });

const mockAddToCart = jest.fn();
jest.mock('@/hooks/useCart', () => ({
  useCart: () => ({
    addToCart: mockAddToCart,
    items: [],
    totalItems: 0,
    totalPrice: 0,
    removeFromCart: jest.fn(),
    updateQuantity: jest.fn(),
    clearCart: jest.fn(),
  }),
}));

jest.mock('@/components/ProductModel3D', () => {
  return function Mock() { return <div data-testid="product-model-3d" />; };
});

jest.mock('@/lib/mockData', () => ({
  mockProducts: [],
}));

import { render, screen, fireEvent, act } from '@testing-library/react';
import ProductDetail from '@/components/ProductDetail';
import type { Product } from '@/lib/mockData';

const product: Product = {
  id: 'p1',
  title: 'Beach Shirt',
  description: 'A beautiful linen shirt for the beach.',
  price: 79.99,
  category: 'Shirts',
  sku: 'SKU-001',
  stock: 5,
  variants: [
    { id: 'v1', name: 'Small', type: 'storefront', price: 79.99 },
    { id: 'v2', name: 'Medium', type: 'storefront', price: 79.99 },
  ],
  images: [],
  rating: 4.5,
  reviewCount: 10,
} as unknown as Product;

describe('ProductDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the product title', () => {
    render(<ProductDetail product={product} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Beach Shirt');
  });

  it('renders the product description', () => {
    render(<ProductDetail product={product} />);
    expect(screen.getByText('A beautiful linen shirt for the beach.')).toBeInTheDocument();
  });

  it('renders the price', () => {
    render(<ProductDetail product={product} />);
    expect(screen.getAllByText('$79.99').length).toBeGreaterThan(0);
  });

  it('renders variant selector', () => {
    render(<ProductDetail product={product} />);
    expect(screen.getByText('Choose Size')).toBeInTheDocument();
  });

  it('renders the Add to Cart button', () => {
    render(<ProductDetail product={product} />);
    expect(screen.getByText('Add to Cart')).toBeInTheDocument();
  });

  it('renders Out of Stock button when stock is 0', () => {
    const oos = { ...product, stock: 0 };
    render(<ProductDetail product={oos as unknown as Product} />);
    expect(screen.getByRole('button', { name: 'Out of Stock' })).toBeInTheDocument();
  });

  it('calls addToCart when Add to Cart is clicked', () => {
    render(<ProductDetail product={product} />);
    fireEvent.click(screen.getByText('Add to Cart'));
    expect(mockAddToCart).toHaveBeenCalledTimes(1);
    expect(mockAddToCart).toHaveBeenCalledWith(expect.objectContaining({ productId: 'p1' }));
  });

  it('shows added to cart toast after clicking', async () => {
    render(<ProductDetail product={product} />);
    await act(async () => {
      fireEvent.click(screen.getByText('Add to Cart'));
    });
    expect(screen.getByText(/Added to cart!/)).toBeInTheDocument();
  });

  it('hides toast after 2 seconds', async () => {
    render(<ProductDetail product={product} />);
    await act(async () => {
      fireEvent.click(screen.getByText('Add to Cart'));
    });
    await act(async () => {
      jest.advanceTimersByTime(2100);
    });
    expect(screen.queryByText(/Added to cart!/)).toBeNull();
  });

  it('renders the 3D model component', () => {
    render(<ProductDetail product={product} />);
    expect(screen.getByTestId('product-model-3d')).toBeInTheDocument();
  });
});
