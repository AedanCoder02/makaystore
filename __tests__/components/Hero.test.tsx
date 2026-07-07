/**
 * Component tests for Hero
 * Covers: headline rendering, subheadline, CTA link, i18n in EN and ES
 */
import React from 'react';

// ─── Mocks (must be before component imports) ────────────────────────────────
// Use module-level mock object so jest.mock factory can reference it (prefix 'mock' is allowed)
const mockHeroLocale = { value: 'en' };

const mockHeroTranslations: Record<string, Record<string, string>> = {
  en: {
    headline: 'Discover Makay',
    subheadline: 'Premium resort wear for the modern explorer',
    cta: 'Shop Collection',
  },
  es: {
    headline: 'Descubre Makay',
    subheadline: 'Ropa de resort premium para el explorador moderno',
    cta: 'Ver Coleccion',
  },
};

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    return mockHeroTranslations[mockHeroLocale.value]?.[key] || key;
  },
  useLocale: () => mockHeroLocale.value,
}));

jest.mock('animejs', () => ({
  animate: jest.fn(),
  stagger: jest.fn(() => 0),
  createTimeline: jest.fn(() => ({
    add: jest.fn().mockReturnThis(),
  })),
}));

jest.mock('@shadergradient/react', () => ({
  ShaderGradientCanvas: () => null,
  ShaderGradient: () => null,
}));

jest.mock('@/components/ShaderGradientCanvas', () => {
  return function MockShaderGradientCanvas() {
    return <div data-testid="shader-gradient" />;
  };
});

// next/link must be a forwardRef component because Hero uses ref on Link
jest.mock('next/link', () => {
  const { forwardRef } = require('react');
  return forwardRef(function MockLink(
    props: { href: string; children: unknown; className?: string },
    ref: unknown
  ) {
    const { createElement } = require('react');
    return createElement('a', { ref, href: props.href, className: props.className }, props.children);
  });
});

import { render, screen } from '@testing-library/react';
import Hero from '@/components/Hero';

// jsdom does not implement innerText — force reducedMotion=true so the
// animation useEffect (which calls headline.innerText.split) is skipped.
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

describe('Hero (EN)', () => {
  beforeEach(() => {
    mockHeroLocale.value = 'en';
  });

  it('renders the English headline', () => {
    render(<Hero />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Discover Makay');
  });

  it('renders the English subheadline', () => {
    render(<Hero />);
    expect(screen.getByText('Premium resort wear for the modern explorer')).toBeInTheDocument();
  });

  it('renders the CTA link pointing to /products', () => {
    render(<Hero />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/products');
  });

  it('renders the shader gradient background', () => {
    render(<Hero />);
    expect(screen.getByTestId('shader-gradient')).toBeInTheDocument();
  });

  it('renders a hero section element', () => {
    render(<Hero />);
    // The hero section contains the heading
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.closest('section')).not.toBeNull();
  });
});

describe('Hero (ES — i18n)', () => {
  beforeEach(() => {
    mockHeroLocale.value = 'es';
  });

  it('renders the Spanish headline', () => {
    render(<Hero />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Descubre Makay');
  });

  it('renders the Spanish subheadline', () => {
    render(<Hero />);
    expect(screen.getByText('Ropa de resort premium para el explorador moderno')).toBeInTheDocument();
  });
});
