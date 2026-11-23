'use client';

import { useTranslations } from 'next-intl';
import { Waves, Sunset, Music2, HeartHandshake } from 'lucide-react';
import { useSiteContent } from '@/components/providers/SiteContentProvider';
import { useReveal } from '@/hooks/useReveal';

const ITEMS = [
  { id: 'sea', icon: Waves },
  { id: 'sunset', icon: Sunset },
  { id: 'music', icon: Music2 },
  { id: 'service', icon: HeartHandshake },
] as const;

/** "Why Makay": Studio keys page:home:content:why_<id>_{title,text}. */
export default function HomeWhy() {
  const t = useTranslations('homeWhy');
  const { text } = useSiteContent();
  const ref = useReveal<HTMLElement>(0.2);

  return (
    <section ref={ref} className="hx-why" aria-labelledby="hx-why-title">
      <div className="hx-wrap hx-why-layout">
        <div className="hx-why-intro" data-reveal>
          <p className="hx-eyebrow">{t('eyebrow')}</p>
          <h2 id="hx-why-title" className="hx-title">{text('page:home:content:why_title', t('title'))}</h2>
          <p className="hx-lede">{text('page:home:content:why_text', t('text'))}</p>
        </div>
        <ol className="hx-why-list">
          {ITEMS.map(({ id, icon: Icon }, i) => (
            <li key={id} className="hx-why-item" data-reveal>
              <span className="hx-why-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <span className="hx-why-icon" aria-hidden="true"><Icon size={22} /></span>
              <div>
                <h3>{text(`page:home:content:why_${id}_title`, t(`${id}.title`))}</h3>
                <p>{text(`page:home:content:why_${id}_text`, t(`${id}.text`))}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
