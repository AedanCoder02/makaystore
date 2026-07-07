// Mock Stripe client
const mockStripe = {
  paymentIntents: {
    create: jest.fn().mockResolvedValue({
      id: 'pi_test_001',
      client_secret: 'pi_test_001_secret',
      status: 'requires_payment_method',
      amount: 10000,
      currency: 'usd',
    }),
    confirm: jest.fn().mockResolvedValue({
      id: 'pi_test_001',
      status: 'succeeded',
    }),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

// @stripe/react-stripe-js mocks
const Elements = ({ children }) => children;
const CardElement = () => null;
const useStripe = jest.fn(() => ({
  confirmCardPayment: jest.fn().mockResolvedValue({
    paymentIntent: { id: 'pi_test_001', status: 'succeeded' },
    error: null,
  }),
  createPaymentMethod: jest.fn().mockResolvedValue({
    paymentMethod: { id: 'pm_test_001' },
    error: null,
  }),
}));
const useElements = jest.fn(() => ({
  getElement: jest.fn().mockReturnValue({}),
}));

// Stripe constructor mock (server-side)
const Stripe = jest.fn().mockReturnValue(mockStripe);

module.exports = {
  // Server-side
  default: Stripe,
  Stripe,
  // React
  Elements,
  CardElement,
  useStripe,
  useElements,
  loadStripe: jest.fn().mockResolvedValue(mockStripe),
  // For testing assertions
  __mockStripe: mockStripe,
};
