'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, ShoppingBag, Users, BarChart2, Calendar, Crown, Handshake, Target, PanelLeftClose, PanelLeftOpen, Menu, X, Contact, Wallet, Receipt, Star } from 'lucide-react';
import LocationSwitcher from './LocationSwitcher';

const NAV = [
  { key: 'dashboard',   href: '/admin/dashboard',  icon: LayoutDashboard },
  { key: 'orders',      href: '/admin/orders',      icon: ShoppingBag },
  { key: 'payments',    href: '/admin/payments',    icon: Receipt },
  { key: 'users',       href: '/admin/users',       icon: Users },
  { key: 'clients',     href: '/admin/clients',     icon: Contact },
  { key: 'reports',     href: '/admin/reports',     icon: BarChart2 },
  { key: 'goals',       href: '/admin/yimi-goals',  icon: Target },
  { key: 'events',      href: '/admin/events',      icon: Calendar },
  { key: 'memberships', href: '/admin/memberships', icon: Crown },
  { key: 'reviews',     href: '/admin/reviews',     icon: Star },
  { key: 'allies',      href: '/admin/allies',      icon: Handshake },
  { key: 'payroll',     href: '/admin/payroll',     icon: Wallet },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const t = useTranslations('backoffice');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('admin-sidebar-collapsed') === 'true') setCollapsed(true);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('admin-sidebar-collapsed', String(next));
    document.querySelector('.admin-layout')?.classList.toggle('sidebar-collapsed', next);
  };

  useEffect(() => {
    document.querySelector('.admin-layout')?.classList.toggle('sidebar-collapsed', collapsed);
  }, [collapsed]);

  return (
    <>
      <button
        className="sidebar-ham-btn sidebar-ham-btn--admin"
        onClick={() => setMobileOpen(true)}
        aria-label={t('openMenu')}
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div
          className="sidebar-mobile-overlay"
          style={{ left: 195 }}
          onClick={() => setMobileOpen(false)}
          role="button"
          aria-label={t('closeMenu')}
        />
      )}

      <aside className={`admin-sidebar${collapsed ? ' sidebar-collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        <button className="sidebar-close-mobile" onClick={() => setMobileOpen(false)} aria-label={t('closeMenu')}>
          <X size={18} />
        </button>

        <div className="sidebar-brand">
          {!collapsed && <span className="sidebar-brand-name">Makay Admin</span>}
        </div>
        <LocationSwitcher collapsed={collapsed} />
        <nav className="sidebar-nav" aria-label={t('navLabel')}>
          {NAV.map(({ href, key, icon: Icon }) => { const label = t(`adminNav.${key}`); return (
            <Link
              key={href}
              href={href}
              className={`sidebar-item${pathname === href ? ' active' : ''}`}
              aria-current={pathname === href ? 'page' : undefined}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="sidebar-icon" />
              {!collapsed && <span className="sidebar-label">{label}</span>}
            </Link>
          ); })}
        </nav>
        <button className="sidebar-toggle-admin" onClick={toggle} title={collapsed ? t('expand') : t('collapse')}>
          {collapsed ? <PanelLeftOpen size={16} /> : <><PanelLeftClose size={16} /><span>{t('collapse')}</span></>}
        </button>
      </aside>
    </>
  );
}
