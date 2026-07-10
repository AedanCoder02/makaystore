'use client';

import { useEffect } from 'react';

// Each section maps to a Makay palette color
const SECTION_COLORS: Record<string, string> = {
  'hero-section':         '#FFF8F0',  // Premium Cream
  'featured-collection':  '#F5EFE5',  // Sand Cream
  'why-makay':            '#EDE0D4',  // Warm Peach
  'testimonials':         '#F2E4DC',  // Peachy Rose
  'how-it-works':         '#D4E8EE',  // Ocean Teal
  'categories':           '#E8DFC8',  // Warm Gold Sand
  'newsletter':           '#D4E4CC',  // Sage Green
  'footer':               '#FFF8F0',  // Premium Cream
};

export default function ScrollColorEngine() {
  useEffect(() => {
    // Set initial background
    document.body.style.transition = 'background-color 900ms cubic-bezier(0.4, 0, 0.2, 1)';
    document.body.style.backgroundColor = '#FFF8F0';

    const observers: IntersectionObserver[] = [];

    Object.entries(SECTION_COLORS).forEach(([id, color]) => {
      const el = document.getElementById(id);
      if (!el) return;

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
