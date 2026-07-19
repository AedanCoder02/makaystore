'use client';

import Image from 'next/image';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { ShoppingBag } from 'lucide-react';

const TIER_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  free:   { label: 'Explorer',  color: '#A89080', desc: 'Beach Club Community Member' },
  member: { label: 'Member',    color: '#D4AF37', desc: 'Beach Club Member — Priority Access' },
  vip:    { label: 'VIP',       color: '#D4A574', desc: 'Beach Club VIP — Full Access' },
};

interface CardColors {
  bg_from: string;
  bg_to: string;
  bg_angle: number;
  text: string;
  accent: string;
}

interface Props {
  firstName: string;
  lastName: string;
  imageUrl: string;
  membershipTier: string;
  memberSince: number;
  userId: string;
  cardColors?: CardColors;
}

export default function MemberCard({ firstName, lastName, imageUrl, membershipTier, memberSince, userId, cardColors }: Props) {
  const tier = TIER_LABELS[membershipTier] ?? TIER_LABELS.free;
  const cardUrl = typeof window !== 'undefined' ? window.location.href : '';
  const gradient = cardColors
    ? `linear-gradient(${cardColors.bg_angle}deg, ${cardColors.bg_from}, ${cardColors.bg_to})`
    : undefined;

  return (
    <main className="member-page">
      <div className="member-page-bg" />

      <div className="member-page-content">
        {/* Branding */}
        <div className="member-brand">
          <Image
            src="/images/2422e513-d2a3-47ad-9574-1b141cd4de8f-1-removebg-preview.png"
            alt="Makay"
            width={120}
            height={40}
            style={{ objectFit: 'contain' }}
          />
        </div>

        {/* Card */}
        <div className="member-card">
          <div className="member-card-bg" style={gradient ? { background: gradient } : undefined} />
          <div className="member-card-inner">
            {/* Top */}
            <div className="member-card-top">
              <Image
                src="/images/2422e513-d2a3-47ad-9574-1b141cd4de8f-1-removebg-preview.png"
                alt="Makay"
                width={70}
                height={24}
                style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
              />
              <span className="member-card-tier-badge">{tier.label}</span>
            </div>

            {/* Middle */}
            <div className="member-card-middle">
              {imageUrl && (
                <img src={imageUrl} alt={firstName} className="member-card-avatar" />
              )}
              <div>
                <p className="member-card-name">{firstName} {lastName}</p>
                <p className="member-card-tagline">Beach Club Member</p>
              </div>
            </div>

            <div className="member-card-divider" />

            {/* Bottom */}
            <div className="member-card-bottom">
              <div>
                <p className="member-card-id">ID: {userId.slice(-8).toUpperCase()}</p>
                <p className="member-card-since">Since {memberSince}</p>
              </div>
              <div className="member-card-qr">
                <QRCode value={typeof window !== 'undefined' ? window.location.href : `https://makaystore-sandy.vercel.app/member/${userId}`} size={64} bgColor="transparent" fgColor="#1e1a16" />
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="member-info-block">
          <p className="member-tier-desc" style={{ color: tier.color }}>{tier.desc}</p>
          <p className="member-verify-note">This card verifies membership at Makay Beach Club.</p>
        </div>

        {/* CTA */}
        <Link href="/products" className="member-shop-btn">
          <ShoppingBag size={18} /> Shop the Collection
        </Link>

        <p className="member-footer-note">
          <Link href="/">makaystore.com</Link>
        </p>
      </div>
    </main>
  );
}
