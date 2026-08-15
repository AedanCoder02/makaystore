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
import { animate, stagger, createTimeline } from 'animejs';
import MembershipLeadForm from '@/components/membership/MembershipLeadForm';
import '@/styles/membership.css';

export const dynamic = 'force-dynamic';

const MembershipHeroGradient = nextDynamic(
  () => import('@/components/membership/MembershipHeroGradient'),
  { ssr: false }
);

/* ── Types ─────────────────────────────────────── */
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

/* ── Constants ──────────────────────────────────── */
const TIER_COLOR: Record<string, string> = {
  bronze: '#CD7F32', silver: '#A8A9AD', gold: '#D4AF37', vip: '#D4A574',
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
    key: 'bronze',
    label: 'Bronce',
    color: '#CD7F32',
    priceMonthly: '$50/mes',
    priceQuarterly: '$150 trimestral',
    benefits: [
      { icon: Percent,  text: '10% de descuento en todos nuestros productos y servicios' },
      { icon: Star,     text: 'Priority Access: Reservas prioritarias en fechas especiales y eventos' },
      { icon: Lock,     text: 'Acceso Exclusivo: Invitación a nuestras catas y eventos cerrados' },
    ],
  },
  {
    key: 'silver',
    label: 'Plata',
    color: '#A8A9AD',
    priceMonthly: '$100/mes',
    priceQuarterly: '$300 trimestral',
    benefits: [
      { icon: Umbrella, text: 'Toldo GRATIS durante la temporada baja' },
      { icon: Percent,  text: '10% de descuento en todos nuestros productos y servicios' },
      { icon: Star,     text: 'Priority Access: Reservas prioritarias en fechas especiales y eventos' },
      { icon: Lock,     text: 'Acceso Exclusivo: Invitación a nuestras catas y eventos cerrados' },
    ],
  },
  {
    key: 'gold',
    label: 'Oro',
    color: '#D4AF37',
    priceMonthly: '$150/mes',
    priceQuarterly: '$450 trimestral',
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

/* ── Ally Card ──────────────────────────────────── */
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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };
  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty('--mx', '-9999px');
    e.currentTarget.style.setProperty('--my', '-9999px');
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.transform = 'none';
  };
  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.10)';
    e.currentTarget.style.transform = 'translateY(-3px)';
  };

  return (
    <div
      className="mem-ally-card"
      style={{
        background: '#fff',
        border: '1px solid #f0ebe4',
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.25s, transform 0.25s',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div style={{ padding: '1.75rem 1.5rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {ally.logo_url ? (
          <img src={ally.logo_url} alt={ally.name} style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 56, height: 56, borderRadius: 12, background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontFamily: 'var(--font-playfair-display)', fontWeight: 700, fontSize: '1.1rem' }}>
            {initials}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--makay-dark-navy)', margin: '0 0 0.25rem' }}>{ally.name}</p>
          <span style={{ display: 'inline-block', fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: tierColor, background: `${tierColor}18`, borderRadius: 4, padding: '0.15rem 0.5rem' }}>
            {tierLabel}
          </span>
        </div>
        <div style={{ flexShrink: 0, background: `${tierColor}15`, borderRadius: 10, padding: '0.4rem 0.7rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700, fontSize: '1.4rem', color: tierColor, margin: 0, lineHeight: 1 }}>{ally.discount_percent}%</p>
          <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.6rem', color: tierColor, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{ta('off')}</p>
        </div>
      </div>

      <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: 'var(--makay-mauve)', padding: '0 1.5rem', margin: '0 0 1.25rem', lineHeight: 1.5 }}>
        {description}
      </p>

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
            <Link href="/products" style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--makay-peachy-rose)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              {ta('join')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────── */
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
    fetch('/api/events')
      .then(r => r.ok ? r.json() : [])
      .then(d => { setEvents(Array.isArray(d) ? d : []); setLoadingEvents(false); })
      .catch(() => setLoadingEvents(false));
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    fetch('/api/allies')
      .then(r => r.ok ? r.json() : [])
      .then(d => { setAllies(Array.isArray(d) ? d : []); setLoadingAllies(false); })
      .catch(() => setLoadingAllies(false));
  }, [isLoaded]);

  /* ── Animations ── */
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    /* 1 — Hero: tag → title chars → sub → cta */
    const heroTag = document.querySelector('.mem-hero-tag') as HTMLElement | null;
    const heroTitle = document.querySelector('.mem-hero-title') as HTMLElement | null;
    const heroSub = document.querySelector('.mem-hero-sub') as HTMLElement | null;
    const heroCta = document.querySelector('.mem-hero-cta') as HTMLElement | null;

    if (heroTag) animate(heroTag, { opacity: [0, 1], translateY: [10, 0], duration: 500, delay: 150, ease: 'outExpo' });

    if (heroTitle) {
      // Split title text into char spans (matches existing project pattern)
      const text = heroTitle.innerText;
      heroTitle.innerHTML = text
        .split('')
        .map(c => c === ' ' ? '<span class="word-space"> </span>' : `<span class="char">${c === '\n' ? '<br>' : c}</span>`)
        .join('');
      heroTitle.style.opacity = '1';

      const tl = createTimeline({ defaults: { ease: 'outExpo' } });
      tl.add(heroTitle.querySelectorAll('.char'), {
        opacity: [0, 1],
        translateY: [32, 0],
        duration: 750,
        delay: stagger(22),
      }, 300);

      if (heroSub) {
        tl.add(heroSub, { opacity: [0, 1], translateY: [18, 0], duration: 600 }, '-=400');
      }
      if (heroCta) {
        tl.add(heroCta, { opacity: [0, 1], scale: [0.88, 1], duration: 550, ease: 'outBack' }, '-=350');
      }
    }

    /* 2 — Hero CTA magnetic */
    if (heroCta) {
      const handleMag = (e: MouseEvent) => {
        const rect = heroCta.getBoundingClientRect();
        const mx = e.clientX - rect.left - rect.width / 2;
        const my = e.clientY - rect.top - rect.height / 2;
        const dist = Math.sqrt(mx * mx + my * my);
        if (dist < 90) {
          const force = (1 - dist / 90) * 12;
          const angle = Math.atan2(my, mx);
          animate(heroCta, {
            translateX: Math.cos(angle) * force,
            translateY: Math.sin(angle) * force,
            duration: 100,
            ease: 'linear',
          });
        }
      };
      const handleMagLeave = () => {
        animate(heroCta, { translateX: 0, translateY: 0, duration: 400, ease: 'outElastic(1, 0.5)' });
      };
      document.addEventListener('mousemove', handleMag);
      heroCta.addEventListener('mouseleave', handleMagLeave);
    }

    /* 3 — Scroll fade-out on hero */
    const heroEl = document.querySelector('.mem-hero') as HTMLElement | null;
    if (heroEl) {
      const onScroll = () => {
        const pct = Math.max(0, 1 - window.scrollY / (heroEl.offsetHeight * 0.5));
        heroEl.style.opacity = String(pct);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* 4 — Section heading reveals */
    const headObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animate(entry.target as HTMLElement, {
          opacity: [0, 1],
          translateY: [24, 0],
          duration: 700,
          ease: 'outExpo',
        });
        headObs.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.mem-head-reveal').forEach(el => headObs.observe(el));

    /* 5 — Tier cards: stagger on scroll + 3D tilt + spotlight */
    const tierGrid = document.querySelector('.mem-tier-grid');
    if (tierGrid) {
      const tierObs = new IntersectionObserver((entries) => {
        if (!entries.some(e => e.isIntersecting)) return;
        tierObs.disconnect();

        const cards = document.querySelectorAll<HTMLElement>('.mem-tier-card');
        animate(cards, {
          opacity: [0, 1],
          translateY: [50, 0],
          scale: [0.95, 1],
          delay: stagger(130),
          duration: 750,
          ease: 'outExpo',
          onComplete: () => {
            // Start gold pulse ring after card is visible
            const goldCard = document.querySelector('.mem-tier-card--gold');
            if (goldCard) goldCard.classList.add('is-revealed');

            // Stagger benefit items within each card
            cards.forEach(card => {
              const items = card.querySelectorAll<HTMLElement>('.mem-benefit-item');
              animate(items, {
                opacity: [0, 1],
                translateX: [-8, 0],
                delay: stagger(70, { start: 200 }),
                duration: 500,
                ease: 'outExpo',
              });
            });
          },
        });
      }, { threshold: 0.1 });
      tierObs.observe(tierGrid);
    }

    /* 6 — Tier card: 3D tilt + spotlight */
    const setupTierCard = (card: HTMLElement) => {
      card.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const dx = (e.clientX - rect.left - cx) / cx;
        const dy = (e.clientY - rect.top - cy) / cy;

        card.style.transform = `perspective(800px) rotateY(${dx * 6}deg) rotateX(${-dy * 4}deg) scale(1.01)`;
        card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        card.style.setProperty('--my', `${e.clientY - rect.top}px`);
      });

      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        card.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)';
        card.style.setProperty('--mx', '-9999px');
        card.style.setProperty('--my', '-9999px');
        setTimeout(() => { card.style.transition = ''; }, 500);
      });
    };

    document.querySelectorAll<HTMLElement>('.mem-tier-card').forEach(setupTierCard);

    /* 7 — Event cards: stagger on scroll */
    const eventGrid = document.querySelector('.mem-event-grid');
    if (eventGrid) {
      const eventObs = new IntersectionObserver((entries) => {
        if (!entries.some(e => e.isIntersecting)) return;
        eventObs.disconnect();
        const cards = document.querySelectorAll<HTMLElement>('.mem-event-card');
        animate(cards, {
          opacity: [0, 1],
          translateY: [35, 0],
          delay: stagger(90),
          duration: 650,
          ease: 'outExpo',
        });
      }, { threshold: 0.1 });
      eventObs.observe(eventGrid);
    }

    /* 8 — Ally cards: stagger on scroll */
    const allyGrid = document.querySelector('.mem-ally-grid');
    if (allyGrid) {
      const allyObs = new IntersectionObserver((entries) => {
        if (!entries.some(e => e.isIntersecting)) return;
        allyObs.disconnect();
        const cards = document.querySelectorAll<HTMLElement>('.mem-ally-card');
        animate(cards, {
          opacity: [0, 1],
          translateY: [30, 0],
          delay: stagger(65),
          duration: 600,
          ease: 'outExpo',
        });
      }, { threshold: 0.1 });
      allyObs.observe(allyGrid);
    }
  }, []);

  /* ── Render ── */
  return (
    <main>
      {/* ── 1. Hero ─────────────────────────────── */}
      <section className="mem-hero">
        {/* ShaderGradient background — dynamic, no SSR */}
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          <MembershipHeroGradient />
        </div>

        {/* Grain overlay */}
        <div className="mem-hero-grain" />

        {/* Floating glow orbs */}
        <div className="mem-orb mem-orb-1" />
        <div className="mem-orb mem-orb-2" />
        <div className="mem-orb mem-orb-3" />

        {/* Content */}
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

        {/* SVG wave → cream section below */}
        <div className="mem-wave-divider">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 72"
            preserveAspectRatio="none"
            style={{ display: 'block', width: '100%', height: 72 }}
          >
            <path
              d="M0,72 C240,20 480,60 720,36 C960,12 1200,56 1440,28 L1440,72 Z"
              fill="var(--makay-premium-cream, #f9f4ef)"
            />
          </svg>
        </div>
      </section>

      {/* ── 2. Desbloquea tus Beneficios ─────────── */}
      <section
        id="benefits"
        style={{
          background: 'var(--makay-premium-cream)',
          padding: 'clamp(5rem, 10vw, 8rem) 1.25rem',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
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
                {tier.key === 'gold' && (
                  <div className="mem-popular-badge">Más Popular</div>
                )}

                {/* Corner glow blob */}
                <div style={{
                  position: 'absolute', top: '-30%', right: '-15%',
                  width: '60%', height: '60%', borderRadius: '50%',
                  background: `radial-gradient(circle, ${tier.color}18 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }} />

                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', position: 'relative', zIndex: 2 }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: tier.color, margin: '0 0 0.2rem' }}>Membresía</p>
                    <h3 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--makay-dark-navy)', margin: 0 }}>{tier.label}</h3>
                  </div>
                  <div style={{ background: `${tier.color}15`, borderRadius: 12, padding: '0.5rem 0.85rem', textAlign: 'right' }}>
                    <p style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1rem', fontWeight: 700, color: tier.color, margin: 0, lineHeight: 1.1 }}>{tier.priceMonthly}</p>
                    <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.62rem', fontWeight: 600, color: `${tier.color}99`, margin: 0 }}>{tier.priceQuarterly}</p>
                  </div>
                </div>

                {/* Benefits list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.75rem', position: 'relative', zIndex: 2 }}>
                  {tier.benefits.map(({ icon: Icon, text }) => (
                    <div key={text} className="mem-benefit-item">
                      <Icon size={14} color={tier.color} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.83rem', color: 'var(--makay-dark-navy)', lineHeight: 1.45 }}>{text}</span>
                    </div>
                  ))}
                </div>

                {/* CTA link */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', position: 'relative', zIndex: 2 }}>
                  <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.85rem', fontWeight: 700, color: tier.color }}>Ver opciones</span>
                  <ChevronRight size={14} color={tier.color} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Próximos Eventos ──────────────────── */}
      <section id="events" style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(4rem, 8vw, 6rem) 1.25rem' }}>
        <div className="mem-section-head mem-head-reveal" style={{ marginBottom: '3rem' }}>
          <h2 className="mem-section-title">{t('eventsTitle')}</h2>
          <p className="mem-section-sub">{t('eventsSubtitle')}</p>
        </div>

        {loadingEvents ? (
          <p style={{ textAlign: 'center', color: 'var(--makay-mauve)', fontFamily: 'var(--font-montserrat)', padding: '3rem' }}>{t('loadingEvents')}</p>
        ) : events.length === 0 ? (
          <div className="mem-events-empty">
            <Calendar
              size={64}
              className="mem-events-empty-icon"
              style={{ color: 'var(--makay-sand-cream)' }}
            />
            <p className="mem-events-empty-title">{t('noEvents')}</p>
            <p className="mem-events-empty-hint">{t('noEventsHint')}</p>
          </div>
        ) : (
          <div
            className="mem-event-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}
          >
            {events.map(ev => {
              const remaining = ev.capacity - ev.tickets_sold;
              const soldOut = remaining <= 0;
              const soldPct = Math.round((ev.tickets_sold / ev.capacity) * 100);
              const tags = ev.tags ? ev.tags.split(',').map(s => s.trim()).filter(Boolean) : [];
              return (
                <article key={ev.id} className="mem-event-card" style={{ background: '#fff', border: '1px solid var(--makay-sand-cream)', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
                        {tags.map(tag => <span key={tag} style={{ padding: '0.15rem 0.55rem', background: 'rgba(212,165,116,0.12)', borderRadius: '100px', fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', fontWeight: 600, color: 'var(--makay-peachy-rose)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tag}</span>)}
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
                    <Link href={`/events/${ev.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.75rem', borderRadius: '12px', background: soldOut ? 'var(--makay-sand-cream)' : 'var(--makay-dark-navy)', color: soldOut ? 'var(--makay-mauve)' : '#fff', fontFamily: 'var(--font-montserrat)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', pointerEvents: soldOut ? 'none' : 'auto' }}>
                      <Ticket size={14} /> {soldOut ? t('soldOutBtn') : t('getTickets')}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 4. Nuestros Aliados ──────────────────── */}
      <section id="partners" style={{ background: 'var(--makay-warm-white, #fff8f0)', padding: 'clamp(4rem, 8vw, 6rem) 1.25rem', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative bg glow */}
        <div className="mem-allies-bg-orb" />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
          <div className="mem-section-head mem-head-reveal">
            <p className="mem-section-eyebrow" style={{ color: '#D4AF37' }}>{ta('tag')}</p>
            <h2 className="mem-section-title">{ta('title')}</h2>
            <p className="mem-section-sub">{ta('subtitle')}</p>
          </div>

          {loadingAllies ? (
            <p style={{ textAlign: 'center', color: 'var(--makay-mauve)', fontFamily: 'var(--font-montserrat)', padding: '2rem' }}>{ta('loading')}</p>
          ) : allies.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--makay-mauve)', fontFamily: 'var(--font-montserrat)', padding: '2rem' }}>{ta('noAllies')}</p>
          ) : (
            <div
              className="mem-ally-grid"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}
            >
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

      {/* Lead form modal */}
      {leadTier && (
        <MembershipLeadForm
          tier={leadTier}
          onClose={() => setLeadTier(null)}
        />
      )}
    </main>
  );
}
