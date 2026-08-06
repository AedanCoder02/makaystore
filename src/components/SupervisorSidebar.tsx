'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, ShoppingBag, Clock, ChevronLeft, PanelLeftClose, PanelLeftOpen, Menu, X } from 'lucide-react';

const NAV = [
  { href: '/supervisor/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/supervisor/staff',     label: 'Staff',    icon: Users },
  { href: '/supervisor/orders',    label: 'Órdenes',  icon: ShoppingBag },
  { href: '/supervisor/shifts',    label: 'Turnos',   icon: Clock },
];

export default function SupervisorSidebar() {
  const path = usePathname();
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
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div
          className="sidebar-mobile-overlay"
          style={{ left: 210 }}
          onClick={() => setMobileOpen(false)}
          role="button"
          aria-label="Cerrar menú"
        />
      )}

      <aside className={`sup-sidebar${collapsed ? ' sidebar-collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        <button className="sidebar-close-mobile sidebar-close-mobile--dark" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">
          <X size={18} />
        </button>

        <div className="sup-sidebar-brand">
          {!collapsed && <span className="sup-sidebar-role">Supervisor</span>}
          {!collapsed && <span className="sup-sidebar-sub">MAKAY STORE</span>}
        </div>
        <nav className="sup-sidebar-nav">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`sup-nav-item${path.startsWith(href) ? ' active' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} />
              {!collapsed && <span className="sup-nav-label">{label}</span>}
            </Link>
          ))}
        </nav>
        {!collapsed && (
          <Link href="/" className="sup-back-link">
            <ChevronLeft size={14} /> Tienda
          </Link>
        )}
        <button
          onClick={toggle}
          className="sup-collapse-btn"
          title={collapsed ? 'Expandir' : 'Contraer'}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <><PanelLeftClose size={16} /><span>Contraer</span></>}
        </button>
      </aside>
    </>
  );
}
