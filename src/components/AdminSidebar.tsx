'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItem {
  label: string;
  href: string;
  icon: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Panel', href: '/admin/dashboard', icon: '📊' },
  { label: 'Productos', href: '/admin/products', icon: '📦' },
  { label: 'Pedidos', href: '/admin/orders', icon: '🛒' },
  { label: 'Trabajadores', href: '/admin/workers', icon: '👥' },
  { label: 'Reportes', href: '/admin/reports', icon: '📈' },
  { label: 'Configuración', href: '/admin/settings', icon: '⚙️' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">🏪</span>
        <span className="sidebar-brand-name">Makay Admin</span>
      </div>
      <nav className="sidebar-nav" aria-label="Navegación de administración">
        {SIDEBAR_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-item${pathname === item.href ? ' active' : ''}`}
            aria-current={pathname === item.href ? 'page' : undefined}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
