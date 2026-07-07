/**
 * Component tests for NavBar
 */
import React from 'react';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => ({ products: 'Products' }[key] || key),
  useLocale: () => 'en',
}));

jest.mock('next/link', () => {
  return function MockLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
    return <a href={href} className={className}>{children}</a>;
  };
});

jest.mock('@/hooks/useCart', () => ({
  useCart: () => ({ totalItems: 3, items: [], totalPrice: 0, addToCart: jest.fn(), removeFromCart: jest.fn(), updateQuantity: jest.fn(), clearCart: jest.fn() }),
}));

// LanguageSwitcher pulls in usePathname/useRouter — mock it
jest.mock('@/components/LanguageSwitcher', () => {
  return function MockLanguageSwitcher() {
    return <div data-testid="language-switcher" />;
  };
});

import { render, screen } from '@testing-library/react';
import NavBar from '@/components/NavBar';

describe('NavBar', () => {
  it('renders the brand logo link', () => {
    render(<NavBar />);
    const logo = screen.getByText('Makay');
    expect(logo).toBeInTheDocument();
    expect(logo.closest('a')).toHaveAttribute('href', '/');
  });

  it('renders the products link', () => {
    render(<NavBar />);
    const link = screen.getByText('Products');
    expect(link.closest('a')).toHaveAttribute('href', '/products');
  });

  it('renders the cart badge with item count', () => {
    render(<NavBar />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('cart badge has active class when totalItems > 0', () => {
    render(<NavBar />);
    const badge = screen.getByText('3');
    expect(badge.className).toContain('active');
  });

  it('renders the language switcher', () => {
    render(<NavBar />);
    expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
  });
});
