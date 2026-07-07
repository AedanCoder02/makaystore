// Mock for next-intl
const translations = {
  // storefront namespace
  add: 'Add',
  viewDetails: 'View Details',
  // cart namespace
  each: 'each',
  remove: 'Remove',
  orderSummary: 'Order Summary',
  items: 'Items',
  subtotal: 'Subtotal',
  discount: 'Discount',
  total: 'Total',
  continueShopping: 'Continue Shopping',
  proceedToCheckout: 'Proceed to Checkout',
  // checkout namespace
  emptyCart: 'Your cart is empty',
  emptyCartDesc: 'Add some items to continue',
  backToCart: 'Back to Cart',
  shippingInfo: 'Shipping Information',
  fullName: 'Full Name',
  email: 'Email',
  address: 'Address',
  city: 'City',
  zipCode: 'ZIP Code',
  country: 'Country',
  selectCountry: 'Select Country',
  continueToPayment: 'Continue to Payment',
  backToShipping: 'Back to Shipping',
  requiredFields: 'Please fill all required fields',
  invalidEmail: 'Please enter a valid email',
  // hero namespace
  headline: 'Discover Makay',
  subheadline: 'Premium resort wear for the modern explorer',
  cta: 'Shop Collection',
  // admin namespace
  dashboard: 'Admin Dashboard',
  products: 'Products',
  productsDesc: 'Manage your product catalog',
  orders: 'Orders',
  ordersDesc: 'View and manage orders',
  workers: 'Workers',
  workersDesc: 'Worker management',
  reports: 'Reports',
  reportsDesc: 'Analytics and reporting',
  settings: 'Settings',
  settingsDesc: 'Store configuration',
  welcome: 'Welcome to admin',
  showTutorial: 'Show tutorial',
  help: 'Help',
  // access namespace
  loading: 'Loading...',
  denied: 'Access Denied',
  noPermission: 'You do not have permission to access this page',
  backToDashboard: 'Back to Dashboard',
  // worker namespace
  clockIn: 'Clock In',
  clockOut: 'Clock Out',
  // common namespace
  processing: 'Processing...',
  language: 'Language',
};

const useTranslations = (namespace) => {
  return (key) => translations[key] || key;
};

const useLocale = () => 'en';

const useRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn(),
  refresh: jest.fn(),
});

const usePathname = () => '/';

const NextIntlClientProvider = ({ children }) => children;

module.exports = {
  useTranslations,
  useLocale,
  useRouter,
  usePathname,
  NextIntlClientProvider,
  // named exports for "next-intl/routing" and others
  defineRouting: jest.fn(() => ({})),
  createNavigation: jest.fn(() => ({
    Link: ({ children }) => children,
    redirect: jest.fn(),
    useRouter: useRouter,
    usePathname: usePathname,
  })),
};
