'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, ShoppingBag, Clock, ChevronLeft } from 'lucide-react';

const NAV = [
  { href: '/supervisor/dashboard', label: 'Overview',   icon: LayoutDashboard },
  { href: '/supervisor/staff',     label: 'Staff',      icon: Users },
  { href: '/supervisor/orders',    label: 'Orders',     icon: ShoppingBag },
  { href: '/supervisor/shifts',    label: 'Shifts',     icon: Clock },
];

export default function SupervisorSidebar() {
  const path = usePathname();

  return (
    <aside className="sup-sidebar">
      <div className="sup-sidebar-brand">
        <span className="sup-sidebar-role">Supervisor</span>
        <span className="sup-sidebar-sub">MAKAY STORE</span>
      </div>
      <nav className="sup-sidebar-nav">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`sup-nav-item${path.startsWith(href) ? ' active' : ''}`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
      <Link href="/" className="sup-back-link">
        <ChevronLeft size={14} /> Back to Store
      </Link>
    </aside>
  );
}
