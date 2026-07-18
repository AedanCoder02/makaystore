'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, ShoppingBag, Clock, ChevronLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const NAV = [
  { href: '/supervisor/dashboard', label: 'Overview',   icon: LayoutDashboard },
  { href: '/supervisor/staff',     label: 'Staff',      icon: Users },
  { href: '/supervisor/orders',    label: 'Orders',     icon: ShoppingBag },
  { href: '/supervisor/shifts',    label: 'Shifts',     icon: Clock },
];

export default function SupervisorSidebar() {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('supervisor-sidebar-collapsed') === 'true') setCollapsed(true);
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('supervisor-sidebar-collapsed', String(next));
  };

  return (
    <aside className={`sup-sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>
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
          <ChevronLeft size={14} /> Back to Store
        </Link>
      )}
      <button
        onClick={toggle}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          background: 'none', border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)',
          color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '0.75rem',
          display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
          gap: '0.5rem', width: '100%', marginTop: 'auto', fontSize: '0.72rem',
          transition: 'color 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
      >
        {collapsed ? <PanelLeftOpen size={16} /> : <><PanelLeftClose size={16} /><span>Collapse</span></>}
      </button>
    </aside>
  );
}
