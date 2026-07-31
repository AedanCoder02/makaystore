'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { Calendar, MapPin, Users, Ticket, Star, Crown, Award, Shield, Lock, Copy, Check, Percent, Umbrella, Trophy, ChevronRight } from 'lucide-react';
import MembershipLeadForm from '@/components/membership/MembershipLeadForm';

export const dynamic = 'force-dynamic';

/* ── Types ───────────────────────────────────────────────────── */
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

/* ── Constants ───────────────────────────────────────────────── */
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
  price: string;
  benefits: Array<{ icon: typeof Percent; text: string }>;
}> = [
  {
    key: 'bronze',
    label: 'Bronce',
    color: '#CD7F32',
    price: 'Desde $100',
    benefits: [
      { icon: Percent, text: '10% de descuento en todos los productos' },
    ],
  },
  {
    key: 'silver',
    label: 'Plata',
    color: '#A8A9AD',
    price: 'Desde $300',
    benefits: [
      { icon: Percent,  text: '10% de descuento en todos los productos' },
      { icon: Umbrella, text: 'Toldo gratis en temporada baja' },
    ],
  },
  {
    key: 'gold',
    label: 'Oro',
    color: '#D4AF37',
    price: 'Desde $700',
    benefits: [
      { icon: Percent,  text: '10% de descuento en todos los productos' },
      { icon: Umbrella, text: 'Toldo gratis en temporada baja' },
      { icon: Trophy,   text: 'Cancha de Beach Tennis gratis en Makay La Marina' },
    ],
  },
];

