'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useCart } from '@/hooks/useCart';
import { useUser, SignOutButton } from '@clerk/nextjs';
import { useState } from 'react';
import { ShoppingCart, User, ChevronDown, LayoutDashboard, ClipboardList } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

export default function NavBar() {
  const { totalItems } = useCart();
  const t = useTranslations('nav');
  const { isSignedIn, user } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <Link href="/" className="navbar-logo">
        <Image
          src="/images/2422e513-d2a3-47ad-9574-1b141cd4de8f-1.png"
          alt="Makay"
          width={120}
          height={40}
          style={{ objectFit: 'contain' }}
          priority
        />
      </Link>
      <nav className="navbar-nav">
        <Link href="/products">{t('products')}</Link>
        <Link href="/cart" className="cart-link">
          <ShoppingCart size={20} />
          <span className={`cart-badge${totalItems > 0 ? ' active' : ''}`}>
            {totalItems}
          </span>
        </Link>
        <LanguageSwitcher />

        {isSignedIn ? (
          <div className="navbar-user-menu" onMouseLeave={() => setMenuOpen(false)}>
            <button
              className="navbar-user-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              onMouseEnter={() => setMenuOpen(true)}
            >
              <User size={18} />
              <span className="navbar-user-name">{user?.firstName ?? 'Account'}</span>
              <ChevronDown size={14} />
            </button>
            {menuOpen && (
              <div className="navbar-dropdown">
                <Link href="/admin/dashboard" className="navbar-dropdown-item" onClick={() => setMenuOpen(false)}>
                  <LayoutDashboard size={16} />
                  Admin
                </Link>
                <Link href="/supervisor/dashboard" className="navbar-dropdown-item" onClick={() => setMenuOpen(false)}>
                  <ClipboardList size={16} />
                  Supervisor
                </Link>
                <div className="navbar-dropdown-divider" />
                <SignOutButton>
                  <button className="navbar-dropdown-item navbar-dropdown-signout">
                    Sign Out
                  </button>
                </SignOutButton>
              </div>
            )}
          </div>
        ) : (
          <Link href="/sign-in" className="navbar-signin-btn">
            <User size={16} />
            Sign In
          </Link>
        )}
      </nav>
    </header>
  );
}
