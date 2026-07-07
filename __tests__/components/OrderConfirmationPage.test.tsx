/**
 * Component tests for OrderConfirmationPage
 */
import React from 'react';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      orderConfirmed: 'Order Confirmed!',
      orderNumber: 'Order #',
      thankYou: 'Thank you for your order.',
      orderSummary: 'Order Summary',
      qty: 'Qty',
      subtotal: 'Subtotal',
      shippingCost: 'Shipping',
      total: 'Total',
      shippingDetails: 'Shipping Details',
      name: 'Name',
      address: 'Address',
      city: 'City',
      zipCode: 'ZIP',
      country: 'Country',
      shippingMethod: 'Method',
      'shippingMethods.standardLabel': 'Standard Shipping',
      'shippingMethods.expressLabel': 'Express Shipping',
      'shippingMethods.overnightLabel': 'Overnight Shipping',
      continueShopping: 'Continue Shopping',
      viewAllOrders: 'View all orders',
      comingSoon: '(coming soon)',
    };
    return map[key] || key;
  },
}));

jest.mock('next/link', () => {
  return function MockLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
    return <a href={href} className={className}>{children}</a>;
  };
});

import { render, screen } from '@testing-library/react';
import OrderConfirmationPage from '@/components/OrderConfirmationPage';
import type { Order } from '@/lib/mockOrders';

const mockOrder: Order = {
  id: 'order-001',
  items: [
    { productId: 'p1', variantId: 'v1', quantity: 2, price: 50, title: 'Beach Shirt', category: 'Shirts' },
  ],
  shippingAddress: {
    name: 'Jane Doe',
    email: 'jane@test.com',
    address: '456 Ocean Ave',
    city: 'Miami',
    zip: '33101',
    country: 'US',
  },
  shippingMethod: 'standard',
  shippingCost: 5.99,
  total: 105.99,
  status: 'pending',
  createdAt: new Date().toISOString(),
};

describe('OrderConfirmationPage', () => {
  it('renders the confirmation heading', () => {
    render(<OrderConfirmationPage order={mockOrder} />);
    expect(screen.getByText('Order Confirmed!')).toBeInTheDocument();
  });

  it('renders the order ID', () => {
    render(<OrderConfirmationPage order={mockOrder} />);
    expect(screen.getByText(/order-001/)).toBeInTheDocument();
  });

  it('renders the customer name in shipping details', () => {
    render(<OrderConfirmationPage order={mockOrder} />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('renders item in order summary', () => {
    render(<OrderConfirmationPage order={mockOrder} />);
    expect(screen.getByText('Beach Shirt')).toBeInTheDocument();
  });

  it('renders the continue shopping link', () => {
    render(<OrderConfirmationPage order={mockOrder} />);
    expect(screen.getByText('Continue Shopping').closest('a')).toHaveAttribute('href', '/products');
  });

  it('renders the order status badge', () => {
    render(<OrderConfirmationPage order={mockOrder} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});
