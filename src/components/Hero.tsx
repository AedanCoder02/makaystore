'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { animate, stagger, createTimeline } from 'animejs';
import ShaderGradientCanvasWrapper from './ShaderGradientCanvas';
import { useSiteContent } from '@/components/providers/SiteContentProvider';
import { readHeroStyle, heroTitleCss } from '@/lib/heroStyle';
import '../styles/hero.css';

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

  const { text, get } = useSiteContent();
  const style = readHeroStyle(get);
  const heroVideo = get('page:home:content:heroVideo') ?? '';
  const [videoFailed, setVideoFailed] = useState(false);

  const displayTitle    = text('page:home:content:heroTitle', t('headline'));
  const displaySubtitle = text('page:home:content:heroSubtitle', t('subheadline'));
  const displayCta      = text('page:home:content:ctaText', t('cta'));
  const words = displayTitle.split(/\s+/).filter(Boolean);

  // Entrance: per-character rise (solid colour) or a soft reveal of the whole
  // line (gradient text, where per-character transforms would break the clip).
  // React renders the spans; anime only animates them, so Studio edits and
  // language switches re-render normally.
  useEffect(() => {
    const headline = headlineRef.current;
    if (!headline) return;
    // Reduced motion: hero.css shows everything statically.
    if (reducedMotion) return;
    const tl = createTimeline({ defaults: { ease: 'outQuad' } });
    const chars = headline.querySelectorAll('.char');
    if (chars.length) {
      tl.add(chars, { opacity: [0, 1], translateY: [24, 0], duration: 700, delay: stagger(22) });
    } else {
      tl.add(headline, { opacity: [0, style.opacity / 100], translateY: [24, 0], filter: ['blur(8px)', 'blur(0px)'], duration: 900 });
    }
    if (subRef.current) tl.add(subRef.current, { opacity: [0, 1], translateY: [16, 0], duration: 600 }, '-=300');
    if (ctaRef.current) tl.add(ctaRef.current, { opacity: [0, 1], translateY: [16, 0], duration: 500 }, '-=400');
    return () => { tl.pause(); };
  }, [displayTitle, style.gradient, style.opacity, reducedMotion]);

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
        <ShaderGradientCanvasWrapper />
      )}
      {style.overlay > 0 && (
        <div className="hero-overlay" aria-hidden="true" style={{ background: `rgba(10, 8, 6, ${style.overlay / 100})` }} />
      )}

      <div className="hero-content">
        <h1
          ref={headlineRef}
          className={`hero-headline${style.gradient ? ' hero-headline--gradient' : ''}`}
          style={heroTitleCss(style)}
          aria-label={displayTitle}
        >
          {style.gradient
            ? displayTitle
            : words.map((word, wi) => (
                <span key={`${displayTitle}-${wi}`} className="word" aria-hidden="true">
                  {Array.from(word).map((ch, ci) => <span key={ci} className="char">{ch}</span>)}
                  {wi < words.length - 1 && <span className="word-space"> </span>}
                </span>
              ))}
        </h1>

        <p ref={subRef} className="hero-subheadline" style={{ color: style.subtitleColor }}>
          {displaySubtitle}
        </p>

        <Link ref={ctaRef} href={style.ctaHref} className="hero-cta">
          <span className="hero-cta-inner">
            {displayCta}
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 10h10M12 7l3 3-3 3" />
            </svg>
          </span>
        </Link>
      </div>

      <div className="hero-scroll-indicator" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>
  );
}
