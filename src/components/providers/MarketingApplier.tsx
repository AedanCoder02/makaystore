'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Maps page URL patterns to their editor page IDs
function resolvePageId(pathname: string): string | null {
  if (pathname === '/') return 'home';
  if (pathname === '/products') return 'products';
  if (pathname.startsWith('/products/')) return 'product-detail';
  if (pathname === '/checkout') return 'checkout';
  return null;
}

// Maps color keys to CSS custom properties
const COLOR_VAR_MAP: Record<string, string> = {
  bg:        '--makay-premium-cream',
  sectionBg: '--makay-sand-cream',
  primary:   '--makay-peachy-rose',
  accent:    '--makay-soft-coral',
  text:      '--makay-dark-navy',
  muted:     '--makay-mauve',
};

// Maps typography keys to CSS custom properties
const TYPO_VAR_MAP: Record<string, string> = {
  headingFont:    '--mkt-heading-font',
  headingScale:   '--mkt-heading-scale',
  bodySize:       '--mkt-body-size',
  letterSpacing:  '--mkt-letter-spacing',
};

const FONT_VALUES: Record<string, string> = {
  playfair:   "'Playfair Display', Georgia, serif",
  montserrat: "'Montserrat', sans-serif",
  georgia:    'Georgia, "Times New Roman", serif',
  system:     'system-ui, -apple-system, sans-serif',
};

const SCALE_VALUES: Record<string, string> = {
  xs: '0.82', sm: '0.92', md: '1.0', lg: '1.12', xl: '1.28',
};

const BODY_SIZE_VALUES: Record<string, string> = {
  sm: '0.9rem', md: '1rem', lg: '1.1rem',
};

const LETTER_SPACING_VALUES: Record<string, string> = {
  tight: '-0.01em', normal: '0.02em', wide: '0.08em',
};

export default function MarketingApplier() {
  const pathname = usePathname();

  useEffect(() => {
    const pageId = resolvePageId(pathname);

    // Remove any previously applied page overrides
    const existing = document.getElementById('mkt-page-vars');
    if (existing) existing.remove();

    if (!pageId) return;

    fetch('/api/theme')
      .then(r => r.json())
      .then((settings: Record<string, string>) => {
        const colorVars: string[] = [];
        const typoVars:  string[] = [];

        Object.entries(settings).forEach(([key, value]) => {
          // Color override
          const colorMatch = key.match(new RegExp(`^page:${pageId}:colors:(.+)$`));
          if (colorMatch) {
            const cssVar = COLOR_VAR_MAP[colorMatch[1]];
            if (cssVar) colorVars.push(`${cssVar}:${value}`);
            return;
          }

          // Typography override
          const typoMatch = key.match(new RegExp(`^page:${pageId}:typography:(.+)$`));
          if (typoMatch) {
            const tKey = typoMatch[1];
            const cssVar = TYPO_VAR_MAP[tKey];
            if (!cssVar) return;
            let cssValue = value;
            if (tKey === 'headingFont')   cssValue = FONT_VALUES[value]   ?? value;
            if (tKey === 'headingScale')  cssValue = SCALE_VALUES[value]  ?? value;
            if (tKey === 'bodySize')      cssValue = BODY_SIZE_VALUES[value]   ?? value;
            if (tKey === 'letterSpacing') cssValue = LETTER_SPACING_VALUES[value] ?? value;
            typoVars.push(`${cssVar}:${cssValue}`);
          }
        });

        if (colorVars.length === 0 && typoVars.length === 0) return;

        const allVars = [...colorVars, ...typoVars].join(';');
        const style = document.createElement('style');
        style.id = 'mkt-page-vars';
        style.textContent = `:root{${allVars}}`;
        document.head.appendChild(style);
      })
      .catch(() => {});
  }, [pathname]);

  return null;
}
