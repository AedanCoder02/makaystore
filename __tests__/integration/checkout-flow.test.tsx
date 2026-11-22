/**
 * Integration test: Checkout Flow
 * Simulates: cart populated → ShippingForm filled → proceed → payment (card or manual proof)
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

// Mock StripePaymentForm: simulates Stripe confirming the server-created PaymentIntent
jest.mock('@/components/StripePaymentForm', () => {
  return function MockStripePaymentForm({ onSuccess, getClientSecret }: { onSuccess: (id: string) => Promise<void>; getClientSecret: () => Promise<string> }) {
    return (
      <div data-testid="stripe-form">
        <button onClick={async () => { await getClientSecret(); await onSuccess('pi_test_mock_001'); }}>Pay Now</button>
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

// ─── fetch mock: payment config + order/payment endpoints ─────────────────────
let paymentConfig: Record<string, unknown>;
const fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
  const json = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body });
  if (url === '/api/payment-config') return json(paymentConfig);
  if (url === '/api/orders' && init?.method === 'POST') return json({ id: 'order-test-001' }, 201);
  if (url === '/api/payments/stripe/intent') return json({ clientSecret: 'pi_secret' });
  if (url === '/api/payments/stripe/confirm') return json({ paid: true });
  return json({ error: 'unexpected' }, 404);
});
(global as unknown as { fetch: typeof fetchMock }).fetch = fetchMock;

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
// jsdom lacks object URLs (used for the proof preview)
URL.createObjectURL = jest.fn(() => 'blob:preview');
URL.revokeObjectURL = jest.fn();

import CheckoutPage from '@/components/CheckoutPage';

const fillShipping = () => {
  fireEvent.change(document.getElementById('name')!, { target: { value: 'John Doe' } });
  fireEvent.change(document.getElementById('email')!, { target: { value: 'john@example.com' } });
  fireEvent.change(document.getElementById('address')!, { target: { value: '123 Main St' } });
  fireEvent.change(document.getElementById('city')!, { target: { value: 'New York' } });
  fireEvent.change(document.getElementById('zip')!, { target: { value: '10001' } });
  fireEvent.change(document.getElementById('country')!, { target: { value: 'US' } });
  fireEvent.submit(screen.getByRole('button', { name: /continue to payment/i }).closest('form')!);
};

describe('Checkout Flow Integration', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockClearCart.mockClear();
    fetchMock.mockClear();
    (global.alert as jest.Mock).mockClear();
    mockCartItems = [
      { productId: '1', variantId: 'v1', quantity: 2, price: 79.99, title: 'Beach Shirt', category: 'Shirts' },
    ];
    mockTotalPrice = 159.98;
    paymentConfig = {
      methods: ['stripe', 'pago_movil'],
      credentials: { pago_movil: { enabled: true, bank: 'Banesco', phone: '0414-0000000', id_number: 'J-123', holder: 'Makay' } },
      ves_rate: 0,
      instructions: '',
    };
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

  it('proceeds from shipping step to payment step on valid form submission', async () => {
    render(<CheckoutPage />);
    fillShipping();
    expect(await screen.findByTestId('stripe-form')).toBeInTheDocument();
  });

  it('shows order summary on the right side', () => {
    render(<CheckoutPage />);
    expect(screen.getByTestId('order-summary')).toBeInTheDocument();
  });

  it('card: creates the order, confirms the PaymentIntent, clears cart and redirects', async () => {
    render(<CheckoutPage />);
    fillShipping();

    const pay = await screen.findByRole('button', { name: 'Pay Now' });
    await act(async () => {
      fireEvent.click(pay);
    });

    const urls = fetchMock.mock.calls.map(c => c[0]);
    expect(urls).toEqual(expect.arrayContaining(['/api/orders', '/api/payments/stripe/intent', '/api/payments/stripe/confirm']));
    expect(mockClearCart).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/order-confirmation/order-test-001');
  });

  it('Pago Móvil: shows credentials and requires reference + proof before creating the order', async () => {
    render(<CheckoutPage />);
    fillShipping();

    const pagoMovil = await screen.findByRole('radio', { name: /pago_movil/ });
    fireEvent.click(pagoMovil);
    expect(screen.getByText('Banesco')).toBeInTheDocument();
    expect(screen.getByText('0414-0000000')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'confirmManual' }));
    expect(screen.getByRole('alert')).toHaveTextContent('errors.missingReference');

    fireEvent.change(screen.getByPlaceholderText('referencePlaceholder'), { target: { value: '00123456' } });
    const proof = new File(['img'], 'proof.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [proof] } });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'confirmManual' }));
    });

    const orderCall = fetchMock.mock.calls.find(c => c[0] === '/api/orders');
    const body = orderCall![1]!.body as FormData;
    const payload = JSON.parse(body.get('payload') as string);
    expect(payload.payment_methods).toEqual([{ method: 'pago_movil', amount: payload.total, reference: '00123456' }]);
    expect((body.get('proof_0') as File).name).toBe('proof.png');
    expect(mockPush).toHaveBeenCalledWith('/order-confirmation/order-test-001');
  });

  it('can go back to shipping step from payment step', async () => {
    render(<CheckoutPage />);
    fillShipping();
    await screen.findByTestId('stripe-form');

    fireEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByText('Shipping Information')).toBeInTheDocument();
  });
});
