'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import QRCode from 'react-qr-code';
import { Share2, Download, Edit3, Check, X, HelpCircle, Crown, TrendingUp, Lock, Percent, Umbrella, Trophy, AlertTriangle, Star, Tag } from 'lucide-react';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';
import { animate } from 'animejs';
import {
  CardLayout, CardColors,
  DEFAULT_CARD_LAYOUT, DEFAULT_CARD_COLORS, mergeLayout,
} from '@/components/CardDesigner';
import '@/styles/profile.css';

interface WalletTransaction {
  id: number;
  type: 'earn' | 'spend' | 'admin_credit';
  points: number;
  description: string;
  created_at: string;
}

interface CreditLine {
  id: number;
  principal: number;
  interest_rate: number;
  issued_at: string;
  due_date: string;
  status: 'active' | 'paid' | 'overdue';
  notes: string | null;
  days_elapsed: number;
  accumulated_interest: number;
  total_owed: number;
}

interface UserProfile {
  bio: string;
  wallet_balance: string;
  wallet_points: number;
  membership_tier: string;
  discount_override: number | null;
}

interface OrderSummary {
  id: string;
  total: number;
  status: string;
  created_at: string;
  items: Array<{ title: string; quantity: number }>;
}

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  free:   { label: 'Explorer', color: '#A89080' },
  bronze: { label: 'Bronze',   color: '#CD7F32' },
  silver: { label: 'Silver',   color: '#A8A9AD' },
  gold:   { label: 'Gold',     color: '#D4AF37' },
  vip:    { label: 'VIP',      color: '#D4A574' },
  member: { label: 'Member',   color: '#D4AF37' },
};

const TIER_PERKS: Record<string, string[]> = {
  free:   ['Acceso al catálogo Makay', 'Tarjeta QR de miembro'],
  member: ['Acceso al catálogo Makay', 'Tarjeta QR de miembro'],
  bronze: [
    '10% de descuento en productos y servicios',
    'Priority Access: Reservas prioritarias en fechas especiales',
    'Acceso Exclusivo: Catas y eventos cerrados',
    'Asesoría personalizada con tu Vacation Planner',
    'Membresía Transferible (hasta 3 personas autorizadas)',
  ],
  silver: [
    'Toldo GRATIS en temporada baja',
    '10% de descuento en productos y servicios',
    'Priority Access: Reservas prioritarias en fechas especiales',
    'Acceso Exclusivo: Catas y eventos cerrados',
    'Asesoría personalizada con tu Vacation Planner',
    'Membresía Transferible (hasta 3 personas autorizadas)',
  ],
  gold: [
    'Toldo GRATIS en temporada baja',
    '10% de descuento en productos y servicios',
    'Priority Access: Reservas prioritarias en fechas especiales',
    'Acceso Exclusivo: Catas y eventos cerrados',
    'Acceso Deportivo GRATIS: Beach Tennis y Voleibol de playa',
    'Descuentos Exclusivos en marcas aliadas',
    'Asesoría personalizada con tu Vacation Planner',
    'Membresía Transferible (hasta 3 personas autorizadas)',
  ],
  vip: [
    'Todos los beneficios Gold',
    'Acceso Deportivo GRATIS: Beach Tennis y Voleibol de playa',
    'Descuentos Exclusivos en marcas aliadas',
    'Asesoría personalizada con tu Vacation Planner',
    'Membresía Transferible (hasta 3 personas autorizadas)',
  ],
};

const TIER_THRESHOLDS: Record<string, number> = {
  free: 0, member: 0, bronze: 100, silver: 300, gold: 700, vip: 1500,
};

const TIER_NEXT: Record<string, { next: string; threshold: number }> = {
  free:   { next: 'Bronze', threshold: 100  },
  member: { next: 'Bronze', threshold: 100  },
  bronze: { next: 'Silver', threshold: 300  },
  silver: { next: 'Gold',   threshold: 700  },
  gold:   { next: 'VIP',    threshold: 1500 },
  vip:    { next: '',       threshold: 0    },
};

