'use client';

import Image from 'next/image';
import Link from 'next/link';
import '@/styles/member.css';

// ── Copy ──────────────────────────────────────────────────────────────────────
const COPY = {
  es: {
    verified:    'Verificado por Makay Beach Club',
    memberId:    'ID de Miembro',
    since:       'Miembro desde',
    expires:     'Vigente hasta',
    duration:    'Duración',
    status:      'Estado',
    active:      'Activo',
    inactive:    'Inactivo',
    tier:        'Membresía',
    benefits:    'Beneficios',
    shop:        'Ver colección',
    explorer:    'Acceso comunitario al catálogo Makay.',
    free:        'Sin membresía activa.',
    durationLabels: { trimestral: '3 meses', semestral: '6 meses', anual: '1 año' } as Record<string, string>,
  },
  en: {
    verified:    'Verified by Makay Beach Club',
    memberId:    'Member ID',
    since:       'Member since',
    expires:     'Valid through',
    duration:    'Duration',
    status:      'Status',
    active:      'Active',
    inactive:    'Inactive',
    tier:        'Membership',
    benefits:    'Benefits',
    shop:        'Shop the Collection',
    explorer:    'Community access to the Makay catalogue.',
    free:        'No active membership.',
    durationLabels: { trimestral: '3 months', semestral: '6 months', anual: '1 year' } as Record<string, string>,
  },
};

// ── Tier meta ─────────────────────────────────────────────────────────────────
const TIER_META: Record<string, { labelEs: string; labelEn: string; color: string; rank: number }> = {
  free:   { labelEs: 'Explorer',  labelEn: 'Explorer',  color: '#A89080', rank: 0 },
  member: { labelEs: 'Miembro',   labelEn: 'Member',    color: '#A89080', rank: 0 },
  bronze: { labelEs: 'Bronce',    labelEn: 'Bronze',    color: '#CD7F32', rank: 1 },
  silver: { labelEs: 'Plata',     labelEn: 'Silver',    color: '#8C9BAC', rank: 2 },
  gold:   { labelEs: 'Oro',       labelEn: 'Gold',      color: '#C8A42A', rank: 3 },
  vip:    { labelEs: 'VIP',       labelEn: 'VIP',       color: '#D4A574', rank: 4 },
};

const BENEFITS_ES: Record<string, string[]> = {
  bronze: [
    '10% de descuento en todos los productos y servicios',
    'Priority Access: reservas prioritarias en fechas especiales',
    'Acceso Exclusivo: invitación a catas y eventos cerrados',
    'Asesoría personalizada con tu Vacation Planner',
    'Membresía Transferible (hasta 3 personas autorizadas)',
  ],
  silver: [
    'Toldo GRATIS durante la temporada baja',
    '10% de descuento en todos los productos y servicios',
    'Priority Access: reservas prioritarias en fechas especiales',
    'Acceso Exclusivo: invitación a catas y eventos cerrados',
    'Asesoría personalizada con tu Vacation Planner',
    'Membresía Transferible (hasta 3 personas autorizadas)',
  ],
  gold: [
    'Toldo GRATIS durante la temporada baja',
    '10% de descuento en todos los productos y servicios',
    'Priority Access: reservas prioritarias en fechas especiales',
    'Acceso Exclusivo: invitación a catas y eventos cerrados',
    'Acceso Deportivo GRATIS: Beach Tennis y Voleibol de playa',
    'Descuentos Exclusivos en marcas aliadas',
    'Asesoría personalizada con tu Vacation Planner',
    'Membresía Transferible (hasta 3 personas autorizadas)',
  ],
  vip: [
    'Toldo GRATIS durante la temporada baja',
    '10% de descuento en todos los productos y servicios',
    'Priority Access: reservas prioritarias en fechas especiales',
    'Acceso Exclusivo: invitación a catas y eventos cerrados',
    'Acceso Deportivo GRATIS: Beach Tennis y Voleibol de playa',
    'Descuentos Exclusivos en marcas aliadas',
    'Atención VIP personalizada y acceso a eventos privados',
    'Membresía Transferible (hasta 3 personas autorizadas)',
  ],
};

