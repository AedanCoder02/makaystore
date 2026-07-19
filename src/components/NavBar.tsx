'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useCart } from '@/hooks/useCart';
import { useUser, SignOutButton } from '@clerk/nextjs';
import { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart, User, ChevronDown, LayoutDashboard,
  ClipboardList, UserCircle, Menu, X, Store,
} from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

export default function NavBar() {
  const { totalItems: rawTotal } = useCart();
  const t = useTranslations('nav');
  const { isSignedIn, user } = useUser();
  const role = (user?.publicMetadata?.role as string) ?? 'customer';
  const isStaff = role === 'admin' || role === 'supervisor' || role === 'worker' || role === 'seller';
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => { setMounted(true); }, []);
  const totalItems = mounted ? rawTotal : 0;

  const openMenu = () => { clearTimeout(closeTimer.current); setMenuOpen(true); };
  const scheduleClose = () => { closeTimer.current = setTimeout(() => setMenuOpen(false), 150); };
  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <header className="navbar">
        <Link href="/" className="navbar-logo" onClick={closeMobile}>
          <Image
            src="/images/2422e513-d2a3-47ad-9574-1b141cd4de8f-1-removebg-preview.png"
            alt="Makay"
            width={120}
            height={40}
            className="navbar-logo-img"
            style={{ objectFit: 'contain' }}
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="navbar-nav navbar-desktop">
          <Link href="/products">{t('products')}</Link>
          <Link href="/events">Events</Link>
          <Link href="/cart" className="cart-link">
            <ShoppingCart size={20} />
            <span className={`cart-badge${totalItems > 0 ? ' active' : ''}`}>
              {totalItems}
            </span>
          </Link>
          <LanguageSwitcher />

          {isSignedIn ? (
            <div className="navbar-user-menu" onMouseEnter={openMenu} onMouseLeave={scheduleClose}>
              <button
                className="navbar-user-btn"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <User size={18} />
                <span className="navbar-user-name">{user?.firstName ?? 'Account'}</span>
                <ChevronDown size={14} />
              </button>
              {menuOpen && (
                <div className="navbar-dropdown">
                  <Link href="/profile" className="navbar-dropdown-item" onClick={() => setMenuOpen(false)}>
                    <UserCircle size={16} />
                    My Profile
                  </Link>
                  {isStaff && (
                    <>
                      <div className="navbar-dropdown-divider" />
                      {(role === 'seller' || role === 'admin') && (
                        <Link href="/seller/dashboard" className="navbar-dropdown-item" onClick={() => setMenuOpen(false)}>
                          <Store size={16} />
                          Seller
                        </Link>
                      )}
                      {(role === 'admin') && (
                        <Link href="/admin/dashboard" className="navbar-dropdown-item" onClick={() => setMenuOpen(false)}>
                          <LayoutDashboard size={16} />
                          Admin
                        </Link>
                      )}
                      {(role === 'admin' || role === 'supervisor') && (
                        <Link href="/supervisor/dashboard" className="navbar-dropdown-item" onClick={() => setMenuOpen(false)}>
                          <ClipboardList size={16} />
                          Supervisor
                        </Link>
                      )}
                    </>
                  )}
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

        {/* Mobile right side */}
        <div className="navbar-mobile-right">
          <Link href="/cart" className="cart-link">
            <ShoppingCart size={22} />
            <span className={`cart-badge${totalItems > 0 ? ' active' : ''}`}>
              {totalItems}
            </span>
          </Link>
          <button
            className="navbar-hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="navbar-mobile-menu">
          <nav className="navbar-mobile-nav">
            <Link href="/products" className="navbar-mobile-link" onClick={closeMobile}>
              {t('products')}
            </Link>

            {isSignedIn ? (
              <>
                <Link href="/profile" className="navbar-mobile-link" onClick={closeMobile}>
                  <UserCircle size={18} /> My Profile
                </Link>
                {(role === 'seller' || role === 'admin') && (
                  <Link href="/seller/dashboard" className="navbar-mobile-link" onClick={closeMobile}>
                    <Store size={18} /> Seller
                  </Link>
                )}
                {role === 'admin' && (
                  <Link href="/admin/dashboard" className="navbar-mobile-link" onClick={closeMobile}>
                    <LayoutDashboard size={18} /> Admin
                  </Link>
                )}
                {(role === 'admin' || role === 'supervisor') && (
                  <Link href="/supervisor/dashboard" className="navbar-mobile-link" onClick={closeMobile}>
                    <ClipboardList size={18} /> Supervisor
                  </Link>
                )}
                <div className="navbar-mobile-divider" />
                <div className="navbar-mobile-lang">
                  <LanguageSwitcher />
                </div>
                <SignOutButton>
                  <button className="navbar-mobile-signout" onClick={closeMobile}>
                    Sign Out
                  </button>
                </SignOutButton>
              </>
            ) : (
              <>
                <div className="navbar-mobile-lang">
                  <LanguageSwitcher />
                </div>
                <Link href="/sign-in" className="navbar-mobile-signin" onClick={closeMobile}>
                  <User size={18} /> Sign In
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