export default function ClientProfile() {
  const { user, isLoaded } = useUser();
  const tp = useTranslations('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [cardLayout, setCardLayout] = useState<CardLayout>(DEFAULT_CARD_LAYOUT);
  const [cardColors, setCardColors] = useState<CardColors>(DEFAULT_CARD_COLORS);
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<OrderSummary[]>([]);

  // Wallet state
  const [walletPoints, setWalletPoints] = useState(0);
  const [dollarBalance, setDollarBalance] = useState(0);
  const [ptsDollar, setPtsDollar] = useState(10);
  const [totalSpend, setTotalSpend] = useState(0);
  const [walletTx, setWalletTx] = useState<WalletTransaction[]>([]);
  const [creditLines, setCreditLines] = useState<CreditLine[]>([]);

  // Membership expiry state
  const [membershipExpiry, setMembershipExpiry] = useState<{
    expires_at: string | null;
    days_remaining: number | null;
    expiry_warning: boolean;
  }>({ expires_at: null, days_remaining: null, expiry_warning: false });

  const cardRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/member/${user?.id}`
    : '';

  const tutorialStore = useTutorialStore();
  const tutorialUI = useTutorialOverlay('profile-tour');

  useEffect(() => {
    if (!isLoaded || !user) return;
    Promise.all([
      fetch('/api/profile').then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }),
      fetch('/api/theme').then(r => r.json()).catch(() => ({})),
      fetch('/api/orders').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('/api/wallet').then(r => r.ok ? r.json() : { points: 0, dollar_balance: 0, pts_per_dollar: 10, total_spend: 0, transactions: [], credit_lines: [] }).catch(() => ({ points: 0, dollar_balance: 0, pts_per_dollar: 10, total_spend: 0, transactions: [], credit_lines: [] })),
      fetch('/api/membership/status').then(r => r.ok ? r.json() : {}).catch(() => ({})),
    ]).then(([profileData, themeData, ordersData, walletData, membershipStatus]: [
      UserProfile,
      Record<string, string>,
      OrderSummary[],
      { points: number; dollar_balance: number; pts_per_dollar: number; total_spend: number; transactions: WalletTransaction[]; credit_lines: CreditLine[] },
      { expires_at?: string | null; days_remaining?: number | null; expiry_warning?: boolean }
    ]) => {
      setProfile(profileData);
      setBioInput(profileData.bio || '');
      setOrders(Array.isArray(ordersData) ? ordersData.slice(0, 5) : []);
      setWalletPoints(walletData.points ?? 0);
      setDollarBalance(walletData.dollar_balance ?? 0);
      setPtsDollar(walletData.pts_per_dollar ?? 10);
      setTotalSpend(walletData.total_spend ?? 0);
      setCreditLines(walletData.credit_lines ?? []);
      setWalletTx(walletData.transactions ?? []);
      setMembershipExpiry({
        expires_at: membershipStatus.expires_at ?? null,
        days_remaining: membershipStatus.days_remaining ?? null,
        expiry_warning: membershipStatus.expiry_warning ?? false,
      });
      if (themeData.card_layout) {
        try { setCardLayout(mergeLayout(JSON.parse(themeData.card_layout))); } catch {}
      }
      if (themeData.card_colors) {
        try { setCardColors(JSON.parse(themeData.card_colors)); } catch {}
      }
    }).catch(() => setFetchError(true));
  }, [isLoaded, user]);

  useEffect(() => {
    const role = user?.publicMetadata?.role as string | undefined;
    if (isLoaded && user && role === 'customer' && !tutorialStore.isCompleted('profile-tour') && !tutorialStore.currentTutorial) {
      tutorialStore.showTutorial('profile-tour');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user]);

  useEffect(() => {
    if (!profile || !heroRef.current) return;
    animate(heroRef.current, {
      opacity: [0, 1],
      translateY: [24, 0],
      duration: 600,
      easing: 'easeOutQuad',
    });
    if (cardRef.current) {
      animate(cardRef.current, {
        opacity: [0, 1],
        scale: [0.95, 1],
        duration: 700,
        delay: 200,
        easing: 'easeOutQuad',
      });
    }
  }, [profile]);

  const saveBio = async () => {
    setSaving(true);
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio: bioInput }),
    });
    const updated = await res.json();
    setProfile(updated);
    setEditingBio(false);
    setSaving(false);
  };

  const shareCard = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${user?.firstName}'s Makay Card`,
        text: 'Check out my Makay Beach Club membership card',
        url: profileUrl,
      });
    } else {
      await navigator.clipboard.writeText(profileUrl);
      alert('Link copied to clipboard!');
    }
  };

  const downloadCard = () => {
    if (!cardRef.current) return;
    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(cardRef.current!, { backgroundColor: null, scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `makay-card-${user?.firstName?.toLowerCase()}.png`;
        link.href = canvas.toDataURL();
        link.click();
      });
    });
  };

  if (fetchError) {
    return (
      <div className="profile-loading">
        <p style={{ fontFamily: 'var(--font-montserrat)', color: 'var(--makay-mauve)', textAlign: 'center', padding: '2rem' }}>
          Could not load profile. Please refresh the page.
        </p>
      </div>
    );
  }

  if (!profile || !user) {
    return (
      <div className="profile-loading">
        <div className="profile-spinner" />
      </div>
    );
  }

  const tier = TIER_LABELS[profile.membership_tier] ?? TIER_LABELS.free;
  const tierKey = profile.membership_tier in TIER_THRESHOLDS ? profile.membership_tier : 'free';
  const nextInfo = TIER_NEXT[tierKey];
  const currentMin = TIER_THRESHOLDS[tierKey] ?? 0;
  const nextMin = nextInfo?.next ? (TIER_THRESHOLDS[nextInfo.next.toLowerCase()] ?? nextInfo.threshold) : 0;
  const progressRange = nextMin - currentMin;
  const tierProgress = nextInfo?.next && progressRange > 0
    ? Math.min(100, Math.max(0, Math.round(((totalSpend - currentMin) / progressRange) * 100)))
    : 100;
  const spendRemaining = nextInfo?.next ? Math.max(0, nextMin - totalSpend) : 0;
  const activeCreditLine = creditLines[0] ?? null;
  const isPaidMember = !['free', 'member'].includes(profile?.membership_tier ?? 'free');

  const PAID_TIER_BENEFITS: Record<string, Array<{ icon: typeof Percent; label: string; detail: string }>> = {
    bronze: [
      { icon: Percent,  label: '10% de descuento', detail: 'En todos nuestros productos y servicios' },
      { icon: Star,     label: 'Priority Access', detail: 'Reservas prioritarias en fechas especiales y eventos' },
      { icon: Lock,     label: 'Acceso Exclusivo', detail: 'Invitación a catas y eventos cerrados' },
    ],
    silver: [
      { icon: Umbrella, label: 'Toldo GRATIS', detail: 'Durante la temporada baja' },
      { icon: Percent,  label: '10% de descuento', detail: 'En todos nuestros productos y servicios' },
      { icon: Star,     label: 'Priority Access', detail: 'Reservas prioritarias en fechas especiales y eventos' },
      { icon: Lock,     label: 'Acceso Exclusivo', detail: 'Invitación a catas y eventos cerrados' },
    ],
    gold: [
      { icon: Umbrella, label: 'Toldo GRATIS', detail: 'Durante la temporada baja' },
      { icon: Percent,  label: '10% de descuento', detail: 'En todos nuestros productos y servicios' },
      { icon: Star,     label: 'Priority Access', detail: 'Reservas prioritarias en fechas especiales y eventos' },
      { icon: Lock,     label: 'Acceso Exclusivo', detail: 'Invitación a catas y eventos cerrados' },
      { icon: Trophy,   label: 'Acceso Deportivo GRATIS', detail: 'Beach Tennis y Voleibol de playa' },
      { icon: Tag,          label: 'Marcas Aliadas', detail: 'Descuentos exclusivos en nuestras marcas aliadas' },
    ],
    vip: [
      { icon: Umbrella, label: 'Toldo GRATIS', detail: 'Durante la temporada baja' },
      { icon: Percent,  label: '10% de descuento', detail: 'En todos nuestros productos y servicios' },
      { icon: Trophy,   label: 'Acceso Deportivo GRATIS', detail: 'Beach Tennis y Voleibol de playa' },
      { icon: Tag,          label: 'Marcas Aliadas', detail: 'Descuentos exclusivos en nuestras marcas aliadas' },
    ],
  };

  const CardEl = ({ id, children }: { id: keyof typeof cardLayout; children: React.ReactNode }) => {
    const pos = cardLayout[id];
    if (!pos.visible) return null;
    const scale = pos.scale ?? 1;
    return (
      <div style={{
        position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`, zIndex: 1,
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
      }}>
        {children}
      </div>
    );
  };

  return (
    <main className="profile-page">
      <div className="profile-container" ref={heroRef}>

        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar-wrapper">
            <UserButton appearance={{ elements: { avatarBox: 'profile-clerk-avatar' } }} />
          </div>
          <div className="profile-identity">
            <h1 className="profile-name">
              {user.firstName} {user.lastName}
            </h1>
            <p className="profile-email">{user.emailAddresses[0]?.emailAddress}</p>
            <span className="profile-tier-badge" style={{ backgroundColor: tier.color }}>
              {tier.label}
            </span>
            <button className="profile-help-btn" onClick={() => tutorialStore.showTutorial('profile-tour')} aria-label="Show tutorial" title="Help">
              <HelpCircle size={14} />
            </button>
          </div>
        </div>

        {/* About */}
        <div className="profile-section">
          <div className="profile-section-header">
            <h2 className="profile-section-title">About</h2>
            {!editingBio && (
              <button className="profile-edit-btn" onClick={() => setEditingBio(true)}>
                <Edit3 size={16} /> Edit
              </button>
            )}
          </div>

          {editingBio ? (
            <div className="profile-bio-edit">
              <textarea
                className="profile-bio-textarea"
                value={bioInput}
                onChange={e => setBioInput(e.target.value)}
                placeholder="Tell the Makay community about yourself..."
                rows={3}
                maxLength={280}
              />
              <div className="profile-bio-actions">
                <button className="profile-save-btn" onClick={saveBio} disabled={saving}>
                  <Check size={16} /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button className="profile-cancel-btn" onClick={() => { setEditingBio(false); setBioInput(profile.bio); }}>
                  <X size={16} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="profile-bio-text">
              {profile.bio || <span className="profile-bio-empty">No bio yet. Click Edit to add one.</span>}
            </p>
          )}
        </div>

        {/* ── MY MAKAY CARD (with wallet info inside) ── */}
        <div className="profile-section">
          <div className="profile-section-header">
            <h2 className="profile-section-title">My Makay Card</h2>
            <div className="profile-card-actions">
              <button className="profile-share-btn" onClick={shareCard}>
                <Share2 size={16} /> Share
              </button>
              <button className="profile-download-btn" onClick={downloadCard}>
                <Download size={16} /> Save
              </button>
            </div>
          </div>

          <div
            className="makay-client-card"
            ref={cardRef}
            style={{ position: 'relative' }}
          >
            {/* Background */}
            <div className="makay-card-bg" style={{
              background: `linear-gradient(${cardColors.bg_angle}deg, ${cardColors.bg_from}, ${cardColors.bg_to})`,
            }} />
            <div className="makay-card-bg-glow" />

            {/* Logo */}
            <CardEl id="logo">
              <Image
                src="/images/2422e513-d2a3-47ad-9574-1b141cd4de8f-1-removebg-preview.png"
                alt="Makay" width={70} height={24}
                style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)', display: 'block' }}
              />
            </CardEl>

            {/* Tier badge */}
            <CardEl id="tier">
              <span className="makay-card-tier" style={{ color: cardColors.accent, borderColor: `${cardColors.accent}55` }}>
                {tier.label}
              </span>
            </CardEl>

            {/* Avatar */}
            {user.imageUrl && (
              <CardEl id="avatar">
                <img src={user.imageUrl} alt={user.firstName ?? ''} className="makay-card-avatar"
                  style={{ borderColor: `${cardColors.accent}80` }} />
              </CardEl>
            )}

            {/* Name */}
            <CardEl id="name">
              <p className="makay-card-name" style={{ color: cardColors.text }}>
                {user.firstName} {user.lastName}
              </p>
            </CardEl>

            {/* Tagline */}
            <CardEl id="tagline">
              <p className="makay-card-tagline" style={{ color: `${cardColors.accent}B0` }}>Beach Club Member</p>
            </CardEl>

            {/* Divider */}
            {cardLayout.divider.visible && (
              <div style={{ position: 'absolute', left: 0, right: 0, top: `${cardLayout.divider.y}%`, zIndex: 1 }}>
                <div className="makay-card-divider" />
              </div>
            )}

            {/* ID */}
            <CardEl id="id">
              <p className="makay-card-id" style={{ color: `${cardColors.text}88` }}>
                ID: {user.id?.slice(-8).toUpperCase()}
              </p>
            </CardEl>

            {/* Since */}
            <CardEl id="since">
              <p className="makay-card-since" style={{ color: `${cardColors.text}44` }}>
                Since {new Date(user.createdAt!).getFullYear()}
              </p>
            </CardEl>

            {/* QR */}
            {profileUrl && (
              <CardEl id="qr">
                <div className="makay-card-qr">
                  <QRCode value={profileUrl} size={68} bgColor="transparent" fgColor={cardColors.text} />
                </div>
              </CardEl>
            )}

            {/* Custom text elements */}
            {(['custom1', 'custom2', 'custom3'] as const).map(key => {
              const el = cardLayout[key];
              if (!el?.visible || !el?.text) return null;
              return (
                <CardEl key={key} id={key}>
                  <p style={{
                    fontFamily: 'var(--font-montserrat)',
                    fontSize: '0.6rem',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    color: cardColors.text,
                    margin: 0,
                    whiteSpace: 'nowrap',
                  }}>
                    {el.text}
                  </p>
                </CardEl>
              );
            })}

            {/* ── Wallet overlay (inside card, middle-bottom) ── */}
            <div style={{
              position: 'absolute', left: '34%', top: '72%', zIndex: 2,
              display: 'flex', flexDirection: 'column', gap: '0.15rem',
            }}>
              <p style={{
                fontFamily: 'var(--font-montserrat)', fontSize: '0.58rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: `${cardColors.text}50`, margin: 0,
              }}>
                {tp('makayBalance')}
              </p>
              <p style={{
                fontFamily: 'var(--font-montserrat)', fontSize: '0.88rem', fontWeight: 700,
                color: cardColors.text, margin: 0, lineHeight: 1.1,
              }}>
                ${dollarBalance.toFixed(2)}
              </p>
              <p style={{
                fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', fontWeight: 600,
                color: `${cardColors.accent}CC`, margin: 0,
              }}>
                {walletPoints.toLocaleString()} pts
              </p>
            </div>
          </div>

          {/* Wallet lock overlay for non-members */}
          {!isPaidMember && (
            <div style={{ marginTop: '1rem', position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem', background: 'var(--makay-sand-cream)', borderRadius: 12, filter: 'blur(2px)', opacity: 0.4, pointerEvents: 'none', userSelect: 'none' }}>
                <div style={{ height: 10, background: '#d4cac0', borderRadius: 4, marginBottom: '0.5rem', width: '60%' }} />
                <div style={{ height: 10, background: '#d4cac0', borderRadius: 4, marginBottom: '0.5rem', width: '40%' }} />
                <div style={{ height: 10, background: '#d4cac0', borderRadius: 4, width: '50%' }} />
              </div>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'rgba(255,250,245,0.85)', borderRadius: 12, backdropFilter: 'blur(2px)' }}>
                <Lock size={20} color="var(--makay-mauve)" />
                <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--makay-dark-navy)', margin: 0, textAlign: 'center' }}>
                  Activa tu membresía para usar tu wallet
                </p>
                <a href="/membership#benefits" style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--makay-peachy-rose)', textDecoration: 'none' }}>
                  Ver membresías →
                </a>
              </div>
            </div>
          )}

          {/* Recent wallet activity — below card, same section */}
          {isPaidMember && walletTx.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--makay-mauve)', margin: '0 0 0.5rem' }}>
                {tp('recentActivity')}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {walletTx.slice(0, 4).map(tx => {
                  const isEarn = tx.type === 'earn' || tx.type === 'admin_credit';
                  return (
                    <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.875rem', background: 'var(--makay-sand-cream)', borderRadius: 9, gap: '0.75rem' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.76rem', color: 'var(--makay-dark-navy)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tx.description || (isEarn ? tp('pointsEarned') : tp('pointsRedeemed'))}
                        </p>
                        <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.65rem', color: 'var(--makay-mauve)', margin: 0 }}>
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '0.85rem', color: isEarn ? '#10b981' : '#ef4444', flexShrink: 0 }}>
                        {isEarn ? '+' : '-'}{Math.abs(tx.points)} pts
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Credit line detail (if active) */}
              {activeCreditLine && (
                <div style={{ marginTop: '0.75rem', padding: '0.875rem 1rem', background: '#0f172a0A', border: '1px solid #0f172a18', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--makay-mauve)', margin: '0 0 0.2rem' }}>Line of Credit</p>
                    <p style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--makay-dark-navy)', margin: 0 }}>
                      ${activeCreditLine.principal.toFixed(2)}
                    </p>
                    <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', color: 'var(--makay-mauve)', margin: 0 }}>
                      {(activeCreditLine.interest_rate * 100).toFixed(1)}% APR · Due {new Date(activeCreditLine.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.65rem', color: 'var(--makay-mauve)', margin: '0 0 0.2rem' }}>
                      Interest ({activeCreditLine.days_elapsed}d)
                    </p>
                    <p style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '0.88rem', color: '#D4AF37', margin: 0 }}>
                      +${activeCreditLine.accumulated_interest.toFixed(2)}
                    </p>
                    {activeCreditLine.accumulated_interest > 0 && (
                      <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', color: 'var(--makay-dark-navy)', margin: 0 }}>
                        Total: ${activeCreditLine.total_owed.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── EXPIRY WARNING BANNER ── */}
        {membershipExpiry.expiry_warning && membershipExpiry.days_remaining !== null && (
          <div style={{ margin: '0 0 1rem', padding: '0.875rem 1.25rem', background: '#fff8ee', border: '1.5px solid #f59e0b40', borderRadius: 12, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: '#92400e', margin: 0, flex: 1 }}>
              Tu membresía vence en <strong>{membershipExpiry.days_remaining} días</strong>.
            </p>
            <a href="/membership#benefits" style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Renovar →
            </a>
          </div>
        )}

        {/* ── ACTIVE MEMBERSHIP CARD (glowing) ── */}
        {isPaidMember && (
          <div style={{
            background: `linear-gradient(135deg, #1e1611 0%, #2c1f14 100%)`,
            border: `2px solid ${tier.color}50`,
            borderRadius: 18,
            padding: '1.5rem',
            marginBottom: '1rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: `0 0 32px ${tier.color}30, 0 4px 20px rgba(0,0,0,0.25)`,
            animation: 'none',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 48px ${tier.color}50, 0 8px 32px rgba(0,0,0,0.3)`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 32px ${tier.color}30, 0 4px 20px rgba(0,0,0,0.25)`; }}
          >
            <div style={{ position: 'absolute', top: '-30%', right: '-15%', width: '50%', height: '150%', background: `radial-gradient(ellipse, ${tier.color}18 0%, transparent 70%)`, pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              <div>
                <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: `${tier.color}90`, margin: '0 0 0.2rem' }}>
                  Membresía
                </p>
                <p style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.1 }}>
                  {tier.label}
                </p>
                {membershipExpiry.expires_at && (
                  <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', margin: '0.35rem 0 0' }}>
                    Vence {new Date(membershipExpiry.expires_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
              <span style={{ background: `${tier.color}25`, border: `1px solid ${tier.color}50`, color: tier.color, fontFamily: 'var(--font-montserrat)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.3rem 0.7rem', borderRadius: 100 }}>
                ACTIVA
              </span>
            </div>

            {/* Benefit cards row */}
            {(PAID_TIER_BENEFITS[profile.membership_tier] ?? []).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1.25rem', position: 'relative' }}>
                {(PAID_TIER_BENEFITS[profile.membership_tier] ?? []).map(({ icon: Icon, label, detail }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.875rem', background: `${tier.color}12`, border: `1px solid ${tier.color}25`, borderRadius: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${tier.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={13} color={tier.color} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.8rem', fontWeight: 700, color: '#fff', margin: 0 }}>{label}</p>
                      <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MEMBERSHIP ── */}
        <div className="profile-section">
          <div className="profile-section-header">
            <h2 className="profile-section-title">Membership</h2>
            <a href="/membership" style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.8rem', color: 'var(--makay-peachy-rose)', textDecoration: 'none', fontWeight: 600 }}>
              Explore plans →
            </a>
          </div>

          {/* Tier card */}
          <div style={{
            background: `linear-gradient(135deg, ${tier.color}1A 0%, ${tier.color}0A 100%)`,
            border: `1px solid ${tier.color}30`,
            borderRadius: 16,
            padding: '1.5rem',
            marginBottom: '1.25rem',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%', background: `${tier.color}10`, pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: nextInfo?.next ? '1.25rem' : '0', position: 'relative' }}>
              <div>
                <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--makay-mauve)', display: 'block', marginBottom: '0.25rem' }}>
                  Current Tier
                </span>
                <span style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '2rem', fontWeight: 700, color: tier.color, lineHeight: 1 }}>
                  {tier.label}
                </span>
                {totalSpend > 0 && (
                  <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: 'var(--makay-mauve)', margin: '0.3rem 0 0' }}>
                    ${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })} total spent
                  </p>
                )}
              </div>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${tier.color}18`, border: `2px solid ${tier.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Crown size={22} color={tier.color} />
              </div>
            </div>

            {/* Progress bar */}
            {nextInfo?.next && (
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <TrendingUp size={12} color="var(--makay-mauve)" />
                    <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.7rem', color: 'var(--makay-mauve)', fontWeight: 600 }}>
                      Progress to {nextInfo.next}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: tier.color, fontWeight: 700 }}>
                    {tierProgress}%
                  </span>
                </div>
                <div style={{ height: 7, background: `${tier.color}18`, borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${tierProgress}%`,
                    background: `linear-gradient(90deg, ${tier.color}80, ${tier.color})`,
                    borderRadius: 99,
                    transition: 'width 1s ease',
                  }} />
                </div>
                {spendRemaining > 0 && (
                  <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.7rem', color: 'var(--makay-mauve)', margin: '0.5rem 0 0', textAlign: 'center' }}>
                    Spend ${spendRemaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} more to reach {nextInfo.next}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Perks list */}
          <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--makay-mauve)', margin: '0 0 0.625rem' }}>
            Your Benefits
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.125rem' }}>
            {[...(TIER_PERKS[profile.membership_tier] ?? TIER_PERKS.free), tp('earnPtsPerDollar').replace('{pts}', String(ptsDollar))].map((perk, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${tier.color}1A`, border: `1px solid ${tier.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={11} color={tier.color} />
                </div>
                <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.83rem', color: 'var(--makay-dark-navy)' }}>{perk}</span>
              </div>
            ))}
          </div>

          {/* Upgrade CTA */}
          {nextInfo?.next && (
            <a href="/membership#tiers" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.75rem 1.5rem', borderRadius: 10,
              background: 'var(--makay-dark-navy)', color: '#fff',
              fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', fontWeight: 700,
              textDecoration: 'none',
            }}>
              <Crown size={14} /> Upgrade Membership
            </a>
          )}
        </div>

        {/* Recent Orders */}
        {orders.length > 0 && (
          <div className="profile-section">
            <div className="profile-section-header">
              <h2 className="profile-section-title">Recent Orders</h2>
              <a href="/orders" style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.8rem', color: 'var(--makay-peachy-rose)', textDecoration: 'none' }}>View all →</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {orders.map(o => (
                <a key={o.id} href={`/orders/${o.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--makay-sand-cream)', borderRadius: '10px', gap: '1rem' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 600, fontSize: '0.8rem', color: 'var(--makay-dark-navy)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.id}</p>
                    <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: 'var(--makay-mauve)', margin: 0 }}>{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize', color: o.status === 'delivered' ? '#10b981' : o.status === 'shipped' ? '#8b5cf6' : '#f59e0b' }}>{o.status}</span>
                    <span style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--makay-peachy-rose)' }}>${Number(o.total).toFixed(2)}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

      </div>
      {tutorialUI}
    </main>
  );
}
