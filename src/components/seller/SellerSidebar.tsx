'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { LayoutDashboard, Package, Boxes, ShoppingBag, Box, Clock, Wand2, RefreshCw, Calendar, Crown, PanelLeftClose, PanelLeftOpen, Menu, X } from 'lucide-react';

export default function SellerSidebar() {
  const path = usePathname();
  const t = useTranslations('seller');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useUser();
  const permissions = (user?.unsafeMetadata?.permissions as string[] | undefined);

  useEffect(() => {
    const saved = localStorage.getItem('seller-sidebar-collapsed');
    if (saved === 'true') setCollapsed(true);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [path]);

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('seller-sidebar-collapsed', String(next));
    document.querySelector('.seller-layout')?.classList.toggle('sidebar-collapsed', next);
  };

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
    { href: '/seller/events',             label: t('nav.events'),    icon: Calendar,        key: 'events' },
    { href: '/seller/memberships',        label: t('nav.memberships'), icon: Crown,         key: 'memberships' },
  ];
  const NAV = permissions
    ? ALL_NAV.filter(n => n.key === null || permissions.includes(n.key))
    : ALL_NAV;

  return (
    <>
      {/* Mobile hamburger — fixed, always visible on mobile */}
      <button
        className="sidebar-ham-btn sidebar-ham-btn--seller"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      {/* Overlay backdrop — starts at sidebar edge so it never covers nav items */}
      {mobileOpen && (
        <div
          className="sidebar-mobile-overlay"
          style={{ left: 220 }}
          onClick={() => setMobileOpen(false)}
          role="button"
          aria-label="Cerrar menú"
        />
      )}

      <aside className={`seller-sidebar${collapsed ? ' sidebar-collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        {/* Mobile close button */}
        <button className="sidebar-close-mobile" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">
          <X size={18} />
        </button>

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
        <button className="sidebar-toggle" onClick={toggle} title={collapsed ? 'Expandir' : 'Contraer'}>
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          {!collapsed && <span>Contraer</span>}
        </button>
      </aside>
    </>
  );
}
