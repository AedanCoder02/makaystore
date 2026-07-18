'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Package, Boxes, ShoppingBag, Box, Clock, Wand2, RefreshCw, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function SellerSidebar() {
  const path = usePathname();
  const t = useTranslations('seller');
  const [collapsed, setCollapsed] = useState(false);

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
