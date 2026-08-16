'use client';

import { useEffect, useState } from 'react';
import nextDynamic from 'next/dynamic';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import {
  Calendar, MapPin, Users, Ticket,
  Star, Award, Lock, Copy, Check,
  Percent, Umbrella, Trophy, ChevronRight,
} from 'lucide-react';
import {
  animate, stagger, createTimeline,
  onScroll, splitText, scrambleText,
} from 'animejs';
import MembershipLeadForm from '@/components/membership/MembershipLeadForm';
import '@/styles/membership.css';

export const dynamic = 'force-dynamic';

const MembershipHeroGradient = nextDynamic(
  () => import('@/components/membership/MembershipHeroGradient'),
  { ssr: false }
);

/* ── Types ──────────────────────────────────────── */
interface Event {
  id: number; title: string; description: string; event_date: string;
  location: string; image_url: string; price: number;
  capacity: number; tickets_sold: number; tags?: string;
}
interface Ally {
  id: number; name: string; logo_url: string; description: string;
  discount_percent: number; discount_code: string | null;
  min_tier: string; has_access: boolean;
}
type BenefitTier = 'bronze' | 'silver' | 'gold';

/* ── Constants ───────────────────────────────────── */
const TIER_COLOR: Record<string, string> = {
  bronze: '#CD7F32', silver: '#A8A9AD', gold: '#D4AF37', vip: '#D4A574',
};
const TIER_GLOW: Record<string, string> = {
  bronze: 'rgba(205,127,50,0.18)',
  silver: 'rgba(168,169,173,0.12)',
  gold:   'rgba(212,175,55,0.22)',
};
const AVATAR_COLORS = ['#CD7F32', '#A8A9AD', '#D4AF37', '#D4A574', '#A89080', '#8b6e5a'];
const TIER_KEY: Record<string, string> = {
  bronze: 'bronzePlus', silver: 'silverPlus', gold: 'goldPlus', vip: 'vip',
};

const BENEFIT_TIERS: Array<{
  key: BenefitTier;
  label: string;
  color: string;
  priceMonthly: string;
  priceQuarterly: string;
  benefits: Array<{ icon: typeof Percent; text: string }>;
}> = [
  {
    key: 'bronze', label: 'Bronce', color: '#CD7F32',
    priceMonthly: '$50/mes', priceQuarterly: '$150 trimestral',
    benefits: [
      { icon: Percent,  text: '10% de descuento en todos nuestros productos y servicios' },
      { icon: Star,     text: 'Priority Access: Reservas prioritarias en fechas especiales y eventos' },
      { icon: Lock,     text: 'Acceso Exclusivo: Invitación a nuestras catas y eventos cerrados' },
    ],
  },
  {
    key: 'silver', label: 'Plata', color: '#A8A9AD',
    priceMonthly: '$100/mes', priceQuarterly: '$300 trimestral',
    benefits: [
      { icon: Umbrella, text: 'Toldo GRATIS durante la temporada baja' },
      { icon: Percent,  text: '10% de descuento en todos nuestros productos y servicios' },
      { icon: Star,     text: 'Priority Access: Reservas prioritarias en fechas especiales y eventos' },
      { icon: Lock,     text: 'Acceso Exclusivo: Invitación a nuestras catas y eventos cerrados' },
    ],
  },
  {
    key: 'gold', label: 'Oro', color: '#D4AF37',
    priceMonthly: '$150/mes', priceQuarterly: '$450 trimestral',
    benefits: [
      { icon: Umbrella, text: 'Toldo GRATIS durante la temporada baja' },
      { icon: Percent,  text: '10% de descuento en todos nuestros productos y servicios' },
      { icon: Star,     text: 'Priority Access: Reservas prioritarias en fechas especiales y eventos' },
      { icon: Lock,     text: 'Acceso Exclusivo: Invitación a nuestras catas y eventos cerrados' },
      { icon: Trophy,   text: 'Acceso Deportivo GRATIS: Canchas de Beach Tennis y Voleibol de playa' },
      { icon: Award,    text: 'Descuentos Exclusivos en todas nuestras marcas aliadas' },
    ],
  },
];

const MARQUEE_WORDS = [
  'MAKAY BEACH CLUB', 'MEMBRESÍAS', 'EXPERIENCIAS', 'ALIADOS',
  'EXCLUSIVO', 'BRONCE', 'PLATA', 'ORO', 'ACCESO PREMIUM', 'BEACH TENNIS',
];

