'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Award, Star, ShoppingBag, Check } from 'lucide-react';

const DEFAULT_IMAGES = {
  bronze: 'https://d8j0ntlcm91z4.cloudfront.net/user_3EB2I1ekVpQy4uJr8950nm5Jt41/hf_20260719_025011_3811970f-3e59-49fb-9c36-e9d66f33d8ad.png',
  silver: 'https://d8j0ntlcm91z4.cloudfront.net/user_3EB2I1ekVpQy4uJr8950nm5Jt41/hf_20260719_025018_a90c7985-632b-45b3-af61-3982b4a580e6.png',
  gold:   'https://d8j0ntlcm91z4.cloudfront.net/user_3EB2I1ekVpQy4uJr8950nm5Jt41/hf_20260719_025024_d50b049e-ae8b-481e-a3d8-e015ab48c01c.png',
};
const TIER_COLORS = { bronze: '#CD7F32', silver: '#A8A9AD', gold: '#D4AF37' };
const TIER_ICONS  = { bronze: Award, silver: Star, gold: Star };

type TierKey = 'bronze' | 'silver' | 'gold';
const TIERS: TierKey[] = ['bronze', 'silver', 'gold'];

interface TierData {
  label: string;
  image: string;
  perks: string[];
  productHref: string;
}

export default function HomepageMembership() {
  const t = useTranslations('homepage.membership');
  const [active, setActive] = useState<TierKey>('bronze');
  const [imgKey, setImgKey] = useState(0);
  const [themeData, setThemeData] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/theme')
      .then(r => r.ok ? r.json() : {})
      .then((d: Record<string, string>) => setThemeData(d))
      .catch(() => {});
  }, []);

  function selectTier(key: TierKey) {
    if (key === active) return;
    setActive(key);
    setImgKey(k => k + 1);
  }

  function getTierData(key: TierKey): TierData {
    const content = (k: string) => themeData[`page:memberships:content:${key}_${k}`] ?? '';
    const label = content('label') || t(`${key}Label` as any);
    const imageUrl = content('image') || DEFAULT_IMAGES[key];
    const perksRaw = content('perks') || t(`${key}Perks` as any);
    const perks = perksRaw.split('|').map((s: string) => s.trim()).filter(Boolean);
    return { label, image: imageUrl, perks, productHref: `/products/membership-${key}` };
  }

  const tier = getTierData(active);
  const heading = themeData['page:memberships:content:heading'] || t('title');
  const tagLabel = themeData['page:memberships:content:tag_label'] || t('sectionTag');

  return (
    <section id="memberships" style={{ background: '#0e0b08', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes mem-fade-in {
          from { opacity: 0; transform: scale(1.04); }
          to   { opacity: 1; transform: scale(1); }
        }
        .mem-img-animated { animation: mem-fade-in 0.55s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
        @media (max-width: 768px) {
          .mem-grid { grid-template-columns: 1fr !important; }
          .mem-image-panel { height: 280px !important; }
        }
      `}</style>

      <div className="mem-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 520 }}>

        {/* Left: animated image */}
        <div className="mem-image-panel" style={{ position: 'relative', overflow: 'hidden' }}>
          <img
            key={imgKey}
            src={tier.image}
            alt={tier.label}
            className="mem-img-animated"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 60%, #0e0b08 100%)' }} />
          {/* Active tier badge over image */}
          <div style={{
            position: 'absolute', bottom: '1.5rem', left: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            background: 'rgba(14,11,8,0.75)', backdropFilter: 'blur(12px)',
            padding: '0.6rem 1rem', borderRadius: 12,
            border: `1px solid ${TIER_COLORS[active]}40`,
          }}>
            {(() => { const Icon = TIER_ICONS[active]; return <Icon size={16} style={{ color: TIER_COLORS[active] }} />; })()}
            <span style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700, fontSize: '1rem', color: TIER_COLORS[active] }}>
              {tier.label}
            </span>
          </div>
        </div>

        {/* Right */}
        <div style={{ padding: 'clamp(2.5rem, 5vw, 4rem) clamp(1.5rem, 4vw, 3.5rem)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--makay-peachy-rose)', marginBottom: '0.875rem' }}>
            {tagLabel}
          </p>
          <h2 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, color: '#fff', margin: '0 0 0.875rem', lineHeight: 1.15 }}>
            {heading}
          </h2>
          <p style={{ fontFamily: 'var(--font-montserrat)', color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '1.75rem' }}>
            {t('desc')}
          </p>

          {/* Tier selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem' }}>
            {TIERS.map(key => {
              const td = getTierData(key);
              const Icon = TIER_ICONS[key];
              const isActive = key === active;
              const color = TIER_COLORS[key];
              return (
                <button key={key} onClick={() => selectTier(key)} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0.875rem 1.25rem',
                  background: isActive ? `${color}18` : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${isActive ? color + '70' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: isActive ? color + '25' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                    <Icon size={16} style={{ color: isActive ? color : 'rgba(255,255,255,0.35)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700, fontSize: '0.95rem', color: isActive ? color : 'rgba(255,255,255,0.7)', margin: 0 }}>
                      {td.label}
                    </p>
                    <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', margin: 0, marginTop: '0.15rem' }}>
                      {td.perks[1] ?? td.perks[0] ?? ''}
                    </p>
                  </div>
                  {isActive && (
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={11} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Perks chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
            {tier.perks.map(perk => (
              <span key={perk} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.3rem 0.75rem', borderRadius: '100px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)',
              }}>
                <Check size={10} style={{ color: TIER_COLORS[active] }} strokeWidth={3} /> {perk}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href={tier.productHref} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.875rem 1.75rem', borderRadius: '100px',
              background: TIER_COLORS[active], color: '#fff',
              fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '0.88rem',
              textDecoration: 'none', transition: 'opacity 0.2s',
            }}>
              <ShoppingBag size={15} /> {t('joinNow')}
            </Link>
            <Link href="/events" style={{
              fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', fontWeight: 600,
              color: 'rgba(255,255,255,0.5)', textDecoration: 'none',
            }}>
              {t('seeEvents')} →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
