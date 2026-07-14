'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Boxes, ShoppingBag } from 'lucide-react';

const NAV = [
  { href: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/seller/sell',      label: 'Sell',       icon: ShoppingBag },
  { href: '/seller/products',  label: 'Products',   icon: Package },
  { href: '/seller/stock',     label: 'Stock',      icon: Boxes },
];

export default function SellerSidebar() {
  const path = usePathname();
  return (
    <aside className="seller-sidebar">
      <div className="seller-sidebar-brand">
        <span className="seller-sidebar-role">Seller</span>
        <span className="seller-sidebar-sub">Makay Store</span>
      </div>
      <nav className="seller-sidebar-nav">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`seller-nav-item${path.startsWith(href) ? ' active' : ''}`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
      <Link href="/" className="seller-back-link">← Back to Store</Link>
    </aside>
  );
}
