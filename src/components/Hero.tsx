'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { animate, stagger, createTimeline } from 'animejs';
import '../styles/hero.css';

const HERO_IMAGE = '/images/hero-guacuco.webp';

export default function Hero() {
  const t = useTranslations('hero');
  const heroRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const reducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const [themeLoaded, setThemeLoaded] = useState(false);
  const [heroVideo, setHeroVideo]       = useState('');
  const [videoFailed, setVideoFailed]   = useState(false);
  const [heroTitle, setHeroTitle]       = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroCta, setHeroCta]           = useState('');

  useEffect(() => {
    fetch('/api/theme')
      .then(r => r.ok ? r.json() : {})
      .then((d: Record<string, string>) => {
        setHeroVideo(d['page:home:content:heroVideo']    || '');
        setHeroTitle(d['page:home:content:heroTitle']    || '');
        setHeroSubtitle(d['page:home:content:heroSubtitle'] || '');
        setHeroCta(d['page:home:content:ctaText']        || '');
        setThemeLoaded(true);
      })
      .catch(() => setThemeLoaded(true));
  }, []);

  const displayTitle    = heroTitle    || t('headline');
  const displaySubtitle = heroSubtitle || t('subheadline');
  const displayCta      = heroCta      || t('cta');

  // Character stagger runs after theme is resolved so the right text is animated.
  useEffect(() => {
    if (!themeLoaded || reducedMotion) return;
    const headline = headlineRef.current;
    if (!headline) return;

    const tl = createTimeline({ defaults: { ease: 'outExpo' } });

    tl.add(headline.querySelectorAll('.char'), {
      opacity: [0, 1],
      translateY: ['0.5em', '0em'],
      rotate: [4, 0],
      duration: 1000,
      delay: stagger(28),
    });

    if (subRef.current) {
      tl.add(subRef.current, { opacity: [0, 1], translateY: [16, 0], duration: 700 }, '-=600');
    }

    if (ctaRef.current) {
      tl.add(ctaRef.current, { opacity: [0, 1], translateY: [16, 0], duration: 600 }, '-=500');
    }
  }, [themeLoaded, reducedMotion, displayTitle]);

  // Scroll fade-out on hero
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroHeight = hero.offsetHeight;
      const progress = Math.min(1, scrollY / heroHeight);
      hero.style.setProperty('--hero-progress', progress.toFixed(3));
      hero.querySelector<HTMLElement>('.hero-content')!.style.opacity = String(Math.max(0, 1 - scrollY / (heroHeight * 0.5)));
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
        animate(btn, { translateX: Math.cos(angle) * force, translateY: Math.sin(angle) * force, duration: 100, easing: 'linear' });
      }
    };
    const handleMouseLeave = () => {
      animate(btn, { translateX: 0, translateY: 0, duration: 500, easing: 'easeOutElastic(1, .6)' });
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
      {heroVideo && !videoFailed ? (
        <video
          key={heroVideo}
          src={heroVideo}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoFailed(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
        />
      ) : (
        <div className="hero-media" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HERO_IMAGE} alt="" fetchPriority="high" decoding="async" />
        </div>
      )}
      <div className="hero-shade" aria-hidden="true" />

      <div className="hero-content">
        <p className="hero-eyebrow">
          <span aria-hidden="true" />Makay Beach Club · Guacuco<span aria-hidden="true" />
        </p>
        <h1 ref={headlineRef} className="hero-headline" aria-label={displayTitle}>
          {displayTitle.split(' ').map((word, wi, words) => (
            <span key={`${word}-${wi}`} aria-hidden="true">
              <span className="word">
                {word.split('').map((char, ci) => (
                  <span key={ci} className="char">{char}</span>
                ))}
              </span>
              {wi < words.length - 1 ? ' ' : null}
            </span>
          ))}
        </h1>

        <p ref={subRef} className="hero-subheadline">
          {displaySubtitle}
        </p>

        <Link ref={ctaRef} href="/products" className="hero-cta">
          <span className="hero-cta-inner">
            {displayCta}
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 10h10M12 7l3 3-3 3" />
            </svg>
          </span>
        </Link>
      </div>

      <div className="hero-scroll-indicator" aria-hidden="true">
        <span />
      </div>
    </section>
  );
}
