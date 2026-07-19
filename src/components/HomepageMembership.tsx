'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Crown, Shield, Award, Star, ArrowRight } from 'lucide-react';

const BG_AERIAL   = 'https://d8j0ntlcm91z4.cloudfront.net/user_3EB2I1ekVpQy4uJr8950nm5Jt41/hf_20260719_020230_6a4f1f46-d219-41e6-b51a-50a560eb6cab.png';
const BG_MEMBER   = 'https://d8j0ntlcm91z4.cloudfront.net/user_3EB2I1ekVpQy4uJr8950nm5Jt41/hf_20260719_020241_61bb0b54-ddbd-4bf7-a656-c6ec2432ba13.png';

const TIERS = [
  { key: 'free',   label: 'Explorer', price: null, color: '#A89080', icon: Shield,  highlight: 'Free forever' },
  { key: 'bronze', label: 'Bronze',   price: 49,   color: '#CD7F32', icon: Award,   highlight: '5% credit back' },
  { key: 'silver', label: 'Silver',   price: 99,   color: '#A8A9AD', icon: Star,    highlight: 'Priority tickets' },
  { key: 'gold',   label: 'Gold',     price: 199,  color: '#D4AF37', icon: Star,    highlight: 'VIP event access' },
  { key: 'vip',    label: 'VIP',      price: 399,  color: '#D4A574', icon: Crown,   highlight: 'All perks' },
];

export default function HomepageMembership() {
  const t = useTranslations('homepage.membership');
  return (
    <section style={{ position: 'relative', overflow: 'hidden', background: '#0e0b08' }}>
      {/* Split layout: left image panel, right content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 600 }}>

        {/* Left — beach aerial image */}
        <div style={{ position: 'relative', minHeight: 400 }}>
          <img
            src={BG_AERIAL}
            alt="Makay Beach Club"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {/* Membership card inset */}
          <div style={{
            position: 'absolute', bottom: '2rem', left: '2rem', right: '2rem',
            borderRadius: 16, overflow: 'hidden',
          }}>
            <img src={BG_MEMBER} alt="Membership" style={{ width: '100%', height: 180, objectFit: 'cover', objectPosition: 'center 20%' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(14,11,8,0.8) 0%, transparent 60%)' }} />
            <div style={{ position: 'absolute', bottom: '1rem', left: '1.25rem' }}>
              <p style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Makay Beach Club</p>
              <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.7rem', color: 'var(--makay-peachy-rose)', margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t('cardLabel')}</p>
            </div>
          </div>
        </div>

        {/* Right — tier info */}
        <div style={{ padding: 'clamp(3rem, 6vw, 5rem) clamp(2rem, 5vw, 4rem)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--makay-peachy-rose)', marginBottom: '0.875rem' }}>
            {t('sectionTag')}
          </p>
          <h2 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 700, color: '#fff', margin: '0 0 1rem', lineHeight: 1.15 }}>
            {t('title')}
          </h2>
          <p style={{ fontFamily: 'var(--font-montserrat)', color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '2rem', maxWidth: 460 }}>
            {t('desc')}
          </p>

          {/* Tier grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '2rem' }}>
            {TIERS.map(tier => {
              const Icon = tier.icon;
              return (
                <div key={tier.key} style={{
                  padding: '0.875rem 1rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${tier.color}30`,
                  borderRadius: 12,
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                  <Icon size={16} style={{ color: tier.color, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '0.88rem', fontWeight: 700, color: tier.color, margin: 0 }}>{tier.label}</p>
                    <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>{tier.highlight}</p>
                  </div>
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
                    {tier.price ? `$${tier.price}` : 'Free'}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
            <Link href="/events#membership" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.875rem 1.75rem', background: 'var(--makay-peachy-rose)',
              color: '#fff', borderRadius: '100px', fontFamily: 'var(--font-montserrat)',
              fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none',
            }}>
              <Crown size={15} /> {t('joinNow')}
            </Link>
            <Link href="/events" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.875rem 1.5rem',
              color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-montserrat)',
              fontWeight: 600, fontSize: '0.88rem', textDecoration: 'none',
            }}>
              {t('seeEvents')} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile: stack vertically */}
      <style>{`
        @media (max-width: 768px) {
          .homepage-membership-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
