/**
 * Integration test: Checkout Flow
 * Simulates: cart populated → ShippingForm filled → proceed → payment success
 */
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────
// Setup all mocks BEFORE any component imports
const translations = {
  emptyCart: 'Your cart is empty',
  emptyCartDesc: 'Add some items to continue',
  shippingInfo: 'Shipping Information',
  continueToPayment: 'Continue to Payment',
  orderSummary: 'Order Summary',
  subtotal: 'Subtotal',
  total: 'Total',
  backToCart: 'Back to Cart',
};

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => translations[key] || key,
  useLocale: () => 'en',
}));

jest.mock('animejs', () => ({
  default: jest.fn(() => ({ play: jest.fn(), pause: jest.fn() })),
}));

jest.mock('@shadergradient/react', () => ({
  ShaderGradientCanvas: () => null,
  ShaderGradient: () => null,
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/',
}));

import { render, screen, fireEvent, act } from '@testing-library/react';

// Mock useCart to return controlled state
const mockClearCart = jest.fn();
let mockCartItems = [
  { productId: '1', variantId: 'v1', quantity: 2, price: 79.99, title: 'Beach Shirt', category: 'Shirts' },
];
let mockTotalPrice = 159.98;

jest.mock('@/hooks/useCart', () => ({
  useCart: () => ({
    items: mockCartItems,
    totalPrice: mockTotalPrice,
    clearCart: mockClearCart,
    addToCart: jest.fn(),
    removeFromCart: jest.fn(),
    updateQuantity: jest.fn(),
    totalItems: 2,
  }),
}));

// Mock StripePaymentForm
jest.mock('@/components/StripePaymentForm', () => {
  return function MockStripePaymentForm({ onSuccess }: { onSuccess: (id: string) => void; onError: (err: string) => void; amount: number; loading: boolean }) {
    return (
      <div data-testid="stripe-form">
        <button onClick={() => onSuccess('pi_test_mock_001')}>Pay Now</button>
      </div>
    );
  };
});

// Mock OrderSummaryCheckout
jest.mock('@/components/OrderSummaryCheckout', () => {
  return function MockOrderSummary({ items, totalPrice }: { items: unknown[]; totalPrice: number; shippingCost: number }) {
    return (
      <div data-testid="order-summary">
        <span>{items.length} item(s)</span>
        <span>${totalPrice.toFixed(2)}</span>
      </div>
    );
  };
});

// Mock createOrder
jest.mock('@/lib/mockOrders', () => ({
  createOrder: jest.fn(() => ({ id: 'order-test-001' })),
}));

// Mock ShippingMethodSelector
jest.mock('@/components/ShippingMethodSelector', () => {
  const comp = function ({ selected, onChange }: { selected: string; onChange: (m: string) => void }) {
    return (
      <div data-testid="shipping-selector">
        <button onClick={() => onChange('express')}>Select Express</button>
        <span>Selected: {selected}</span>
      </div>
    );
  };
  comp.getShippingCost = (method: string) => ({ standard: 5.99, express: 14.99, overnight: 29.99 }[method] ?? 5.99);
  return comp;
});

global.alert = jest.fn();

import CheckoutPage from '@/components/CheckoutPage';

describe('Checkout Flow Integration', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockClearCart.mockClear();
    (global.alert as jest.Mock).mockClear();
    mockCartItems = [
      { productId: '1', variantId: 'v1', quantity: 2, price: 79.99, title: 'Beach Shirt', category: 'Shirts' },
    ];
    mockTotalPrice = 159.98;
  });

  it('renders shipping form on initial load when cart has items', () => {
    render(<CheckoutPage />);
    expect(screen.getByText('Shipping Information')).toBeInTheDocument();
  });

  it('shows empty cart message when cart is empty', () => {
    mockCartItems = [];
    mockTotalPrice = 0;
    render(<CheckoutPage />);
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  it('proceeds from shipping step to payment step on valid form submission', () => {
    render(<CheckoutPage />);

    // Fill in all required shipping fields
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '123 Main St' } });
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'New York' } });
    fireEvent.change(screen.getByLabelText(/zip code/i), { target: { value: '10001' } });
    fireEvent.change(screen.getByLabelText(/country/i), { target: { value: 'US' } });

    // Submit shipping form
    const form = screen.getByRole('button', { name: /continue to payment/i }).closest('form')!;
    fireEvent.submit(form);

    // Payment form should now be visible
    expect(screen.getByTestId('stripe-form')).toBeInTheDocument();
  });

  it('shows order summary on the right side', () => {
    render(<CheckoutPage />);
    expect(screen.getByTestId('order-summary')).toBeInTheDocument();
  });

  it('completes checkout: payment success → clear cart → redirect to order confirmation', () => {
    render(<CheckoutPage />);

    // Navigate to payment step
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '123 Main St' } });
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'New York' } });
    fireEvent.change(screen.getByLabelText(/zip code/i), { target: { value: '10001' } });
    fireEvent.change(screen.getByLabelText(/country/i), { target: { value: 'US' } });
    fireEvent.submit(screen.getByRole('button', { name: /continue to payment/i }).closest('form')!);

    // Trigger payment success
    fireEvent.click(screen.getByRole('button', { name: 'Pay Now' }));

    expect(mockClearCart).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/order-confirmation/order-test-001');
  });

  it('can go back to shipping step from payment step', () => {
    render(<CheckoutPage />);

    // Go to payment step
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '123 Main St' } });
    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: 'New York' } });
    fireEvent.change(screen.getByLabelText(/zip code/i), { target: { value: '10001' } });
    fireEvent.change(screen.getByLabelText(/country/i), { target: { value: 'US' } });
    fireEvent.submit(screen.getByRole('button', { name: /continue to payment/i }).closest('form')!);

    // Go back
    fireEvent.click(screen.getByText(/back to shipping/i));

    expect(screen.getByText('Shipping Information')).toBeInTheDocument();
  });
});
