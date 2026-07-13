'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import Image from 'next/image';
import QRCode from 'react-qr-code';
import { Share2, Download, Wallet, Edit3, Check, X } from 'lucide-react';
import { animate } from 'animejs';
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
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [saving, setSaving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/member/${user?.id}`
    : '';

  // Wait for Clerk session before fetching — avoids 401 on first render
  useEffect(() => {
    if (!isLoaded || !user) return;
    fetch('/api/profile')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: UserProfile) => {
        setProfile(data);
        setBioInput(data.bio || '');
      })
      .catch(() => setFetchError(true));
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

          <div className="makay-client-card" ref={cardRef}>
            <div className="makay-card-bg" />
            <div className="makay-card-content">
              <div className="makay-card-top">
                <Image
                  src="/images/2422e513-d2a3-47ad-9574-1b141cd4de8f-1.png"
                  alt="Makay"
                  width={90}
                  height={30}
                  style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                />
                <span className="makay-card-tier" style={{ color: tier.color }}>
                  {tier.label}
                </span>
              </div>
              <div className="makay-card-middle">
                <div className="makay-card-member-row">
                  {user.imageUrl && (
                    <img
                      src={user.imageUrl}
                      alt={user.firstName ?? ''}
                      className="makay-card-avatar"
                    />
                  )}
                  <div>
                    <p className="makay-card-name">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="makay-card-tagline">Beach Club Member</p>
                  </div>
                </div>
              </div>
              <div className="makay-card-bottom">
                <div className="makay-card-qr">
                  {profileUrl && (
                    <QRCode
                      value={profileUrl}
                      size={80}
                      bgColor="transparent"
                      fgColor="#2C2C2C"
                    />
                  )}
                </div>
                <div className="makay-card-details">
                  <p className="makay-card-id">ID: {user.id?.slice(-8).toUpperCase()}</p>
                  <p className="makay-card-since">
                    Since {new Date(user.createdAt!).getFullYear()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
