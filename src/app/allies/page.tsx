'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { Lock, Copy, Check } from 'lucide-react';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';

interface Ally {
  id: number;
  name: string;
  logo_url: string;
  description: string;
  discount_percent: number;
  discount_code: string | null;
  min_tier: string;
  has_access: boolean;
}

const TIER_LABEL: Record<string, string> = {
  bronze: 'Bronze+', silver: 'Silver+', gold: 'Gold+', vip: 'VIP',
};

const TIER_COLOR: Record<string, string> = {
  bronze: '#CD7F32', silver: '#A8A9AD', gold: '#D4AF37', vip: '#D4A574',
};

const AVATAR_COLORS = ['#CD7F32', '#A8A9AD', '#D4AF37', '#D4A574', '#A89080', '#8b6e5a'];

function AllyCard({ ally }: { ally: Ally }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!ally.discount_code) return;
    await navigator.clipboard.writeText(ally.discount_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const avatarColor = AVATAR_COLORS[ally.id % AVATAR_COLORS.length];
  const initials = ally.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const tierColor = TIER_COLOR[ally.min_tier] ?? '#CD7F32';
  const tierLabel = TIER_LABEL[ally.min_tier] ?? 'Bronze+';

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #f0ebe4',
      borderRadius: 16,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'box-shadow 0.2s, transform 0.2s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.10)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
    >
      {/* Card header */}
      <div style={{ padding: '1.75rem 1.5rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {ally.logo_url ? (
          <img src={ally.logo_url} alt={ally.name} style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{
            width: 56, height: 56, borderRadius: 12, background: avatarColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, color: '#fff', fontFamily: 'var(--font-playfair-display)',
            fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.02em',
          }}>
            {initials}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--makay-dark-navy)', margin: '0 0 0.25rem' }}>{ally.name}</p>
          <span style={{
            display: 'inline-block', fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem',
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
            color: tierColor, background: `${tierColor}18`, borderRadius: 4,
            padding: '0.15rem 0.5rem',
          }}>
            {tierLabel}
          </span>
        </div>
        <div style={{
          flexShrink: 0, background: `${tierColor}15`, borderRadius: 10,
          padding: '0.4rem 0.7rem', textAlign: 'center',
        }}>
          <p style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700, fontSize: '1.4rem', color: tierColor, margin: 0, lineHeight: 1 }}>{ally.discount_percent}%</p>
          <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.6rem', color: tierColor, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>off</p>
        </div>
      </div>

      {/* Description */}
      <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: 'var(--makay-mauve)', padding: '0 1.5rem', margin: '0 0 1.25rem', lineHeight: 1.5 }}>
        {ally.description}
      </p>

      {/* Code section */}
      <div style={{ marginTop: 'auto', padding: '1rem 1.5rem 1.5rem' }}>
        {ally.has_access && ally.discount_code ? (
          <button onClick={copy} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.7rem 1rem', borderRadius: 10, cursor: 'pointer',
            border: `1.5px dashed ${tierColor}60`,
            background: `${tierColor}08`, transition: 'background 0.15s',
          }}>
            <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '0.88rem', color: tierColor, letterSpacing: '0.08em' }}>
              {ally.discount_code}
            </span>
            {copied
              ? <Check size={15} color={tierColor} />
              : <Copy size={15} color={tierColor} />
            }
          </button>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.7rem 1rem', borderRadius: 10,
            background: '#f7f4f0', border: '1.5px dashed #d4cac0',
          }}>
            <Lock size={14} color="#b0a090" />
            <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: '#b0a090', flex: 1 }}>
              {TIER_LABEL[ally.min_tier] ?? 'Bronze+'} membership required
            </span>
            <Link href="/products" style={{
              fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', fontWeight: 700,
              color: 'var(--makay-peachy-rose)', textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
              Join →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AlliesPage() {
  const { isLoaded } = useUser();
  const [allies, setAllies] = useState<Ally[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    fetch('/api/allies')
      .then(r => r.ok ? r.json() : [])
      .then((d: Ally[]) => { setAllies(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [isLoaded]);

  return (
    <>
      <NavBar />
      <main style={{ minHeight: '100vh', background: 'var(--makay-warm-white, #fff8f0)', paddingBottom: '4rem' }}>

        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, var(--makay-dark-navy) 0%, #2a3a4a 100%)',
          padding: '5rem 1.5rem 4rem',
          textAlign: 'center',
        }}>
          <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#D4AF37', marginBottom: '0.75rem' }}>
            Partner Benefits
          </p>
          <h1 style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700, fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#fff', margin: '0 0 1rem', lineHeight: 1.15 }}>
            Our Allies
          </h1>
          <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.95rem', color: 'rgba(255,255,255,0.65)', maxWidth: 480, margin: '0 auto 2rem', lineHeight: 1.6 }}>
            Exclusive discounts at our partner venues, unlocked by your Makay membership tier.
          </p>
          <Link href="/products" style={{
            display: 'inline-block', fontFamily: 'var(--font-montserrat)', fontWeight: 700,
            fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em',
            padding: '0.75rem 1.75rem', borderRadius: 10, textDecoration: 'none',
            background: '#D4AF37', color: '#fff',
          }}>
            Get Membership
          </Link>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem 0' }}>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', fontFamily: 'var(--font-montserrat)', color: 'var(--makay-mauve)' }}>
              Loading partners…
            </div>
          ) : allies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', fontFamily: 'var(--font-montserrat)', color: 'var(--makay-mauve)' }}>
              No allies listed yet.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}>
              {allies.map(ally => <AllyCard key={ally.id} ally={ally} />)}
            </div>
          )}

          {/* Tier legend */}
          <div style={{
            marginTop: '3rem', padding: '1.5rem', background: '#fff',
            border: '1px solid #f0ebe4', borderRadius: 14, display: 'flex',
            gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center',
          }}>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--makay-mauve)', margin: '0 auto 0 0', alignSelf: 'center' }}>
              Access by tier
            </p>
            {Object.entries(TIER_LABEL).map(([tier, label]) => (
              <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: TIER_COLOR[tier] ?? '#ccc', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-dark-navy)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
