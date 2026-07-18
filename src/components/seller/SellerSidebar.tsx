'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, Package, Boxes, ShoppingBag, Box, Clock, Wand2, RefreshCw } from 'lucide-react';

export default function SellerSidebar() {
  const path = usePathname();
  const t = useTranslations('seller');

  const NAV = [
    { href: '/seller/dashboard',          label: t('nav.dashboard'), icon: LayoutDashboard },
    { href: '/seller/sell',               label: t('nav.sell'),      icon: ShoppingBag },
    { href: '/seller/products',           label: t('nav.products'),  icon: Package },
    { href: '/seller/stock',              label: t('nav.stock'),     icon: Boxes },
    { href: '/seller/activity',           label: t('nav.activity'),  icon: Clock },
    { href: '/seller/products/create-3d', label: t('nav.models3d'),  icon: Box },
    { href: '/seller/rotation',           label: t('nav.rotation'),  icon: RefreshCw },
    { href: '/seller/studio',             label: t('nav.studio'),    icon: Wand2 },
  ];

  return (
    <aside className="seller-sidebar">
      <div className="seller-sidebar-brand">
        <span className="seller-sidebar-role">{t('role')}</span>
        <span className="seller-sidebar-sub">{t('storeName')}</span>
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
      <Link href="/" className="seller-back-link">{t('backToStore')}</Link>
    </aside>
  );
}
