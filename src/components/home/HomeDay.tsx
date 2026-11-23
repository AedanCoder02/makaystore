'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSiteContent } from '@/components/providers/SiteContentProvider';

const MOMENTS = [
  { id: 'morning', from: '#F7E7CE', to: '#BFE3EC' },
  { id: 'noon',    from: '#BFE3EC', to: '#4A9FB5' },
  { id: 'sunset',  from: '#F2A766', to: '#B4505A' },
  { id: 'night',   from: '#2B2340', to: '#0E0B14' },
] as const;

/**
 * "A day at Makay" (replaces the old "From Ocean to Closet" steps).
 * Sticky scene whose sky shifts from morning to night as you scroll.
 * Studio keys: page:home:content:day_title, day_<id>_{time,title,text}.
 */
export default function HomeDay() {
  const t = useTranslations('homeDay');
  const { text } = useSiteContent();
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const total = el.offsetHeight - window.innerHeight;
        const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
        setProgress(p);
        setActive(Math.min(MOMENTS.length - 1, Math.floor(p * MOMENTS.length)));
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, []);

  const m = MOMENTS[active];

  return (
    <section ref={sectionRef} className="hx-day" aria-labelledby="hx-day-title" style={{ ['--hx-day-steps' as string]: MOMENTS.length }}>
      <div className="hx-day-stage" style={{ background: `linear-gradient(180deg, ${m.from}, ${m.to})` }}>
        <div className="hx-day-sun" style={{ transform: `translate(-50%, ${(progress * 120).toFixed(1)}%)`, opacity: active === 3 ? 0.15 : 1 }} aria-hidden="true" />
        <div className={`hx-day-sea${active === 3 ? ' is-night' : ''}`} aria-hidden="true" />
        <div className="hx-wrap hx-day-content">
          <p className="hx-eyebrow">{t('eyebrow')}</p>
          <h2 id="hx-day-title" className="hx-title">{text('page:home:content:day_title', t('title'))}</h2>
          <ol className="hx-day-steps">
            {MOMENTS.map((mo, i) => (
              <li key={mo.id} className={i === active ? 'is-active' : ''} aria-current={i === active ? 'step' : undefined}>
                <span className="hx-day-time">{text(`page:home:content:day_${mo.id}_time`, t(`${mo.id}.time`))}</span>
                <h3>{text(`page:home:content:day_${mo.id}_title`, t(`${mo.id}.title`))}</h3>
                <p>{text(`page:home:content:day_${mo.id}_text`, t(`${mo.id}.text`))}</p>
              </li>
            ))}
          </ol>
          <div className="hx-day-bar" aria-hidden="true"><span style={{ transform: `scaleX(${progress})` }} /></div>
        </div>
      </div>
    </section>
  );
}
