'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import Image from 'next/image';
import QRCode from 'react-qr-code';
import { Share2, Download, Wallet, Edit3, Check, X, HelpCircle } from 'lucide-react';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';
import { animate } from 'animejs';
import {
  CardLayout, CardColors,
  DEFAULT_CARD_LAYOUT, DEFAULT_CARD_COLORS,
} from '@/components/CardDesigner';
import '@/styles/profile.css';

interface WalletTransaction {
  id: number;
  type: 'earn' | 'spend' | 'admin_credit';
  points: number;
  description: string;
  created_at: string;
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
  free:   ['Access to the Makay catalog', 'Member QR card'],
  bronze: ['Early access to new drops', 'Member QR card', '5% loyalty credit'],
  silver: ['Priority event tickets', 'Bronze perks', '10% loyalty credit'],
  gold:   ['VIP event access', 'Silver perks', '15% loyalty credit', 'Personal stylist'],
  vip:    ['All perks', 'Exclusive collections', '20% loyalty credit', 'Complimentary alterations'],
  member: ['Access to the Makay catalog', 'Member QR card'],
};

const TIER_NEXT: Record<string, { next: string; spend: number }> = {
  free:   { next: 'Bronze', spend: 100  },
  bronze: { next: 'Silver', spend: 300  },
  silver: { next: 'Gold',   spend: 700  },
  gold:   { next: 'VIP',    spend: 1500 },
  vip:    { next: '',       spend: 0    },
  member: { next: 'Bronze', spend: 100  },
};

export default function ClientProfile() {
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [cardLayout, setCardLayout] = useState<CardLayout>(DEFAULT_CARD_LAYOUT);
  const [cardColors, setCardColors] = useState<CardColors>(DEFAULT_CARD_COLORS);
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [walletPoints, setWalletPoints] = useState(0);
  const [walletTx, setWalletTx] = useState<WalletTransaction[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/member/${user?.id}`
    : '';

  const tutorialStore = useTutorialStore();
  const tutorialUI = useTutorialOverlay('profile-tour');

  // Wait for Clerk session, then fetch profile + theme in parallel
  useEffect(() => {
    if (!isLoaded || !user) return;
    Promise.all([
      fetch('/api/profile').then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }),
      fetch('/api/theme').then(r => r.json()).catch(() => ({})),
      fetch('/api/orders').then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('/api/wallet').then(r => r.ok ? r.json() : { points: 0, transactions: [] }).catch(() => ({ points: 0, transactions: [] })),
    ]).then(([profileData, themeData, ordersData, walletData]: [UserProfile, Record<string, string>, OrderSummary[], { points: number; transactions: WalletTransaction[] }]) => {
      setProfile(profileData);
      setBioInput(profileData.bio || '');
      setOrders(Array.isArray(ordersData) ? ordersData.slice(0, 5) : []);
      setWalletPoints(walletData.points ?? 0);
      setWalletTx(walletData.transactions ?? []);
      if (themeData.card_layout) {
        try { setCardLayout(JSON.parse(themeData.card_layout)); } catch {}
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

  // Helper: absolute element wrapper that applies position + scale from cardLayout
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

        {/* Bio */}
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

        {/* Wallet */}
        <div className="profile-section">
          <div className="profile-section-header">
            <h2 className="profile-section-title">Wallet</h2>
          </div>
          <div className="profile-wallet-card">
            <Wallet size={28} className="profile-wallet-icon" />
            <div className="profile-wallet-info">
              <span className="profile-wallet-label">Points Balance</span>
              <span className="profile-wallet-amount">{walletPoints.toLocaleString()} pts</span>
            </div>
            <span className="profile-wallet-tag">Makay Points</span>
          </div>

          {walletTx.length > 0 && (
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--makay-mauve)', margin: '0 0 0.35rem' }}>Recent Activity</p>
              {walletTx.slice(0, 8).map(tx => {
                const isEarn = tx.type === 'earn' || tx.type === 'admin_credit';
                return (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.75rem', background: 'var(--makay-sand-cream)', borderRadius: 8, gap: '0.75rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-dark-navy)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description || (isEarn ? 'Points earned' : 'Points redeemed')}</p>
                      <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', color: 'var(--makay-mauve)', margin: 0 }}>{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                    <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '0.88rem', color: isEarn ? '#10b981' : '#ef4444', flexShrink: 0 }}>
                      {isEarn ? '+' : '-'}{Math.abs(tx.points)} pts
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Membership Perks */}
        <div className="profile-section">
          <div className="profile-section-header">
            <h2 className="profile-section-title">Membership — {tier.label}</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(TIER_PERKS[profile.membership_tier] ?? TIER_PERKS.free).map((perk, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.85rem', color: 'var(--makay-dark-navy)' }}>
                <span style={{ color: tier.color, fontSize: '1rem' }}>✓</span> {perk}
              </div>
            ))}
          </div>
          {TIER_NEXT[profile.membership_tier]?.next && (
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: 'var(--makay-mauve)', marginTop: '0.75rem' }}>
              Spend ${TIER_NEXT[profile.membership_tier].spend} total to unlock {TIER_NEXT[profile.membership_tier].next}.
            </p>
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

        {/* Client Card */}
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

            {/* Divider — spans full width, skip x positioning */}
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
                  <QRCode value={profileUrl} size={68} bgColor="transparent" fgColor="#1e1a16" />
                </div>
              </CardEl>
            )}
          </div>
        </div>

      </div>
      {tutorialUI}
    </main>
  );
}
