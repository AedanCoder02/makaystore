/**
 * Component tests for CartSummary
 */
import React from 'react';

// Setup mocks BEFORE any component imports
const translations = {
  orderSummary: 'Order Summary',
  items: 'Items',
  subtotal: 'Subtotal',
  discount: 'Discount',
  total: 'Total',
  continueShopping: 'Continue Shopping',
  proceedToCheckout: 'Proceed to Checkout',
};

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => translations[key] || key,
  useLocale: () => 'en',
}));

import { render, screen } from '@testing-library/react';
import CartSummary from '@/components/CartSummary';

const mockItems = [
  { productId: '1', variantId: 'v1', quantity: 2, price: 79.99, title: 'Shirt', category: 'Shirts' },
  { productId: '2', variantId: 'v4', quantity: 1, price: 64.99, title: 'Shorts', category: 'Shorts' },
];

describe('CartSummary', () => {
  it('renders the order summary heading', () => {
    render(<CartSummary items={mockItems} totalPrice={224.97} />);
    expect(screen.getByText('Order Summary')).toBeInTheDocument();
  });

  it('displays the total item count', () => {
    render(<CartSummary items={mockItems} totalPrice={224.97} />);
    // 2 + 1 = 3 items
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('displays the subtotal', () => {
    render(<CartSummary items={mockItems} totalPrice={224.97} />);
    expect(screen.getAllByText('$224.97')).toHaveLength(2); // subtotal + total (no discount)
  });

  it('shows proceed to checkout link when cart has items', () => {
    render(<CartSummary items={mockItems} totalPrice={224.97} />);
    const link = screen.getByText('Proceed to Checkout');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('disables checkout link when cart is empty', () => {
    render(<CartSummary items={[]} totalPrice={0} />);
    const link = screen.getByText('Proceed to Checkout');
    expect(link.closest('a')).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows continue shopping link', () => {
    render(<CartSummary items={mockItems} totalPrice={224.97} />);
    expect(screen.getByText('Continue Shopping')).toBeInTheDocument();
  });
});
