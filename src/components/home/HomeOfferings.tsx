'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { useSiteContent } from '@/components/providers/SiteContentProvider';
import { useReveal } from '@/hooks/useReveal';
import { safeHref } from '@/lib/heroStyle';

const CDN = 'https://d8j0ntlcm91z4.cloudfront.net/user_3EB2I1ekVpQy4uJr8950nm5Jt41/';

/** Studio-editable tiles: page:home:content:offer_<id>_{title,text,image,link} */
export const OFFERINGS = [
  { id: 'food',   image: `${CDN}hf_20260719_025011_3811970f-3e59-49fb-9c36-e9d66f33d8ad.png`, link: '/reservations' },
  { id: 'drinks', image: `${CDN}hf_20260719_025018_a90c7985-632b-45b3-af61-3982b4a580e6.png`, link: '/reservations' },
  { id: 'people', image: `${CDN}hf_20260719_025024_d50b049e-ae8b-481e-a3d8-e015ab48c01c.png`, link: '/membership' },
  { id: 'events', image: `${CDN}hf_20260719_020223_13228ad3-42dc-44fe-88f5-9624ff49e7b9.png`, link: '/events' },
] as const;

export default function HomeOfferings() {
  const t = useTranslations('homeOfferings');
  const { text, get } = useSiteContent();
  const ref = useReveal<HTMLElement>(0.15);
  const k = (id: string, f: string) => `page:home:content:offer_${id}_${f}`;

  return (
    <section ref={ref} className="hx-offer" id="experience" aria-labelledby="hx-offer-title">
      <div className="hx-wrap">
        <header className="hx-head" data-reveal>
          <p className="hx-eyebrow">{text('page:home:content:offer_eyebrow', t('eyebrow'))}</p>
          <h2 id="hx-offer-title" className="hx-title">{text('page:home:content:featuredTitle', t('title'))}</h2>
          <p className="hx-lede">{text('page:home:content:featuredSubtitle', t('subtitle'))}</p>
        </header>

        <div className="hx-offer-grid">
          {OFFERINGS.map((o, i) => {
            const href = safeHref(get(k(o.id, 'link'))) ?? o.link;
            return (
              <Link key={o.id} href={href} className={`hx-offer-card hx-offer-card--${i}`} data-reveal>
                <span className="hx-offer-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={get(k(o.id, 'image')) ?? o.image} alt="" loading="lazy" />
                </span>
                <span className="hx-offer-shade" />
                <span className="hx-offer-body">
                  <span className="hx-offer-index">0{i + 1}</span>
                  <span className="hx-offer-name">{text(k(o.id, 'title'), t(`${o.id}.title`))}</span>
                  <span className="hx-offer-text">{text(k(o.id, 'text'), t(`${o.id}.text`))}</span>
                  <span className="hx-offer-cta">{t(`${o.id}.cta`)} <ArrowUpRight size={16} /></span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
