'use client';

import { useEffect, useRef } from 'react';

/**
 * Adds `is-revealed` to the element (and staggers children marked
 * [data-reveal]) the first time it scrolls into view. CSS owns the motion,
 * so prefers-reduced-motion is handled in the stylesheet.
 */
export function useReveal<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.querySelectorAll<HTMLElement>('[data-reveal]').forEach((child, i) => {
      child.style.setProperty('--reveal-i', String(i));
    });
    if (typeof IntersectionObserver === 'undefined') { el.classList.add('is-revealed'); return; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add('is-revealed'); io.disconnect(); }
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return ref;
}