const BENEFITS_EN: Record<string, string[]> = {
  bronze: [
    '10% discount on all products and services',
    'Priority Access: priority reservations for special dates',
    'Exclusive Access: invitation to private tastings and events',
    'Personalized Vacation Planner advisory',
    'Transferable membership (up to 3 authorized guests)',
  ],
  silver: [
    'FREE beach umbrella during low season',
    '10% discount on all products and services',
    'Priority Access: priority reservations for special dates',
    'Exclusive Access: invitation to private tastings and events',
    'Personalized Vacation Planner advisory',
    'Transferable membership (up to 3 authorized guests)',
  ],
  gold: [
    'FREE beach umbrella during low season',
    '10% discount on all products and services',
    'Priority Access: priority reservations for special dates',
    'Exclusive Access: invitation to private tastings and events',
    'FREE Sports Access: Beach Tennis and Beach Volleyball',
    'Exclusive discounts at all partner brands',
    'Personalized Vacation Planner advisory',
    'Transferable membership (up to 3 authorized guests)',
  ],
  vip: [
    'FREE beach umbrella during low season',
    '10% discount on all products and services',
    'Priority Access: priority reservations for special dates',
    'Exclusive Access: invitation to private tastings and events',
    'FREE Sports Access: Beach Tennis and Beach Volleyball',
    'Exclusive discounts at all partner brands',
    'Personalized VIP service and access to private events',
    'Transferable membership (up to 3 authorized guests)',
  ],
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  firstName: string;
  lastName: string;
  imageUrl: string;
  membershipTier: string;
  memberSince: number;
  userId: string;
  isActive: boolean;
  membershipExpiresAt: string | null;
  membershipStartedAt: string | null;
  membershipDuration: string | null;
  locale?: string;
}

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(locale === 'en' ? 'en-US' : 'es', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch {
    return '—';
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MemberCard({
  firstName, lastName, imageUrl, membershipTier, memberSince, userId,
  isActive, membershipExpiresAt, membershipStartedAt, membershipDuration,
  locale = 'es',
}: Props) {
  const c = locale === 'en' ? COPY.en : COPY.es;
  const tier = TIER_META[membershipTier] ?? TIER_META.free;
  const tierLabel = locale === 'en' ? tier.labelEn : tier.labelEs;
  const isPaid = tier.rank > 0;
  const benefits = (locale === 'en' ? BENEFITS_EN : BENEFITS_ES)[membershipTier] ?? [];
  const memberId = userId.slice(-8).toUpperCase();

  const detailRows = [
    { label: c.memberId,  value: memberId },
    { label: c.since,     value: String(memberSince) },
    ...(membershipDuration ? [{ label: c.duration, value: c.durationLabels[membershipDuration] ?? membershipDuration }] : []),
    ...(membershipExpiresAt ? [{ label: c.expires, value: formatDate(membershipExpiresAt, locale) }] : []),
  ];

  return (
    <main className="mc-page">
      <div className="mc-page-bg" />

      <div className="mc-content">

        {/* ── Logo ── */}
        <div className="mc-logo-wrap">
          <Image
            src="/images/makay-logo.png"
            alt="Makay Beach Club"
            width={130}
            height={44}
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>

        {/* ── Hero card: avatar + name + status ── */}
        <div className="mc-hero-card">
          <div className="mc-hero-bg" />
          <div className="mc-hero-inner">
            <div className="mc-hero-left">
              {imageUrl ? (
                <img src={imageUrl} alt={firstName} className="mc-avatar" />
              ) : (
                <div className="mc-avatar mc-avatar-placeholder">
                  <svg width="28" height="32" viewBox="0 0 24 28" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5">
                    <circle cx="12" cy="8" r="5" /><path d="M2 26c0-5.5 4.5-10 10-10s10 4.5 10 10" />
                  </svg>
                </div>
              )}
            </div>
            <div className="mc-hero-right">
              <p className="mc-name">{firstName} {lastName}</p>
              <div className="mc-tier-row">
                <span className="mc-tier-badge" style={{ borderColor: `${tier.color}60`, color: tier.color }}>
                  {tierLabel}
                </span>
              </div>
              <div className={`mc-status-pill${isActive ? ' active' : ' inactive'}`}>
                <span className="mc-status-dot" />
                {isActive ? c.active : c.inactive}
              </div>
            </div>
          </div>
        </div>

        {/* ── Membership details ── */}
        <div className="mc-section">
          <p className="mc-section-label">{c.tier}</p>
          <div className="mc-details-grid">
            {detailRows.map(row => (
              <div key={row.label} className="mc-detail-row">
                <span className="mc-detail-key">{row.label}</span>
                <span className="mc-detail-val">{row.value}</span>
              </div>
            ))}
            <div className="mc-detail-row">
              <span className="mc-detail-key">{c.status}</span>
              <span className={`mc-detail-val mc-status-text${isActive ? ' active' : ' inactive'}`}>
                <span className="mc-status-dot-sm" style={{ background: isActive ? '#059669' : '#DC2626' }} />
                {isActive ? c.active : c.inactive}
              </span>
            </div>
          </div>
        </div>

        {/* ── Benefits ── */}
        {isPaid && benefits.length > 0 && (
          <div className="mc-section">
            <p className="mc-section-label">{c.benefits}</p>
            <ul className="mc-benefits-list">
              {benefits.map((b, i) => (
                <li key={i} className="mc-benefit-item">
                  <span className="mc-benefit-check" style={{ color: tier.color }}>✓</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!isPaid && (
          <div className="mc-section mc-explorer-note">
            <p>{isPaid ? '' : (membershipTier === 'free' ? c.free : c.explorer)}</p>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="mc-footer">
          <p className="mc-verified">{c.verified}</p>
          <Link href="/products" className="mc-shop-btn">{c.shop}</Link>
          <p className="mc-footer-url">
            <Link href="/">makaystore.com</Link>
          </p>
        </div>

      </div>
    </main>
  );
}