/* ── Ally card ───────────────────────────────────────────────── */
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
    <div style={{
      background: '#fff', border: '1px solid #f0ebe4', borderRadius: 16,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      transition: 'box-shadow 0.2s, transform 0.2s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.10)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
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

      <div style={{ marginTop: 'auto', padding: '1rem 1.5rem 1.5rem' }}>
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

/* ── Main page ───────────────────────────────────────────────── */
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

  return (
    <main>
      {/* ── 1. Hero — Membresías y Experiencias ── */}
      <section style={{
        position: 'relative',
        background: 'linear-gradient(160deg, #1e1611 0%, #2c1f14 50%, #1a1208 100%)',
        color: '#fff',
        padding: 'clamp(6rem, 12vw, 9rem) 1.25rem clamp(3rem, 8vw, 6rem)',
        textAlign: 'center', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,165,116,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,132,87,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--makay-peachy-rose)', marginBottom: '1rem' }}>
            {t('heroTag')}
          </p>
          <h1 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700, lineHeight: 1.1, marginBottom: '1.25rem' }}>
            {t('heroTitle')}
          </h1>
          <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: '2rem' }}>
            {t('heroParagraph')}
          </p>
          <button
            onClick={() => { document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' }); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 2rem', background: 'var(--makay-peachy-rose)', color: '#fff', borderRadius: '100px', fontFamily: 'var(--font-montserrat)', fontWeight: 600, fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
          >
            Ver membresías <ChevronRight size={16} />
          </button>
        </div>
      </section>

      {/* ── 2. Desbloquea tus Beneficios ── */}
      <section id="benefits" style={{ background: 'var(--makay-premium-cream)', padding: 'clamp(4rem, 8vw, 6rem) 1.25rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--makay-peachy-rose)', marginBottom: '0.75rem' }}>
              Membresías
            </p>
            <h2 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, color: 'var(--makay-dark-navy)', margin: '0 0 0.75rem' }}>
              Desbloquea tus Beneficios
            </h2>
            <p style={{ fontFamily: 'var(--font-montserrat)', color: 'var(--makay-mauve)', fontSize: '0.95rem', maxWidth: 540, margin: '0 auto' }}>
              Elige el nivel que mejor se adapta a ti y empieza a disfrutar del club.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', justifyContent: 'center' }}>
            {BENEFIT_TIERS.map(tier => (
              <button
                key={tier.key}
                onClick={() => setLeadTier(tier.key)}
                style={{ background: '#fff', border: `2px solid ${tier.color}30`, borderRadius: 20, padding: '2rem', textAlign: 'left', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s', position: 'relative', overflow: 'hidden' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 12px 40px ${tier.color}25`; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLButtonElement).style.borderColor = `${tier.color}60`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; (e.currentTarget as HTMLButtonElement).style.transform = 'none'; (e.currentTarget as HTMLButtonElement).style.borderColor = `${tier.color}30`; }}
              >
                {/* Tier glow blob */}
                <div style={{ position: 'absolute', top: '-30%', right: '-15%', width: '60%', height: '60%', borderRadius: '50%', background: `radial-gradient(circle, ${tier.color}18 0%, transparent 70%)`, pointerEvents: 'none' }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', position: 'relative' }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: tier.color, margin: '0 0 0.2rem' }}>Membresía</p>
                    <h3 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--makay-dark-navy)', margin: 0 }}>{tier.label}</h3>
                  </div>
                  <div style={{ background: `${tier.color}15`, borderRadius: 10, padding: '0.4rem 0.75rem', textAlign: 'center' }}>
                    <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', fontWeight: 700, color: tier.color, margin: 0, whiteSpace: 'nowrap' }}>{tier.price}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem', position: 'relative' }}>
                  {tier.benefits.map(({ icon: Icon, text }) => (
                    <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                      <Icon size={14} color={tier.color} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.83rem', color: 'var(--makay-dark-navy)', lineHeight: 1.4 }}>{text}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', position: 'relative' }}>
                  <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', fontWeight: 700, color: tier.color }}>Ver opciones</span>
                  <ChevronRight size={14} color={tier.color} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Próximos Eventos ── */}
      <section id="events" style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(3rem, 6vw, 5rem) 1.25rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, color: 'var(--makay-dark-navy)', margin: '0 0 0.75rem' }}>
            {t('eventsTitle')}
          </h2>
          <p style={{ fontFamily: 'var(--font-montserrat)', color: 'var(--makay-mauve)', fontSize: '0.95rem' }}>
            {t('eventsSubtitle')}
          </p>
        </div>

        {loadingEvents ? (
          <p style={{ textAlign: 'center', color: 'var(--makay-mauve)', fontFamily: 'var(--font-montserrat)', padding: '3rem' }}>{t('loadingEvents')}</p>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <Calendar size={52} style={{ color: 'var(--makay-sand-cream)', display: 'block', margin: '0 auto 1.25rem' }} />
            <p style={{ fontFamily: 'var(--font-montserrat)', color: 'var(--makay-mauve)', fontSize: '1rem', marginBottom: '0.5rem' }}>{t('noEvents')}</p>
            <p style={{ fontFamily: 'var(--font-montserrat)', color: '#c4b4a0', fontSize: '0.85rem' }}>{t('noEventsHint')}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {events.map(ev => {
              const remaining = ev.capacity - ev.tickets_sold;
              const soldOut = remaining <= 0;
              const soldPct = Math.round((ev.tickets_sold / ev.capacity) * 100);
              const tags = ev.tags ? ev.tags.split(',').map(s => s.trim()).filter(Boolean) : [];
              return (
                <article key={ev.id} style={{ background: '#fff', border: '1px solid var(--makay-sand-cream)', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s, transform 0.2s' }}>
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

      {/* ── 4. Nuestros Aliados ── */}
      <section id="partners" style={{ background: 'var(--makay-warm-white, #fff8f0)', padding: 'clamp(3rem, 6vw, 5rem) 1.25rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: '0.75rem' }}>{ta('tag')}</p>
            <h2 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, color: 'var(--makay-dark-navy)', margin: '0 0 0.75rem' }}>{ta('title')}</h2>
            <p style={{ fontFamily: 'var(--font-montserrat)', color: 'var(--makay-mauve)', fontSize: '0.95rem', maxWidth: 520, margin: '0 auto' }}>{ta('subtitle')}</p>
          </div>

          {loadingAllies ? (
            <p style={{ textAlign: 'center', color: 'var(--makay-mauve)', fontFamily: 'var(--font-montserrat)', padding: '2rem' }}>{ta('loading')}</p>
          ) : allies.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--makay-mauve)', fontFamily: 'var(--font-montserrat)', padding: '2rem' }}>{ta('noAllies')}</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
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
