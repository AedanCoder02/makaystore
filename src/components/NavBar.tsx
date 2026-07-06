'use client';

import Link from 'next/link';
import { useCart } from '@/hooks/useCart';

export default function NavBar() {
  const { totalItems } = useCart();

  return (
    <header className="navbar">
      <Link href="/" className="navbar-logo">
        Makay
      </Link>
      <nav className="navbar-nav">
        <Link href="/products">Productos</Link>
        <Link href="/cart" className="cart-link">
          <span>🛒</span>
          <span className={`cart-badge${totalItems > 0 ? ' active' : ''}`}>
            {totalItems}
          </span>
        </Link>
      </nav>
    </header>
  );
}
