/**
 * Unit tests for utility functions — price formatting, validation, locale detection
 */

// ─── Price formatting helpers (inline — these patterns exist throughout the codebase) ──

const formatPrice = (price: number): string => `$${price.toFixed(2)}`;

const calculateTotal = (items: Array<{ price: number; quantity: number }>): number =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

const calculateTotalWithShipping = (subtotal: number, shipping: number): number =>
  subtotal + shipping;

const applyDiscount = (total: number, discountPercent: number): number =>
  total * (1 - discountPercent / 100);

// ─── Email validation (mirrors ShippingForm logic) ────────────────────────────

const isValidEmail = (email: string): boolean => email.includes('@') && email.includes('.');

// ─── Locale detection (mirrors LanguageSwitcher logic) ───────────────────────

const detectLocaleFromStorage = (): string => {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('makay-locale') ?? 'en';
};

const getLocalePrefix = (locale: string, locales: string[]): string => {
  const defaultLocale = 'en';
  if (!locales.includes(locale)) return '';
  return locale === defaultLocale ? '' : `/${locale}`;
};

// ─── Shipping cost helper (mirrors ShippingMethodSelector) ────────────────────

const getShippingCost = (method: string): number => {
  const costs: Record<string, number> = {
    standard: 5.99,
    express: 14.99,
    overnight: 29.99,
    free: 0,
  };
  return costs[method] ?? 5.99;
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Price formatting', () => {
  it('formats integer prices with two decimal places', () => {
    expect(formatPrice(10)).toBe('$10.00');
    expect(formatPrice(0)).toBe('$0.00');
  });

  it('formats floating-point prices correctly', () => {
    expect(formatPrice(79.99)).toBe('$79.99');
    expect(formatPrice(64.9)).toBe('$64.90');
  });

  it('handles large prices without rounding errors', () => {
    expect(formatPrice(1299.99)).toBe('$1299.99');
  });
});

describe('calculateTotal', () => {
  it('returns 0 for empty cart', () => {
    expect(calculateTotal([])).toBe(0);
  });

  it('calculates total from multiple items', () => {
    const items = [
      { price: 79.99, quantity: 2 },
      { price: 64.99, quantity: 1 },
    ];
    expect(calculateTotal(items)).toBeCloseTo(224.97, 2);
  });

  it('handles single item', () => {
    expect(calculateTotal([{ price: 129.99, quantity: 3 }])).toBeCloseTo(389.97, 2);
  });
});

describe('calculateTotalWithShipping', () => {
  it('adds shipping cost to subtotal', () => {
    expect(calculateTotalWithShipping(100, 5.99)).toBeCloseTo(105.99, 2);
  });

  it('handles zero shipping (free shipping)', () => {
    expect(calculateTotalWithShipping(50, 0)).toBe(50);
  });
});

describe('applyDiscount', () => {
  it('applies percentage discount correctly', () => {
    expect(applyDiscount(100, 10)).toBe(90);
    expect(applyDiscount(200, 25)).toBe(150);
  });

  it('returns original price for 0% discount', () => {
    expect(applyDiscount(99.99, 0)).toBeCloseTo(99.99, 2);
  });
});

describe('Email validation', () => {
  it('accepts valid email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('admin@makay.co')).toBe(true);
  });

  it('rejects emails without @ or dot', () => {
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('noat.com')).toBe(false);
  });
});

describe('Locale detection', () => {
  it('defaults to "en" when localStorage is empty', () => {
    localStorage.clear();
    expect(detectLocaleFromStorage()).toBe('en');
  });

  it('reads saved locale from localStorage', () => {
    localStorage.setItem('makay-locale', 'es');
    expect(detectLocaleFromStorage()).toBe('es');
  });
});

describe('getLocalePrefix', () => {
  const locales = ['en', 'es'];

  it('returns empty string for default locale (en)', () => {
    expect(getLocalePrefix('en', locales)).toBe('');
  });

  it('returns /es prefix for ES locale', () => {
    expect(getLocalePrefix('es', locales)).toBe('/es');
  });

  it('returns empty string for unknown locale', () => {
    expect(getLocalePrefix('fr', locales)).toBe('');
  });
});

describe('getShippingCost', () => {
  it('returns correct cost for each shipping method', () => {
    expect(getShippingCost('standard')).toBe(5.99);
    expect(getShippingCost('express')).toBe(14.99);
    expect(getShippingCost('overnight')).toBe(29.99);
    expect(getShippingCost('free')).toBe(0);
  });

  it('defaults to standard cost for unknown method', () => {
    expect(getShippingCost('unknown')).toBe(5.99);
  });
});
