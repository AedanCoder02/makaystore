'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useCart } from '@/hooks/useCart';
import LanguageSwitcher from './LanguageSwitcher';

export default function NavBar() {
  const { totalItems } = useCart();
  const t = useTranslations('nav');

  return (
    <header className="navbar">
      <Link href="/" className="navbar-logo">
        Makay
      </Link>
      <nav className="navbar-nav">
        <Link href="/products">{t('products')}</Link>
        <Link href="/cart" className="cart-link">
          <span>🛒</span>
          <span className={`cart-badge${totalItems > 0 ? ' active' : ''}`}>
            {totalItems}
          </span>
        </Link>
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
