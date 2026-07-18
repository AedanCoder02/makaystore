'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Users, BarChart2 } from 'lucide-react';

const SIDEBAR_ITEMS = [
  { label: 'Panel',     href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Pedidos',   href: '/admin/orders',    icon: ShoppingBag },
  { label: 'Usuarios',  href: '/admin/users',     icon: Users },
  { label: 'Reportes',  href: '/admin/reports',   icon: BarChart2 },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-name">Makay Admin</span>
      </div>
      <nav className="sidebar-nav" aria-label="Navegación de administración">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item${pathname === item.href ? ' active' : ''}`}
              aria-current={pathname === item.href ? 'page' : undefined}
            >
              <Icon size={18} className="sidebar-icon" />
              <span className="sidebar-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
