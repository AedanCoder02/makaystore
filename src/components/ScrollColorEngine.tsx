'use client';

import { useEffect } from 'react';

const SECTION_IDS = [
  'hero-section',
  'featured-collection',
  'why-makay',
  'testimonials',
  'how-it-works',
  'categories',
  'newsletter',
  'footer',
];

const DEFAULT_COLORS = [
  '#FFF8F0',
  '#F5EFE5',
  '#EDE0D4',
  '#F2E4DC',
  '#D4E8EE',
  '#E8DFC8',
  '#D4E4CC',
  '#FFF8F0',
];

export default function ScrollColorEngine() {
  useEffect(() => {
    // Read published scroll colors injected by theme (via CSS var)
    const resolveColors = (): string[] => {
      try {
        const stored = getComputedStyle(document.documentElement)
          .getPropertyValue('--scroll-colors')
          .trim();
        if (stored) return JSON.parse(stored);
      } catch {}
      return DEFAULT_COLORS;
    };

    const colors = resolveColors();

    document.body.style.transition = 'background-color 900ms cubic-bezier(0.4, 0, 0.2, 1)';
    document.body.style.backgroundColor = colors[0] ?? '#FFF8F0';

    const observers: IntersectionObserver[] = [];

    SECTION_IDS.forEach((id, idx) => {
      const el = document.getElementById(id);
      if (!el) return;

      const color = colors[idx] ?? DEFAULT_COLORS[idx] ?? '#FFF8F0';
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            document.body.style.backgroundColor = color;
          }
        },
        { threshold: 0.3 }
      );

      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach(o => o.disconnect());
  }, []);

  return null;
}
