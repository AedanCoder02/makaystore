'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, ShoppingBag, Users, BarChart2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const NAV = [
  { label: 'Panel',    href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Pedidos',  href: '/admin/orders',    icon: ShoppingBag },
  { label: 'Usuarios', href: '/admin/users',      icon: Users },
  { label: 'Reportes', href: '/admin/reports',    icon: BarChart2 },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('admin-sidebar-collapsed') === 'true') setCollapsed(true);
  }, []);

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
    <aside className={`admin-sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>
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
      <button className="sidebar-toggle-admin" onClick={toggle} title={collapsed ? 'Expand' : 'Collapse'}>
        {collapsed ? <PanelLeftOpen size={16} /> : <><PanelLeftClose size={16} /><span>Collapse</span></>}
      </button>
    </aside>
  );
}
