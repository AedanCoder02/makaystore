'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { LayoutDashboard, Package, Boxes, ShoppingBag, Box, Clock, Wand2, RefreshCw, Calendar, Crown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function SellerSidebar() {
  const path = usePathname();
  const t = useTranslations('seller');
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useUser();
  const permissions = (user?.unsafeMetadata?.permissions as string[] | undefined);

  useEffect(() => {
    const saved = localStorage.getItem('seller-sidebar-collapsed');
    if (saved === 'true') setCollapsed(true);
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('seller-sidebar-collapsed', String(next));
    // Propagate to layout for margin transition
    document.querySelector('.seller-layout')?.classList.toggle('sidebar-collapsed', next);
  };

  // Sync layout class on mount
  useEffect(() => {
    document.querySelector('.seller-layout')?.classList.toggle('sidebar-collapsed', collapsed);
  }, [collapsed]);

  const ALL_NAV = [
    { href: '/seller/dashboard',          label: t('nav.dashboard'), icon: LayoutDashboard, key: null },
    { href: '/seller/sell',               label: t('nav.sell'),      icon: ShoppingBag,     key: 'sell' },
    { href: '/seller/products',           label: t('nav.products'),  icon: Package,         key: 'products' },
    { href: '/seller/stock',              label: t('nav.stock'),     icon: Boxes,           key: 'stock' },
    { href: '/seller/activity',           label: t('nav.activity'),  icon: Clock,           key: 'activity' },
    { href: '/seller/products/create-3d', label: t('nav.models3d'),  icon: Box,             key: 'models3d' },
    { href: '/seller/rotation',           label: t('nav.rotation'),  icon: RefreshCw,       key: 'rotation' },
    { href: '/seller/studio',             label: t('nav.studio'),    icon: Wand2,           key: 'studio' },
    { href: '/seller/events',             label: 'Events',            icon: Calendar,        key: 'events' },
    { href: '/seller/memberships',        label: 'Memberships',       icon: Crown,           key: 'memberships' },
  ];
  // If permissions are set, filter to allowed sections; dashboard is always visible
  const NAV = permissions
    ? ALL_NAV.filter(n => n.key === null || permissions.includes(n.key))
    : ALL_NAV;
  return (
    <aside className={`seller-sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>
      <div className="seller-sidebar-brand">
        {!collapsed && <span className="seller-sidebar-role">{t('role')}</span>}
        {!collapsed && <span className="seller-sidebar-sub">{t('storeName')}</span>}
      </div>
      <nav className="seller-sidebar-nav">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`seller-nav-item${path.startsWith(href) ? ' active' : ''}`}
            title={collapsed ? label : undefined}
          >
            <Icon size={18} />
            {!collapsed && <span className="seller-nav-label">{label}</span>}
          </Link>
        ))}
      </nav>
      {!collapsed && (
        <Link href="/" className="seller-back-link">
          <span className="seller-back-link-label">{t('backToStore')}</span>
        </Link>
      )}
      <button className="sidebar-toggle" onClick={toggle} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        {!collapsed && <span>Collapse</span>}
      </button>
    </aside>
  );
}
