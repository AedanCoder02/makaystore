'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Award, Star, ShoppingBag, Check } from 'lucide-react';

const TIERS = [
  {
    key: 'bronze',
    label: 'Bronze',
    color: '#CD7F32',
    icon: Award,
    image: 'https://d8j0ntlcm91z4.cloudfront.net/user_3EB2I1ekVpQy4uJr8950nm5Jt41/hf_20260719_025011_3811970f-3e59-49fb-9c36-e9d66f33d8ad.png',
    perks: ['Full catalog access', 'Early drop access', '5% credit back', 'Member QR card'],
    productHref: '/products/membership-bronze',
  },
  {
    key: 'silver',
    label: 'Silver',
    color: '#A8A9AD',
    icon: Star,
    image: 'https://d8j0ntlcm91z4.cloudfront.net/user_3EB2I1ekVpQy4uJr8950nm5Jt41/hf_20260719_025018_a90c7985-632b-45b3-af61-3982b4a580e6.png',
    perks: ['Bronze perks', 'Priority event tickets', '10% credit back', 'Beach club access'],
    productHref: '/products/membership-silver',
  },
  {
    key: 'gold',
    label: 'Gold',
    color: '#D4AF37',
    icon: Star,
    image: 'https://d8j0ntlcm91z4.cloudfront.net/user_3EB2I1ekVpQy4uJr8950nm5Jt41/hf_20260719_025024_d50b049e-ae8b-481e-a3d8-e015ab48c01c.png',
    perks: ['Silver perks', 'VIP event access', '15% credit back', 'Personal stylist'],
    productHref: '/products/membership-gold',
  },
];

export default function HomepageMembership() {
  const t = useTranslations('homepage.membership');
  const [active, setActive] = useState(0);
  const [imgKey, setImgKey] = useState(0); // increments on change to trigger CSS animation

  function selectTier(i: number) {
    if (i === active) return;
    setActive(i);
    setImgKey(k => k + 1);
  }

  const tier = TIERS[active];

  return (
    <section style={{ background: '#0e0b08', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes mem-fade-in {
          from { opacity: 0; transform: scale(1.04); }
          to   { opacity: 1; transform: scale(1); }
        }
        .mem-img-animated {
          animation: mem-fade-in 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        @media (max-width: 768px) {
          .mem-grid { grid-template-columns: 1fr !important; }
          .mem-image-panel { min-height: 260px !important; height: 280px !important; }
        }
      `}</style>

      <div className="mem-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 560 }}>

        {/* Left: animated image */}
        <div className="mem-image-panel" style={{ position: 'relative', overflow: 'hidden' }}>
          <img
            key={imgKey}
            src={tier.image}
            alt={tier.label}
            className="mem-img-animated"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {/* Dark gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 60%, #0e0b08 100%)' }} />
          {/* Tier label badge over image */}
          <div style={{
            position: 'absolute', bottom: '1.5rem', left: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            background: 'rgba(14,11,8,0.7)', backdropFilter: 'blur(12px)',
            padding: '0.6rem 1rem', borderRadius: 12,
            border: `1px solid ${tier.color}40`,
          }}>
            <tier.icon size={16} style={{ color: tier.color }} />
            <span style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700, fontSize: '1rem', color: tier.color }}>
              {tier.label} Club
            </span>
          </div>
        </div>

        {/* Right: tier cards + info */}
        <div style={{ padding: 'clamp(2.5rem, 5vw, 4rem) clamp(1.5rem, 4vw, 3.5rem)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--makay-peachy-rose)', marginBottom: '0.875rem' }}>
            {t('sectionTag')}
          </p>
          <h2 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, color: '#fff', margin: '0 0 0.875rem', lineHeight: 1.15 }}>
            {t('title')}
          </h2>
          <p style={{ fontFamily: 'var(--font-montserrat)', color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '1.75rem' }}>
            {t('desc')}
          </p>

          {/* Tier selector cards — event card style */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
            {TIERS.map((t2, i) => {
              const Icon = t2.icon;
              const isActive = i === active;
              return (
                <button
                  key={t2.key}
                  onClick={() => selectTier(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '0.875rem 1.25rem',
                    background: isActive ? `rgba(${t2.color === '#CD7F32' ? '205,127,50' : t2.color === '#A8A9AD' ? '168,169,173' : '212,175,55'},0.12)` : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${isActive ? t2.color + '70' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: isActive ? t2.color + '25' : 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}>
                    <Icon size={16} style={{ color: isActive ? t2.color : 'rgba(255,255,255,0.4)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700, fontSize: '0.95rem', color: isActive ? t2.color : 'rgba(255,255,255,0.7)', margin: 0 }}>
                      {t2.label} Club
                    </p>
                    <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', margin: 0, marginTop: '0.15rem' }}>
                      {t2.perks[1]}
                    </p>
                  </div>
                  {isActive && (
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: tier.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={11} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active tier perks */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.75rem' }}>
            {tier.perks.map(perk => (
              <span key={perk} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.3rem 0.75rem', borderRadius: '100px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)',
              }}>
                <Check size={10} style={{ color: tier.color }} strokeWidth={3} /> {perk}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href={tier.productHref} style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.875rem 1.75rem', borderRadius: '100px',
              background: tier.color, color: '#fff',
              fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '0.88rem',
              textDecoration: 'none', transition: 'opacity 0.2s',
            }}>
              <ShoppingBag size={15} /> {t('joinNow')}
            </Link>
            <Link href="/events" style={{
              fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', fontWeight: 600,
              color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'color 0.2s',
            }}>
              {t('seeEvents')} →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
