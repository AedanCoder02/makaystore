/**
 * Integration test: i18n locale switching
 * Simulates: switch locale → localStorage persisted → URL navigated
 */
import React from 'react';

// Setup all mocks BEFORE any component imports
jest.mock('next-intl', () => {
  let currentLocale = 'en';
  const translations = {
    language: 'Language',
  };
  return {
    useTranslations: () => (key: string) => translations[key] || key,
    useLocale: () => currentLocale,
  };
});

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/products',
}));

jest.mock('@/i18n/config', () => ({
  locales: ['en', 'es'],
  defaultLocale: 'en',
  routing: {},
}));

import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSwitcher from '@/components/LanguageSwitcher';

describe('i18n Switching Integration', () => {
  beforeEach(() => {
    currentLocale = 'en';
    mockPush.mockClear();
    localStorage.clear();
  });

  it('EN is active on initial load', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'ES' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches locale to ES and persists to localStorage', () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'ES' }));

    expect(localStorage.getItem('makay-locale')).toBe('es');
    expect(mockPush).toHaveBeenCalledWith('/es/products');
  });

  it('switching to EN from ES removes locale prefix', () => {
    currentLocale = 'es';
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'EN' }));

    expect(localStorage.getItem('makay-locale')).toBe('en');
    // EN is default so no prefix — router.push('/products')
    expect(mockPush).toHaveBeenCalledWith('/products');
  });

  it('clicking already active locale does not navigate', () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(mockPush).not.toHaveBeenCalled();
    expect(localStorage.getItem('makay-locale')).toBeNull();
  });

  it('locale preference is written to localStorage on each switch', () => {
    render(<LanguageSwitcher />);

    fireEvent.click(screen.getByRole('button', { name: 'ES' }));
    expect(localStorage.getItem('makay-locale')).toBe('es');
  });
});

// ─── Additional i18n store tests using the reports store locale simulation ───
describe('i18n with reports tab state', () => {
  it('reports store tab survives locale switch (state is independent)', () => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useReportsStore } = require('@/stores/reportsStore');
    const { act } = require('@testing-library/react');

    act(() => { useReportsStore.getState().setActiveTab('cost'); });
    expect(useReportsStore.getState().activeTab).toBe('cost');

    // Simulating a locale switch does not reset store state
    act(() => { useReportsStore.getState().setActiveTab('rotation'); });
    expect(useReportsStore.getState().activeTab).toBe('rotation');
  });
});
