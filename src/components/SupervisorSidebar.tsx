'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LayoutDashboard, Users, ShoppingBag, Receipt, Clock, FileBarChart2, ChevronLeft, PanelLeftClose, PanelLeftOpen, Menu, X } from 'lucide-react';
import LocationSwitcher from './LocationSwitcher';

const NAV = [
  { href: '/supervisor/dashboard', key: 'overview', icon: LayoutDashboard },
  { href: '/supervisor/staff', key: 'staff',     icon: Users },
  { href: '/supervisor/orders', key: 'orders',    icon: ShoppingBag },
  { href: '/supervisor/payments', key: 'payments',  icon: Receipt },
  { href: '/supervisor/shifts', key: 'shifts',    icon: Clock },
  { href: '/supervisor/reports', key: 'reports',   icon: FileBarChart2 },
];

export default function SupervisorSidebar() {
  const path = usePathname();
  const t = useTranslations('backoffice');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('supervisor-sidebar-collapsed') === 'true') setCollapsed(true);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [path]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('supervisor-sidebar-collapsed', String(next));
  };

  return (
    <>
      <button
        className="sidebar-ham-btn sidebar-ham-btn--sup"
        onClick={() => setMobileOpen(true)}
        aria-label={t('openMenu')}
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div
          className="sidebar-mobile-overlay"
          style={{ left: 175 }}
          onClick={() => setMobileOpen(false)}
          role="button"
          aria-label={t('closeMenu')}
        />
      )}

      <aside className={`sup-sidebar${collapsed ? ' sidebar-collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        <button className="sidebar-close-mobile sidebar-close-mobile--dark" onClick={() => setMobileOpen(false)} aria-label={t('closeMenu')}>
          <X size={18} />
        </button>

        <div className="sup-sidebar-brand">
          {!collapsed && <span className="sup-sidebar-role">{t('supervisorRole')}</span>}
          {!collapsed && <span className="sup-sidebar-sub">MAKAY STORE</span>}
        </div>
        <LocationSwitcher collapsed={collapsed} />
        <nav className="sup-sidebar-nav" aria-label={t('navLabel')}>
          {NAV.map(({ href, key, icon: Icon }) => { const label = t(`supNav.${key}`); return (
            <Link
              key={href}
              href={href}
              className={`sup-nav-item${path.startsWith(href) ? ' active' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} />
              {!collapsed && <span className="sup-nav-label">{label}</span>}
            </Link>
          ); })}
        </nav>
        {!collapsed && (
          <Link href="/" className="sup-back-link">
            <ChevronLeft size={14} /> {t('backToSite')}
          </Link>
        )}
        <button
          onClick={toggle}
          className="sup-collapse-btn"
          title={collapsed ? t('expand') : t('collapse')}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <><PanelLeftClose size={16} /><span>{t('collapse')}</span></>}
        </button>
      </aside>
    </>
  );
}