/* ── AllyCard ────────────────────────────────────── */
function AllyCard({ ally, t, ta }: {
  ally: Ally;
  t: ReturnType<typeof useTranslations<'membership'>>;
  ta: ReturnType<typeof useTranslations<'allies'>>;
}) {
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
  const tierLabel = ta(TIER_KEY[ally.min_tier] as Parameters<typeof ta>[0] ?? 'bronzePlus');
  const descKey = `allyDesc${ally.id}` as Parameters<typeof t>[0];
  let description = ally.description;
  try { const d = t(descKey); if (d && d !== descKey) description = d; } catch {}

  return (
    <div
      className="mem-ally-card"
      style={{ background: '#fff', border: '1px solid #f0ebe4', borderRadius: 16, display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.25s, transform 0.25s' }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none';
        e.currentTarget.style.setProperty('--mx', '-9999px'); e.currentTarget.style.setProperty('--my', '-9999px');
      }}
    >
      <div style={{ padding: '1.75rem 1.5rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {ally.logo_url ? (
          <img src={ally.logo_url} alt={ally.name} style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 56, height: 56, borderRadius: 12, background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontFamily: 'var(--font-playfair-display)', fontWeight: 700, fontSize: '1.1rem' }}>{initials}</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--makay-dark-navy)', margin: '0 0 0.25rem' }}>{ally.name}</p>
          <span style={{ display: 'inline-block', fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: tierColor, background: `${tierColor}18`, borderRadius: 4, padding: '0.15rem 0.5rem' }}>{tierLabel}</span>
        </div>
        <div style={{ flexShrink: 0, background: `${tierColor}15`, borderRadius: 10, padding: '0.4rem 0.7rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700, fontSize: '1.4rem', color: tierColor, margin: 0, lineHeight: 1 }}>{ally.discount_percent}%</p>
          <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.6rem', color: tierColor, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{ta('off')}</p>
        </div>
      </div>
      <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: 'var(--makay-mauve)', padding: '0 1.5rem', margin: '0 0 1.25rem', lineHeight: 1.5 }}>{description}</p>
      <div style={{ marginTop: 'auto', padding: '1rem 1.5rem 1.5rem', position: 'relative', zIndex: 3 }}>
        {ally.has_access && ally.discount_code ? (
          <button onClick={copy} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 1rem', borderRadius: 10, cursor: 'pointer', border: `1.5px dashed ${tierColor}60`, background: `${tierColor}08` }}>
            <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '0.88rem', color: tierColor, letterSpacing: '0.08em' }}>{ally.discount_code}</span>
            {copied ? <Check size={15} color={tierColor} /> : <Copy size={15} color={tierColor} />}
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1rem', borderRadius: 10, background: '#f7f4f0', border: '1.5px dashed #d4cac0' }}>
            <Lock size={14} color="#b0a090" />
            <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: '#b0a090', flex: 1 }}>{ta('membershipRequired', { tier: tierLabel })}</span>
            <Link href="/products" style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--makay-peachy-rose)', textDecoration: 'none', whiteSpace: 'nowrap' }}>{ta('join')}</Link>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────── */
