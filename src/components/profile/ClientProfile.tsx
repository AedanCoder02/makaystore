'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import Image from 'next/image';
import QRCode from 'react-qr-code';
import { Share2, Download, Wallet, Edit3, Check, X } from 'lucide-react';
import { animate } from 'animejs';
import {
  CardLayout, CardColors,
  DEFAULT_CARD_LAYOUT, DEFAULT_CARD_COLORS,
} from '@/components/CardDesigner';
import '@/styles/profile.css';

interface UserProfile {
  bio: string;
  wallet_balance: string;
  membership_tier: string;
}

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: 'Explorer', color: '#A89080' },
  member: { label: 'Member', color: '#D4AF37' },
  vip: { label: 'VIP', color: '#D4A574' },
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
  const cardRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/member/${user?.id}`
    : '';

  // Wait for Clerk session, then fetch profile + theme in parallel
  useEffect(() => {
    if (!isLoaded || !user) return;
    Promise.all([
      fetch('/api/profile').then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }),
      fetch('/api/theme').then(r => r.json()).catch(() => ({})),
    ]).then(([profileData, themeData]: [UserProfile, Record<string, string>]) => {
      setProfile(profileData);
      setBioInput(profileData.bio || '');
      if (themeData.card_layout) {
        try { setCardLayout(JSON.parse(themeData.card_layout)); } catch {}
      }
      if (themeData.card_colors) {
        try { setCardColors(JSON.parse(themeData.card_colors)); } catch {}
      }
    }).catch(() => setFetchError(true));
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
              <span className="profile-wallet-label">Available Balance</span>
              <span className="profile-wallet-amount">
                ${parseFloat(profile.wallet_balance).toFixed(2)}
              </span>
            </div>
            <span className="profile-wallet-tag">Makay Credits</span>
          </div>
        </div>

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
            {cardLayout.logo.visible && (
              <div style={{ position: 'absolute', left: `${cardLayout.logo.x}%`, top: `${cardLayout.logo.y}%`, zIndex: 1 }}>
                <Image
                  src="/images/2422e513-d2a3-47ad-9574-1b141cd4de8f-1-removebg-preview.png"
                  alt="Makay" width={70} height={24}
                  style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)', display: 'block' }}
                />
              </div>
            )}

            {/* Tier badge */}
            {cardLayout.tier.visible && (
              <div style={{ position: 'absolute', left: `${cardLayout.tier.x}%`, top: `${cardLayout.tier.y}%`, zIndex: 1 }}>
                <span className="makay-card-tier" style={{ color: cardColors.accent, borderColor: `${cardColors.accent}55` }}>
                  {tier.label}
                </span>
              </div>
            )}

            {/* Avatar */}
            {cardLayout.avatar.visible && user.imageUrl && (
              <div style={{ position: 'absolute', left: `${cardLayout.avatar.x}%`, top: `${cardLayout.avatar.y}%`, zIndex: 1 }}>
                <img src={user.imageUrl} alt={user.firstName ?? ''} className="makay-card-avatar"
                  style={{ borderColor: `${cardColors.accent}80` }} />
              </div>
            )}

            {/* Name */}
            {cardLayout.name.visible && (
              <div style={{ position: 'absolute', left: `${cardLayout.name.x}%`, top: `${cardLayout.name.y}%`, zIndex: 1 }}>
                <p className="makay-card-name" style={{ color: cardColors.text }}>
                  {user.firstName} {user.lastName}
                </p>
              </div>
            )}

            {/* Tagline */}
            {cardLayout.tagline.visible && (
              <div style={{ position: 'absolute', left: `${cardLayout.tagline.x}%`, top: `${cardLayout.tagline.y}%`, zIndex: 1 }}>
                <p className="makay-card-tagline" style={{ color: `${cardColors.accent}B0` }}>Beach Club Member</p>
              </div>
            )}

            {/* Divider */}
            {cardLayout.divider.visible && (
              <div style={{ position: 'absolute', left: 0, right: 0, top: `${cardLayout.divider.y}%`, zIndex: 1 }}>
                <div className="makay-card-divider" />
              </div>
            )}

            {/* ID */}
            {cardLayout.id.visible && (
              <div style={{ position: 'absolute', left: `${cardLayout.id.x}%`, top: `${cardLayout.id.y}%`, zIndex: 1 }}>
                <p className="makay-card-id" style={{ color: `${cardColors.text}88` }}>
                  ID: {user.id?.slice(-8).toUpperCase()}
                </p>
              </div>
            )}

            {/* Since */}
            {cardLayout.since.visible && (
              <div style={{ position: 'absolute', left: `${cardLayout.since.x}%`, top: `${cardLayout.since.y}%`, zIndex: 1 }}>
                <p className="makay-card-since" style={{ color: `${cardColors.text}44` }}>
                  Since {new Date(user.createdAt!).getFullYear()}
                </p>
              </div>
            )}

            {/* QR */}
            {cardLayout.qr.visible && profileUrl && (
              <div style={{ position: 'absolute', left: `${cardLayout.qr.x}%`, top: `${cardLayout.qr.y}%`, zIndex: 1 }}>
                <div className="makay-card-qr">
                  <QRCode value={profileUrl} size={68} bgColor="transparent" fgColor="#1e1a16" />
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
