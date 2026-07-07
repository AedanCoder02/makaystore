/**
 * Component tests for LanguageSwitcher
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Create a controllable locale mock
let mockLocale = 'en';
const mockPush = jest.fn();
const mockPathname = '/products';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => mockLocale,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
}));

// i18n config mock
jest.mock('@/i18n/config', () => ({
  locales: ['en', 'es'],
  defaultLocale: 'en',
  routing: {},
}));

import LanguageSwitcher from '@/components/LanguageSwitcher';

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    mockLocale = 'en';
    mockPush.mockClear();
    localStorage.clear();
  });

  it('renders EN and ES buttons', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ES' })).toBeInTheDocument();
  });

  it('marks the active locale button as pressed', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'ES' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('persists selected locale to localStorage on switch', () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'ES' }));
    expect(localStorage.getItem('makay-locale')).toBe('es');
  });

  it('does not navigate when clicking the already-active locale', () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('navigates to /es path when switching to ES', () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'ES' }));
    expect(mockPush).toHaveBeenCalledWith('/es/products');
  });

  it('has accessible group label', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole('group')).toBeInTheDocument();
  });
});