export default function MembershipPage() {
  const { isLoaded } = useUser();
  const t = useTranslations('membership');
  const ta = useTranslations('allies');
  const [events, setEvents] = useState<Event[]>([]);
  const [allies, setAllies] = useState<Ally[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingAllies, setLoadingAllies] = useState(true);
  const [leadTier, setLeadTier] = useState<BenefitTier | null>(null);

  useEffect(() => {
    fetch('/api/events').then(r => r.ok ? r.json() : [])
      .then(d => { setEvents(Array.isArray(d) ? d : []); setLoadingEvents(false); })
      .catch(() => setLoadingEvents(false));
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    fetch('/api/allies').then(r => r.ok ? r.json() : [])
      .then(d => { setAllies(Array.isArray(d) ? d : []); setLoadingAllies(false); })
      .catch(() => setLoadingAllies(false));
  }, [isLoaded]);

  /* ── Animation Layer ── */
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    /* 1 — Hero: scrambleText tag + splitText title + sub + cta */
    const heroTagEl = document.querySelector<HTMLElement>('.mem-hero-tag');
    const heroTitleEl = document.querySelector<HTMLElement>('.mem-hero-title');
    const heroSubEl = document.querySelector<HTMLElement>('.mem-hero-sub');
    const heroCtaEl = document.querySelector<HTMLElement>('.mem-hero-cta');

    // Scramble the tag text
    if (heroTagEl) {
      animate(heroTagEl, {
        opacity: [0, 1],
        duration: 200,
        delay: 100,
      });
      setTimeout(() => {
        animate(heroTagEl, {
          ...scrambleText({
            text: heroTagEl.textContent ?? 'MAKAY BEACH CLUB',
            duration: 900,
            revealRate: 0.35,
            chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ·',
          }),
        });
      }, 150);
    }

    // splitText on headline — chars animate up
    if (heroTitleEl) {
      heroTitleEl.style.opacity = '1';
      const { chars } = splitText(heroTitleEl, { chars: true });
      const tl = createTimeline({ defaults: { ease: 'outExpo' } });
      tl.add(chars, {
        translateY: ['100%', '0%'],
        opacity: [0, 1],
        duration: 850,
        delay: stagger(18),
      }, 350);
      if (heroSubEl) tl.add(heroSubEl, { opacity: [0, 1], translateY: [18, 0], duration: 700 }, '-=500');
      if (heroCtaEl) tl.add(heroCtaEl, { opacity: [0, 1], scale: [0.85, 1], duration: 600, ease: 'outBack' }, '-=450');
    }

    /* 2 — CTA magnetic */
    if (heroCtaEl) {
      const onMag = (e: MouseEvent) => {
        const r = heroCtaEl.getBoundingClientRect();
        const mx = e.clientX - r.left - r.width / 2;
        const my = e.clientY - r.top - r.height / 2;
        const dist = Math.sqrt(mx * mx + my * my);
        if (dist < 100) {
          const force = (1 - dist / 100) * 14;
          const angle = Math.atan2(my, mx);
          animate(heroCtaEl, {
            translateX: Math.cos(angle) * force,
            translateY: Math.sin(angle) * force,
            duration: 120, ease: 'linear',
          });
        }
      };
      document.addEventListener('mousemove', onMag);
      heroCtaEl.addEventListener('mouseleave', () => {
        animate(heroCtaEl, { translateX: 0, translateY: 0, duration: 500, ease: 'outElastic(1, 0.6)' });
      });
    }

    /* 3 — Hero scroll fade-out */
    const heroEl = document.querySelector<HTMLElement>('.mem-hero');
    if (heroEl) {
      const onScrollFade = () => {
        const pct = Math.max(0, 1 - window.scrollY / (heroEl.offsetHeight * 0.5));
        heroEl.style.opacity = String(pct);
      };
      window.addEventListener('scroll', onScrollFade, { passive: true });
    }

    /* 4 — Stats counters (onScroll trigger) */
    const statDefs = [
      { el: '.stat-members', from: 0, to: 500, suffix: '+' },
      { el: '.stat-partners', from: 0, to: 50, suffix: '+' },
      { el: '.stat-events', from: 0, to: 12, suffix: '/año' },
    ];

    const statItems = document.querySelectorAll<HTMLElement>('.mem-stat-item');
    if (statItems.length) {
      animate(statItems, {
        opacity: [0, 1],
        translateY: [20, 0],
        delay: stagger(120),
        duration: 700,
        ease: 'outExpo',
        autoplay: onScroll({ enter: 'bottom-=5% center' }),
      });

      statDefs.forEach(({ el: sel, from, to, suffix }) => {
        const el = document.querySelector<HTMLElement>(sel);
        if (!el) return;
        const obj = { val: from };
        animate(obj, {
          val: to,
          duration: 2200,
          ease: 'outExpo',
          autoplay: onScroll({ enter: 'bottom-=5% center' }),
          onUpdate: () => { el.textContent = Math.round(obj.val) + suffix; },
        });
      });
    }

    /* 5 — Section heading reveals */
    animate('.mem-head-reveal', {
      opacity: [0, 1],
      translateY: [28, 0],
      duration: 800,
      delay: stagger(100),
      ease: 'outExpo',
      autoplay: onScroll({ enter: 'bottom-=8% center' }),
    });

    /* 6 — Tier cards: stagger entrance */
    animate('.mem-tier-card', {
      opacity: [0, 1],
      translateY: [60, 0],
      scale: [0.95, 1],
      delay: stagger(140),
      duration: 850,
      ease: 'outExpo',
      autoplay: onScroll({ enter: 'bottom-=5% center' }),
      onComplete: () => {
        // Stagger benefit items after cards land
        document.querySelectorAll<HTMLElement>('.mem-tier-card').forEach((card, ci) => {
          const items = card.querySelectorAll<HTMLElement>('.mem-benefit-item');
          animate(items, {
            opacity: [0, 1],
            translateX: [-10, 0],
            delay: stagger(60, { start: ci * 80 }),
            duration: 500,
            ease: 'outExpo',
          });
        });
      },
    });

    /* 7 — Gold card: rotating border via CSS var + anime.js */
    const goldObj = { angle: 0 };
    animate(goldObj, {
      angle: 360,
      duration: 5000,
      loop: true,
      ease: 'linear',
      onUpdate: () => {
        document.querySelectorAll<HTMLElement>('.mem-tier-card--gold').forEach(el => {
          el.style.setProperty('--border-angle', `${goldObj.angle}deg`);
        });
      },
    });

    /* 8 — Tier card 3D tilt + spotlight */
    document.querySelectorAll<HTMLElement>('.mem-tier-card').forEach(card => {
      card.addEventListener('mousemove', (e: MouseEvent) => {
        const r = card.getBoundingClientRect();
        const cx = r.width / 2;
        const cy = r.height / 2;
        const dx = (e.clientX - r.left - cx) / cx;
        const dy = (e.clientY - r.top - cy) / cy;
        card.style.transform = `perspective(900px) rotateY(${dx * 7}deg) rotateX(${-dy * 4.5}deg) scale(1.015)`;
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)';
        card.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) scale(1)';
        card.style.setProperty('--mx', '-9999px');
        card.style.setProperty('--my', '-9999px');
        setTimeout(() => { card.style.transition = ''; }, 560);
      });
    });

    /* 9 — Event cards scroll reveal */
    animate('.mem-event-card', {
      opacity: [0, 1],
      translateY: [35, 0],
      delay: stagger(80),
      duration: 700,
      ease: 'outExpo',
      autoplay: onScroll({ enter: 'bottom-=10% center' }),
    });

    /* 10 — Ally cards scroll reveal */
    animate('.mem-ally-card', {
      opacity: [0, 1],
      translateY: [30, 0],
      delay: stagger(60),
      duration: 650,
      ease: 'outExpo',
      autoplay: onScroll({ enter: 'bottom-=10% center' }),
    });
  }, []);

  /* ── Render ─────────────────────────────────────── */
  return (
    <main>
      {/* ─── 1. Hero ────────────────────────────────── */}
      <section className="mem-hero">
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <MembershipHeroGradient />
        </div>
        <div className="mem-hero-grain" />
        <div className="mem-orb mem-orb-1" />
        <div className="mem-orb mem-orb-2" />
        <div className="mem-orb mem-orb-3" />

        <div className="mem-hero-content">
          <p className="mem-hero-tag">{t('heroTag')}</p>
          <h1 className="mem-hero-title">{t('heroTitle')}</h1>
          <p className="mem-hero-sub">{t('heroParagraph')}</p>
          <button
            className="mem-hero-cta"
            onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Ver membresías <ChevronRight size={16} />
          </button>
        </div>

        {/* Wave → dark marquee */}
        <div className="mem-wave-divider">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 60" preserveAspectRatio="none"
               style={{ display: 'block', width: '100%', height: 60 }}>
            <path d="M0,60 C360,10 1080,55 1440,20 L1440,60 Z" fill="#0a0603" />
          </svg>
        </div>
      </section>

      {/* ─── 2. Marquee Strip ───────────────────────── */}
      <div className="mem-marquee" aria-hidden="true">
        <div className="mem-marquee-track">
          {/* Duplicate for seamless loop */}
          {[...MARQUEE_WORDS, ...MARQUEE_WORDS].map((word, i) => (
            <span key={i} className="mem-marquee-item">
              {word} <span className="mem-marquee-dot">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ─── 3. Stats Strip ─────────────────────────── */}
      <section className="mem-stats">
        <div className="mem-stats-inner">
          <div className="mem-stat-item">
            <span className="mem-stat-number stat-members">0+</span>
            <span className="mem-stat-label">Miembros activos</span>
          </div>
          <div className="mem-stat-item">
            <span className="mem-stat-number stat-partners">0+</span>
            <span className="mem-stat-label">Aliados exclusivos</span>
          </div>
          <div className="mem-stat-item">
            <span className="mem-stat-number stat-events">0/año</span>
            <span className="mem-stat-label">Eventos al año</span>
          </div>
        </div>
      </section>

      {/* ─── 4. Desbloquea tus Beneficios (DARK) ────── */}
      <section id="benefits" className="mem-benefits">
        <div className="mem-benefits-glow" />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div className="mem-section-head mem-head-reveal">
            <p className="mem-section-eyebrow" style={{ color: 'var(--makay-peachy-rose)' }}>Membresías</p>
            <h2 className="mem-section-title">Desbloquea tus Beneficios</h2>
            <p className="mem-section-sub">Elige el nivel que mejor se adapta a ti y empieza a disfrutar del club.</p>
          </div>

          <div className="mem-tier-grid">
            {BENEFIT_TIERS.map(tier => (
              <button
                key={tier.key}
                className={`mem-tier-card${tier.key === 'gold' ? ' mem-tier-card--gold' : ''}`}
                onClick={() => setLeadTier(tier.key)}
              >
                {tier.key === 'gold' && <div className="mem-popular-badge">Más Popular</div>}

                {/* Ambient blob */}
                <div
                  className="mem-tier-blob"
                  style={{ background: `radial-gradient(circle, ${TIER_GLOW[tier.key]} 0%, transparent 70%)` }}
                />

                {/* Card header */}
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: tier.color, margin: '0 0 0.35rem' }}>Membresía</p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '2rem', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1 }}>{tier.label}</h3>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.1rem', fontWeight: 700, color: tier.color, margin: 0, lineHeight: 1.1 }}>{tier.priceMonthly}</p>
                      <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.62rem', fontWeight: 600, color: `${tier.color}80`, margin: 0 }}>{tier.priceQuarterly}</p>
                    </div>
                  </div>
                </div>

                <div className="mem-tier-divider" />

                {/* Benefits */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginBottom: '1.75rem', position: 'relative', zIndex: 2 }}>
                  {tier.benefits.map(({ icon: Icon, text }) => (
                    <div key={text} className="mem-benefit-item">
                      <Icon size={14} color={tier.color} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.83rem', color: 'rgba(255,255,255,0.78)', lineHeight: 1.45 }}>{text}</span>
                    </div>
                  ))}
                </div>

                {/* Footer CTA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', position: 'relative', zIndex: 2 }}>
                  <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.85rem', fontWeight: 700, color: tier.color }}>Ver opciones</span>
                  <ChevronRight size={14} color={tier.color} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. Próximos Eventos (LIGHT) ────────────── */}
      <section id="events" style={{ background: 'var(--makay-premium-cream)', padding: 'clamp(5rem, 10vw, 7rem) 1.25rem', position: 'relative' }}>
        {/* Wave from dark → light */}
        <div className="mem-light-section-wave">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 60" preserveAspectRatio="none"
               style={{ display: 'block', width: '100%', height: 60 }}>
            <path d="M0,0 C480,55 960,5 1440,40 L1440,0 Z" fill="#140a05" />
          </svg>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', paddingTop: '2rem' }}>
          <div className="mem-section-head mem-head-reveal" style={{ marginBottom: '3rem' }}>
            <h2 className="mem-section-title" style={{ color: 'var(--makay-dark-navy)' }}>{t('eventsTitle')}</h2>
            <p className="mem-section-sub" style={{ color: 'var(--makay-mauve)' }}>{t('eventsSubtitle')}</p>
          </div>

          {loadingEvents ? (
            <p style={{ textAlign: 'center', color: 'var(--makay-mauve)', fontFamily: 'var(--font-montserrat)', padding: '3rem' }}>{t('loadingEvents')}</p>
          ) : events.length === 0 ? (
            <div className="mem-events-empty">
              <Calendar size={72} className="mem-events-empty-icon" style={{ color: '#D4A574' }} />
              <p className="mem-events-empty-title">{t('noEvents')}</p>
              <p className="mem-events-empty-hint">{t('noEventsHint')}</p>
            </div>
          ) : (
            <div className="mem-event-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {events.map(ev => {
                const remaining = ev.capacity - ev.tickets_sold;
                const soldOut = remaining <= 0;
                const soldPct = Math.round((ev.tickets_sold / ev.capacity) * 100);
                const tags = ev.tags ? ev.tags.split(',').map(s => s.trim()).filter(Boolean) : [];
                return (
                  <article key={ev.id} className="mem-event-card" style={{ background: '#fff', border: '1px solid var(--makay-sand-cream)', borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'relative', height: 200, background: 'linear-gradient(135deg, var(--makay-sand-cream), var(--makay-peachy-rose))' }}>
                      {ev.image_url && <img src={ev.image_url} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                      {!ev.image_url && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={48} color="rgba(255,255,255,0.6)" /></div>}
                      <div style={{ position: 'absolute', top: '0.875rem', right: '0.875rem', background: 'rgba(28,22,17,0.85)', backdropFilter: 'blur(8px)', color: '#fff', padding: '0.3rem 0.75rem', borderRadius: '100px', fontFamily: 'var(--font-playfair-display)', fontSize: '0.95rem', fontWeight: 700 }}>
                        {Number(ev.price) === 0 ? t('free') : `$${Number(ev.price).toFixed(2)}`}
                      </div>
                      {soldOut && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-montserrat)', fontWeight: 700, color: '#fff', fontSize: '1rem', letterSpacing: '0.1em' }}>{t('soldOut')}</div>}
                    </div>
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.75rem' }}>
                      {tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {tags.map(tag => <span key={tag} style={{ padding: '0.15rem 0.55rem', background: 'rgba(212,165,116,0.12)', borderRadius: 100, fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', fontWeight: 600, color: 'var(--makay-peachy-rose)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tag}</span>)}
                        </div>
                      )}
                      <h3 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--makay-dark-navy)', margin: 0, lineHeight: 1.2 }}>{ev.title}</h3>
                      <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: 'var(--makay-mauve)', margin: 0, lineHeight: 1.6, flex: 1 }}>{ev.description?.slice(0, 120)}{ev.description?.length > 120 ? '…' : ''}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {ev.event_date && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-dark-navy)' }}><Calendar size={13} style={{ color: 'var(--makay-peachy-rose)', flexShrink: 0 }} />{new Date(ev.event_date).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>}
                        {ev.location && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-mauve)' }}><MapPin size={13} style={{ flexShrink: 0 }} /> {ev.location}</div>}
                      </div>
                      <div>
                        <div style={{ height: 4, background: 'var(--makay-sand-cream)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(soldPct, 100)}%`, borderRadius: 2, background: soldPct >= 90 ? '#ef4444' : soldPct >= 60 ? '#f59e0b' : '#10b981' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', color: 'var(--makay-mauve)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Users size={10} />{ev.tickets_sold} {t('going')}</span>
                          <span>{soldOut ? t('soldOutBtn') : `${remaining} ${t('left')}`}</span>
                        </div>
                      </div>
                      <Link href={`/events/${ev.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.75rem', borderRadius: 12, background: soldOut ? 'var(--makay-sand-cream)' : 'var(--makay-dark-navy)', color: soldOut ? 'var(--makay-mauve)' : '#fff', fontFamily: 'var(--font-montserrat)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', pointerEvents: soldOut ? 'none' : 'auto' }}>
                        <Ticket size={14} /> {soldOut ? t('soldOutBtn') : t('getTickets')}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── 6. Nuestros Aliados ─────────────────────── */}
      <section id="partners" style={{ background: 'var(--makay-warm-white, #fff8f0)', padding: 'clamp(4rem, 8vw, 6rem) 1.25rem', position: 'relative', overflow: 'hidden' }}>
        <div className="mem-allies-bg-orb" />
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
          <div className="mem-section-head mem-head-reveal">
            <p className="mem-section-eyebrow" style={{ color: '#D4AF37' }}>{ta('tag')}</p>
            <h2 className="mem-section-title" style={{ color: 'var(--makay-dark-navy)' }}>{ta('title')}</h2>
            <p className="mem-section-sub" style={{ color: 'var(--makay-mauve)' }}>{ta('subtitle')}</p>
          </div>

          {loadingAllies ? (
            <p style={{ textAlign: 'center', color: 'var(--makay-mauve)', fontFamily: 'var(--font-montserrat)', padding: '2rem' }}>{ta('loading')}</p>
          ) : allies.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--makay-mauve)', fontFamily: 'var(--font-montserrat)', padding: '2rem' }}>{ta('noAllies')}</p>
          ) : (
            <div className="mem-ally-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {allies.map(ally => <AllyCard key={ally.id} ally={ally} t={t} ta={ta} />)}
            </div>
          )}

          <div style={{ marginTop: '3rem', padding: '1.5rem', background: '#fff', border: '1px solid #f0ebe4', borderRadius: 14, display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--makay-mauve)', margin: '0 auto 0 0', alignSelf: 'center' }}>{ta('accessByTier')}</p>
            {Object.entries(TIER_KEY).map(([tier, key]) => (
              <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: TIER_COLOR[tier] ?? '#ccc', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-dark-navy)' }}>{ta(key as Parameters<typeof ta>[0])}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {leadTier && (
        <MembershipLeadForm tier={leadTier} onClose={() => setLeadTier(null)} />
      )}
    </main>
  );
}
