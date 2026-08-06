'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, ShoppingBag, Users, BarChart2, Calendar, Crown, Handshake, PanelLeftClose, PanelLeftOpen, Menu, X } from 'lucide-react';

const NAV = [
  { label: 'Panel',       href: '/admin/dashboard',  icon: LayoutDashboard },
  { label: 'Pedidos',     href: '/admin/orders',      icon: ShoppingBag },
  { label: 'Usuarios',    href: '/admin/users',       icon: Users },
  { label: 'Reportes',    href: '/admin/reports',     icon: BarChart2 },
  { label: 'Eventos',     href: '/admin/events',      icon: Calendar },
  { label: 'Membresías',  href: '/admin/memberships', icon: Crown },
  { label: 'Aliados',     href: '/admin/allies',      icon: Handshake },
];

export default function AdminSidebar() {
  const pathname = usePathname();
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
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div
          className="sidebar-mobile-overlay"
          style={{ left: 195 }}
          onClick={() => setMobileOpen(false)}
          role="button"
          aria-label="Cerrar menú"
        />
      )}

      <aside className={`admin-sidebar${collapsed ? ' sidebar-collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        <button className="sidebar-close-mobile" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">
          <X size={18} />
        </button>

        <div className="sidebar-brand">
          {!collapsed && <span className="sidebar-brand-name">Makay Admin</span>}
        </div>
        <nav className="sidebar-nav" aria-label="Admin navigation">
          {NAV.map(({ href, label, icon: Icon }) => (
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
          ))}
        </nav>
        <button className="sidebar-toggle-admin" onClick={toggle} title={collapsed ? 'Expandir' : 'Contraer'}>
          {collapsed ? <PanelLeftOpen size={16} /> : <><PanelLeftClose size={16} /><span>Contraer</span></>}
        </button>
      </aside>
    </>
  );
}
