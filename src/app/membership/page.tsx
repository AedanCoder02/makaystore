'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import {
  Calendar, MapPin, Users, Ticket,
  Star, Award, Lock, Copy, Check,
  Percent, Umbrella, Trophy, ChevronRight,
} from 'lucide-react';
import { animate, stagger } from 'animejs';
import MembershipLeadForm from '@/components/membership/MembershipLeadForm';
import '@/styles/membership.css';

export const dynamic = 'force-dynamic';

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

const TIER_COLOR: Record<string, string> = {
  bronze: '#CD7F32', silver: '#A8A9AD', gold: '#D4AF37', vip: '#D4A574',
};
const TIER_GLOW: Record<string, string> = {
  bronze: 'rgba(205,127,50,0.22)',
  silver: 'rgba(168,169,173,0.14)',
  gold:   'rgba(212,175,55,0.28)',
};
const AVATAR_COLORS = ['#CD7F32', '#A8A9AD', '#D4AF37', '#D4A574', '#A89080', '#8b6e5a'];
const TIER_KEY: Record<string, string> = {
  bronze: 'bronzePlus', silver: 'silverPlus', gold: 'goldPlus', vip: 'vip',
};

const BENEFIT_TIERS: Array<{
  key: BenefitTier; label: string; color: string;
  priceMonthly: string; priceQuarterly: string;
  benefits: Array<{ icon: typeof Percent; text: string }>;
}> = [
  {
    key: 'bronze', label: 'Bronce', color: '#CD7F32',
    priceMonthly: '$50/mes', priceQuarterly: '$150 trimestral',
    benefits: [
      { icon: Percent, text: '10% de descuento en todos nuestros productos y servicios' },
      { icon: Star,    text: 'Priority Access: Reservas prioritarias en fechas especiales y eventos' },
      { icon: Lock,    text: 'Acceso Exclusivo: Invitación a nuestras catas y eventos cerrados' },
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

/* ── Particle burst ──────────────────────────────── */
function spawnBurst(container: HTMLElement, color: string) {
  for (let i = 0; i < 18; i++) {
    const dot = document.createElement('div');
    const size = Math.random() * 7 + 3;
    const angle = (i / 18) * 360 + Math.random() * 20;
    const dist  = 55 + Math.random() * 70;
    dot.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;background:${color};top:-${size/2}px;left:-${size/2}px;pointer-events:none;`;
    container.appendChild(dot);
    animate(dot, {
      translateX: Math.cos((angle * Math.PI) / 180) * dist,
      translateY: Math.sin((angle * Math.PI) / 180) * dist,
      opacity: [1, 0],
      scale: [0, 1.6, 0],
      duration: 650 + Math.random() * 350,
      ease: 'outExpo',
      onComplete: () => dot.remove(),
    });
  }
}

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
  let description = ally.description;
  try {
    const descKey = `allyDesc${ally.id}` as Parameters<typeof t>[0];
    const d = t(descKey);
    if (d && d !== descKey) description = d;
  } catch {}

  return (
    <div
      className="mem-ally-card"
      style={{ background: '#fff', border: '1px solid #f0ebe4', borderRadius: 18, display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.25s, transform 0.25s' }}
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none';
        e.currentTarget.style.setProperty('--mx', '-9999px'); e.currentTarget.style.setProperty('--my', '-9999px');
      }}
    >
      <div style={{ padding: '1.75rem 1.5rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {ally.logo_url
          ? <img src={ally.logo_url} alt={ally.name} style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: 56, height: 56, borderRadius: 12, background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontFamily: 'var(--font-playfair-display)', fontWeight: 700, fontSize: '1.1rem' }}>{initials}</div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--makay-dark-navy)', margin: '0 0 0.25rem' }}>{ally.name}</p>
          <span style={{ display: 'inline-block', fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: tierColor, background: `${tierColor}18`, borderRadius: 4, padding: '0.15rem 0.5rem' }}>{tierLabel}</span>
        </div>
        <div style={{ flexShrink: 0, background: `${tierColor}15`, borderRadius: 12, padding: '0.45rem 0.75rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700, fontSize: '1.5rem', color: tierColor, margin: 0, lineHeight: 1 }}>{ally.discount_percent}%</p>
          <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.6rem', color: tierColor, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{ta('off')}</p>
        </div>
      </div>
      <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: 'var(--makay-mauve)', padding: '0 1.5rem', margin: '0 0 1.25rem', lineHeight: 1.55 }}>{description}</p>
      <div style={{ marginTop: 'auto', padding: '1rem 1.5rem 1.5rem', position: 'relative', zIndex: 3 }}>
        {ally.has_access && ally.discount_code ? (
          <button onClick={copy} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: 10, cursor: 'pointer', border: `1.5px dashed ${tierColor}60`, background: `${tierColor}08` }}>
            <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '0.88rem', color: tierColor, letterSpacing: '0.08em' }}>{ally.discount_code}</span>
            {copied ? <Check size={15} color={tierColor} /> : <Copy size={15} color={tierColor} />}
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1rem', borderRadius: 10, background: '#f7f4f0', border: '1.5px dashed #d4cac0' }}>
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
  const [events, setEvents]           = useState<Event[]>([]);
  const [allies, setAllies]           = useState<Ally[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingAllies, setLoadingAllies] = useState(true);
  const [leadTier, setLeadTier]       = useState<BenefitTier | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

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

  useEffect(() => {
    let rafId = 0;
    let goldAnim: ReturnType<typeof animate> | null = null;
    let io: IntersectionObserver | null = null;
    let cleanupScroll: (() => void) | null = null;
    let cleanupResize: (() => void) | null = null;

    // Double-rAF: guarantees all layout is painted and dimensions are real
    requestAnimationFrame(() => requestAnimationFrame(() => {

      /* ══ 1. CANVAS PARTICLES ══ */
      const canvas = canvasRef.current;
      if (canvas) {
        const W = () => window.innerWidth;
        const H = () => Math.max(window.innerHeight, canvas.parentElement?.offsetHeight ?? window.innerHeight);

        canvas.width  = W();
        canvas.height = H();

        const ctx = canvas.getContext('2d')!;

        type P = { x: number; y: number; r: number; op: number; spd: number; drift: number; hue: number };
        const pts: P[] = Array.from({ length: 90 }, () => ({
          x:     Math.random() * canvas.width,
          y:     Math.random() * canvas.height,
          r:     Math.random() * 3 + 1,
          op:    Math.random() * 0.6 + 0.15,
          spd:   Math.random() * 0.6 + 0.2,
          drift: (Math.random() - 0.5) * 0.35,
          hue:   28 + Math.random() * 28,
        }));

        type S = { x: number; y: number; sz: number; life: number; max: number };
        const stars: S[] = Array.from({ length: 14 }, () => ({
          x:    Math.random() * canvas.width,
          y:    Math.random() * canvas.height,
          sz:   Math.random() * 6 + 2,
          life: Math.random() * 200,
          max:  100 + Math.random() * 200,
        }));

        const resizeFn = () => { canvas.width = W(); canvas.height = H(); };
        window.addEventListener('resize', resizeFn);
        cleanupResize = () => window.removeEventListener('resize', resizeFn);

        const draw = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          pts.forEach(p => {
            p.y -= p.spd; p.x += p.drift;
            if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
            if (p.x < -10) p.x = canvas.width + 10;
            if (p.x > canvas.width + 10) p.x = -10;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue},85%,68%,${p.op})`;
            ctx.fill();

            // glow halo
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue},85%,68%,${p.op * 0.12})`;
            ctx.fill();
          });

          stars.forEach(s => {
            s.life++;
            const phase = s.life / s.max;
            const alpha = (phase < 0.5 ? phase * 2 : 1 - (phase - 0.5) * 2) * 0.7;
            if (s.life >= s.max) {
              s.life = 0;
              s.x = Math.random() * canvas.width;
              s.y = Math.random() * canvas.height;
              s.sz = Math.random() * 6 + 2;
            }
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = '#D4AF37';
            ctx.lineWidth = 1.2;
            ctx.translate(s.x, s.y);
            for (let a = 0; a < 4; a++) {
              ctx.beginPath(); ctx.moveTo(0, -s.sz); ctx.lineTo(0, s.sz); ctx.stroke();
              ctx.rotate(Math.PI / 4);
            }
            ctx.restore();
          });

          rafId = requestAnimationFrame(draw);
        };
        rafId = requestAnimationFrame(draw);
      }

      /* ══ 2. SVG PATH DRAW-IN (CSS class toggle — no anime.js needed) ══ */
      document.querySelectorAll<SVGPathElement>('.mem-hero-path').forEach((path, i) => {
        try {
          const len = path.getTotalLength();
          path.style.strokeDasharray  = `${len}`;
          path.style.strokeDashoffset = `${len}`;
          path.style.transition = `stroke-dashoffset ${2 + i * 0.25}s cubic-bezier(0.25,1,0.5,1) ${0.3 + i * 0.15}s`;
          // next tick so transition is active
          requestAnimationFrame(() => { path.style.strokeDashoffset = '0'; });
        } catch {}
      });

      /* ══ 3. MAGNETIC CTA ══ */
      const cta = document.querySelector<HTMLElement>('.mem-hero-cta');
      if (cta) {
        const onMag = (e: MouseEvent) => {
          const r = cta.getBoundingClientRect();
          const mx = e.clientX - r.left - r.width / 2;
          const my = e.clientY - r.top - r.height / 2;
          const dist = Math.hypot(mx, my);
          if (dist < 130) {
            const force = (1 - dist / 130) * 20;
            const ang = Math.atan2(my, mx);
            try {
              animate(cta, { translateX: Math.cos(ang) * force, translateY: Math.sin(ang) * force, duration: 90, ease: 'linear' });
            } catch {}
          }
        };
        document.addEventListener('mousemove', onMag);
        cta.addEventListener('mouseleave', () => {
          try { animate(cta, { translateX: 0, translateY: 0, duration: 750, ease: 'outElastic' }); } catch {}
        });
      }

      /* ══ 4. HERO SCROLL FADE ══ */
      const hero = document.querySelector<HTMLElement>('.mem-hero');
      const scrollFn = () => {
        if (hero) hero.style.opacity = String(Math.max(0, 1 - window.scrollY / ((hero.offsetHeight || window.innerHeight) * 0.55)));
      };
      window.addEventListener('scroll', scrollFn, { passive: true });
      cleanupScroll = () => window.removeEventListener('scroll', scrollFn);

      /* ══ 5. GOLD BORDER ROTATION ══ */
      try {
        const borderObj = { angle: 0 };
        goldAnim = animate(borderObj, {
          angle: 360,
          duration: 3200,
          loop: true,
          ease: 'linear',
          onUpdate: () => {
            document.querySelectorAll<HTMLElement>('.mem-tier-card--gold').forEach(el => {
              el.style.setProperty('--border-angle', `${borderObj.angle}deg`);
            });
          },
        });
      } catch {}

      /* ══ 6. GOLD CARD GLOW — CSS keyframe class, no anime.js ══ */
      document.querySelectorAll<HTMLElement>('.mem-tier-card--gold').forEach(card => {
        card.classList.add('mem-gold-pulse');
      });

      /* ══ 7. IntersectionObserver reveals ══ */
      io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          io!.unobserve(el);

          if (el.classList.contains('mem-stat-item')) {
            try { animate(el, { opacity: [0, 1], translateY: [28, 0], duration: 750, ease: 'outExpo' }); } catch {}
            const numEl = el.querySelector<HTMLElement>('[data-count]');
            if (numEl) {
              const to  = Number(numEl.dataset.count);
              const sfx = numEl.dataset.suffix ?? '';
              const obj = { v: 0 };
              try {
                animate(obj, {
                  v: to, duration: 2200, ease: 'outExpo',
                  onUpdate: () => { numEl.textContent = Math.round(obj.v) + sfx; },
                });
              } catch {}
            }
            return;
          }

          if (el.classList.contains('mem-head-reveal')) {
            try { animate(el, { opacity: [0, 1], translateY: [30, 0], duration: 850, ease: 'outExpo' }); } catch {}
            return;
          }

          if (el.classList.contains('mem-tier-card')) {
            const cards = document.querySelectorAll<HTMLElement>('.mem-tier-card');
            const idx = Array.from(cards).indexOf(el);
            try {
              animate(el, {
                opacity: [0, 1], translateY: [70, 0], scale: [0.9, 1],
                duration: 900, delay: idx * 140, ease: 'outExpo',
                onComplete: () => {
                  const items = el.querySelectorAll<HTMLElement>('.mem-benefit-item');
                  try { animate(items, { opacity: [0, 1], translateX: [-14, 0], delay: stagger(50), duration: 450, ease: 'outExpo' }); } catch {}
                },
              });
            } catch {}
            return;
          }

          try {
            animate(el, { opacity: [0, 1], translateY: [35, 0], duration: 650, ease: 'outExpo' });
          } catch {}
        });
      }, { threshold: 0.1 });

      document.querySelectorAll<HTMLElement>(
        '.mem-stat-item, .mem-head-reveal, .mem-tier-card, .mem-event-card, .mem-ally-card'
      ).forEach(el => io!.observe(el));

      /* ══ 8. CARD 3D TILT ══ */
      document.querySelectorAll<HTMLElement>('.mem-tier-card').forEach(card => {
        card.addEventListener('mousemove', (e: MouseEvent) => {
          const r = card.getBoundingClientRect();
          const dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
          const dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
          card.style.transform = `perspective(900px) rotateY(${dx * 9}deg) rotateX(${-dy * 5.5}deg) scale(1.025)`;
        });
        card.addEventListener('mouseleave', () => {
          card.style.transition = 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)';
          card.style.transform  = '';
          setTimeout(() => { card.style.transition = ''; }, 620);
        });
      });

      /* ══ 9. PARTICLE BURST ON CARD CLICK ══ */
      const burstColors = ['#CD7F32', '#A8A9AD', '#D4AF37'];
      document.querySelectorAll<HTMLElement>('.mem-tier-card').forEach((card, ci) => {
        const burst = card.querySelector<HTMLElement>('.mem-particle-burst');
        if (!burst) return;
        card.addEventListener('click', () => spawnBurst(burst, burstColors[ci] ?? '#D4AF37'));
      });

    })); // end double-rAF

    return () => {
      cancelAnimationFrame(rafId);
      cleanupResize?.();
      cleanupScroll?.();
      try { goldAnim?.pause(); } catch {}
      io?.disconnect();
    };
  }, []);

  /* ── Render ─────────────────────────────────────── */
  return (
    <main>
      {/* ─── 1. Hero ────────────────────────────────── */}
      <section className="mem-hero">
        <canvas ref={canvasRef} className="mem-hero-canvas" />
        <div className="mem-hero-grain" />
        <div className="mem-blob mem-blob-1" />
        <div className="mem-blob mem-blob-2" />
        <div className="mem-blob mem-blob-3" />

        {/* SVG decorative lines */}
        <svg className="mem-hero-lines" viewBox="0 0 1440 900" preserveAspectRatio="none">
          <path className="mem-hero-path" d="M0 200 Q360 100 720 300 Q1080 500 1440 200" />
          <path className="mem-hero-path" d="M0 680 Q480 580 960 730 Q1200 800 1440 660" />
          <path className="mem-hero-path" style={{ opacity: 0.45 }} d="M180 0 Q330 280 260 580 Q200 800 380 900" />
          <path className="mem-hero-path" style={{ opacity: 0.45 }} d="M1260 0 Q1110 240 1170 540 Q1230 760 1060 900" />
        </svg>

        {/* Floating gems */}
        <div className="mem-gem" style={{ top: '18%', left: '7%', '--gem-dur': '5.8s', '--gem-delay': '0s' } as React.CSSProperties}>
          <svg width="24" height="24" viewBox="0 0 24 24"><polygon points="12,2 22,8 22,16 12,22 2,16 2,8" fill="rgba(212,175,55,0.12)" stroke="#D4AF37" strokeWidth="1.2"/></svg>
        </div>
        <div className="mem-gem" style={{ top: '26%', right: '9%', '--gem-dur': '7.2s', '--gem-delay': '-2.1s' } as React.CSSProperties}>
          <svg width="16" height="16" viewBox="0 0 24 24"><polygon points="12,2 22,12 12,22 2,12" fill="rgba(212,165,116,0.12)" stroke="rgba(212,165,116,0.9)" strokeWidth="1.5"/></svg>
        </div>
        <div className="mem-gem" style={{ bottom: '26%', left: '13%', '--gem-dur': '4.5s', '--gem-delay': '-3.8s' } as React.CSSProperties}>
          <svg width="10" height="10" viewBox="0 0 24 24"><polygon points="12,2 22,12 12,22 2,12" fill="rgba(212,175,55,0.15)" stroke="#D4AF37" strokeWidth="2"/></svg>
        </div>
        <div className="mem-gem" style={{ bottom: '32%', right: '15%', '--gem-dur': '6.5s', '--gem-delay': '-1.5s' } as React.CSSProperties}>
          <svg width="18" height="18" viewBox="0 0 24 24"><polygon points="12,2 22,8 22,16 12,22 2,16 2,8" fill="none" stroke="rgba(212,165,116,0.7)" strokeWidth="1.2"/></svg>
        </div>

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

        <div className="mem-wave-divider">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 70" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 70 }}>
            <path d="M0,70 C360,15 1080,65 1440,25 L1440,70 Z" fill="#060300" />
          </svg>
        </div>
      </section>

      {/* ─── 2. Marquee ─────────────────────────────── */}
      <div className="mem-marquee" aria-hidden="true">
        <div className="mem-marquee-track">
          {[...MARQUEE_WORDS, ...MARQUEE_WORDS].map((word, i) => (
            <span key={i} className="mem-marquee-item">{word} <span className="mem-marquee-dot">◆</span></span>
          ))}
        </div>
      </div>

      {/* ─── 3. Stats ───────────────────────────────── */}
      <section className="mem-stats">
        <div className="mem-stats-inner">
          {[
            { cls: 'stat-members',  label: 'Miembros activos',  count: 500, suffix: '+' },
            { cls: 'stat-partners', label: 'Aliados exclusivos', count: 50,  suffix: '+' },
            { cls: 'stat-events',   label: 'Eventos al año',     count: 12,  suffix: '/año' },
          ].map(s => (
            <div key={s.cls} className="mem-stat-item">
              <span className={`mem-stat-number ${s.cls}`} data-count={s.count} data-suffix={s.suffix}>0{s.suffix}</span>
              <span className="mem-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 4. Benefits ─────────────────────────────── */}
      <section id="benefits" className="mem-benefits">
        <div className="mem-benefits-glow" />
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div className="mem-section-head mem-head-reveal">
            <p className="mem-section-eyebrow" style={{ color: '#D4AF37' }}>Membresías</p>
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
                <div className="mem-particle-burst" />
                <div className="mem-tier-blob" style={{ background: `radial-gradient(circle, ${TIER_GLOW[tier.key]} 0%, transparent 70%)` }} />
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: tier.color, margin: '0 0 0.4rem' }}>Membresía</p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '2.2rem', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1 }}>{tier.label}</h3>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.15rem', fontWeight: 700, color: tier.color, margin: 0, lineHeight: 1.15 }}>{tier.priceMonthly}</p>
                      <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.62rem', color: `${tier.color}80`, margin: 0, fontWeight: 600 }}>{tier.priceQuarterly}</p>
                    </div>
                  </div>
                </div>
                <div className="mem-tier-divider" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem', position: 'relative', zIndex: 2 }}>
                  {tier.benefits.map(({ icon: Icon, text }) => (
                    <div key={text} className="mem-benefit-item">
                      <Icon size={14} color={tier.color} style={{ flexShrink: 0, marginTop: 3 }} />
                      <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.84rem', color: 'rgba(255,255,255,0.76)', lineHeight: 1.5 }}>{text}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', position: 'relative', zIndex: 2 }}>
                  <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.85rem', fontWeight: 700, color: tier.color }}>Ver opciones</span>
                  <ChevronRight size={14} color={tier.color} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. Events ───────────────────────────────── */}
      <section id="events" style={{ background: 'var(--makay-premium-cream)', padding: 'clamp(5rem,10vw,7rem) 1.25rem', position: 'relative' }}>
        <div className="mem-light-section-wave">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 60 }}>
            <path d="M0,0 C480,55 960,5 1440,40 L1440,0 Z" fill="#0d0703" />
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '1.5rem' }}>
              {events.map(ev => {
                const remaining = ev.capacity - ev.tickets_sold;
                const soldOut   = remaining <= 0;
                const soldPct   = Math.round((ev.tickets_sold / ev.capacity) * 100);
                const tags      = ev.tags ? ev.tags.split(',').map(s => s.trim()).filter(Boolean) : [];
                return (
                  <article key={ev.id} className="mem-event-card" style={{ background: '#fff', border: '1px solid var(--makay-sand-cream)', borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'relative', height: 200, background: 'linear-gradient(135deg,var(--makay-sand-cream),var(--makay-peachy-rose))' }}>
                      {ev.image_url && <img src={ev.image_url} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                      {!ev.image_url && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={48} color="rgba(255,255,255,0.6)" /></div>}
                      <div style={{ position: 'absolute', top: '0.875rem', right: '0.875rem', background: 'rgba(28,22,17,0.85)', backdropFilter: 'blur(8px)', color: '#fff', padding: '0.3rem 0.75rem', borderRadius: '100px', fontFamily: 'var(--font-playfair-display)', fontSize: '0.95rem', fontWeight: 700 }}>
                        {Number(ev.price) === 0 ? t('free') : `$${Number(ev.price).toFixed(2)}`}
                      </div>
                      {soldOut && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-montserrat)', fontWeight: 700, color: '#fff', fontSize: '1rem', letterSpacing: '0.1em' }}>{t('soldOut')}</div>}
                    </div>
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.75rem' }}>
                      {tags.length > 0 && <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>{tags.map(tag => <span key={tag} style={{ padding: '0.15rem 0.55rem', background: 'rgba(212,165,116,0.12)', borderRadius: 100, fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', fontWeight: 600, color: 'var(--makay-peachy-rose)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tag}</span>)}</div>}
                      <h3 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--makay-dark-navy)', margin: 0, lineHeight: 1.2 }}>{ev.title}</h3>
                      <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: 'var(--makay-mauve)', margin: 0, lineHeight: 1.6, flex: 1 }}>{ev.description?.slice(0, 120)}{(ev.description?.length ?? 0) > 120 ? '…' : ''}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {ev.event_date && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-dark-navy)' }}><Calendar size={13} style={{ color: 'var(--makay-peachy-rose)', flexShrink: 0 }} />{new Date(ev.event_date).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>}
                        {ev.location && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-mauve)' }}><MapPin size={13} style={{ flexShrink: 0 }} /> {ev.location}</div>}
                      </div>
                      <div>
                        <div style={{ height: 4, background: 'var(--makay-sand-cream)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(soldPct,100)}%`, borderRadius: 2, background: soldPct >= 90 ? '#ef4444' : soldPct >= 60 ? '#f59e0b' : '#10b981' }} />
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

      {/* ─── 6. Allies ───────────────────────────────── */}
      <section id="partners" style={{ background: 'var(--makay-warm-white,#fff8f0)', padding: 'clamp(4rem,8vw,6rem) 1.25rem', position: 'relative', overflow: 'hidden' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.25rem' }}>
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

      {leadTier && <MembershipLeadForm tier={leadTier} onClose={() => setLeadTier(null)} />}
    </main>
  );
}
