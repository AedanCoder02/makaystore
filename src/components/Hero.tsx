'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { animate, stagger, createTimeline } from 'animejs';
import ShaderGradientCanvasWrapper from './ShaderGradientCanvas';
import '../styles/hero.css';

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const reducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  // Headline character stagger + entrance animations
  useEffect(() => {
    if (reducedMotion) return;
    const headline = headlineRef.current;
    if (!headline) return;

    // Split text into char spans, preserving spaces
    const words = headline.innerText.split(' ');
    headline.innerHTML = words
      .map(
        (word) =>
          word
            .split('')
            .map((char) => `<span class="char">${char}</span>`)
            .join('') + '<span class="word-space"> </span>'
      )
      .join('');

    const tl = createTimeline({ defaults: { ease: 'outQuad' } });

    tl.add(headline.querySelectorAll('.char'), {
        opacity: [0, 1],
        translateY: [24, 0],
        duration: 700,
        delay: stagger(25),
      });

    if (subRef.current) {
      tl.add(subRef.current, {
        opacity: [0, 1],
        translateY: [16, 0],
        duration: 600,
      }, '-=300');
    }

    if (ctaRef.current) {
      tl.add(ctaRef.current, {
        opacity: [0, 1],
        translateY: [16, 0],
        duration: 500,
      }, '-=400');
    }
  }, [reducedMotion]);

  // Scroll fade-out on hero
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroHeight = hero.offsetHeight;
      const opacity = Math.max(0, 1 - scrollY / (heroHeight * 0.45));
      hero.style.opacity = String(opacity);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Magnetic button effect
  useEffect(() => {
    const btn = ctaRef.current;
    if (!btn || reducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const mx = e.clientX - rect.left - rect.width / 2;
      const my = e.clientY - rect.top - rect.height / 2;
      const dist = Math.sqrt(mx * mx + my * my);
      const maxDist = 90;

      if (dist < maxDist) {
        const force = (1 - dist / maxDist) * 14;
        const angle = Math.atan2(my, mx);
        animate(btn, {
          translateX: Math.cos(angle) * force,
          translateY: Math.sin(angle) * force,
          duration: 100,
          easing: 'linear',
        });
      }
    };

    const handleMouseLeave = () => {
      animate(btn, {
        translateX: 0,
        translateY: 0,
        duration: 500,
        easing: 'easeOutElastic(1, .6)',
      });
    };

    btn.addEventListener('mousemove', handleMouseMove);
    btn.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      btn.removeEventListener('mousemove', handleMouseMove);
      btn.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [reducedMotion]);

  return (
    <section ref={heroRef} className="hero">
      <ShaderGradientCanvasWrapper />

      <div className="hero-content">
        <h1 ref={headlineRef} className="hero-headline">
          Tu Refugio de Conexion
        </h1>

        <p ref={subRef} className="hero-subheadline">
          Descubre ropa que cuenta historias. Disenada para ti, inspirada en la playa.
        </p>

        <Link ref={ctaRef} href="/products" className="hero-cta">
          <span className="hero-cta-inner">
            Explorar Coleccion
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 10h10M12 7l3 3-3 3" />
            </svg>
          </span>
        </Link>
      </div>

      <div className="hero-scroll-indicator" aria-hidden="true">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1f2937"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>
  );
}
