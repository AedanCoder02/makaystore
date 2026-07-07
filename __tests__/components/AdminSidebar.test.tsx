/**
 * Component tests for AdminSidebar
 */
import React from 'react';

jest.mock('next/link', () => {
  return function MockLink({ href, children, className, 'aria-current': ariaCurrent }: { href: string; children: React.ReactNode; className?: string; 'aria-current'?: string }) {
    return <a href={href} className={className} aria-current={ariaCurrent}>{children}</a>;
  };
});

jest.mock('next/navigation', () => ({
  usePathname: () => '/admin/dashboard',
}));

import { render, screen } from '@testing-library/react';
import AdminSidebar from '@/components/AdminSidebar';

describe('AdminSidebar', () => {
  it('renders the brand name', () => {
    render(<AdminSidebar />);
    expect(screen.getByText('Makay Admin')).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    render(<AdminSidebar />);
    expect(screen.getByText('Panel')).toBeInTheDocument();
    expect(screen.getByText('Productos')).toBeInTheDocument();
    expect(screen.getByText('Pedidos')).toBeInTheDocument();
    expect(screen.getByText('Trabajadores')).toBeInTheDocument();
    expect(screen.getByText('Reportes')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.getByText('Configuración')).toBeInTheDocument();
  });

  it('marks the active route with aria-current="page"', () => {
    render(<AdminSidebar />);
    const panelLink = screen.getByText('Panel').closest('a');
    expect(panelLink).toHaveAttribute('aria-current', 'page');
  });

  it('does not mark non-active routes with aria-current', () => {
    render(<AdminSidebar />);
    const productosLink = screen.getByText('Productos').closest('a');
    expect(productosLink).not.toHaveAttribute('aria-current');
  });

  it('renders as an aside element', () => {
    const { container } = render(<AdminSidebar />);
    expect(container.querySelector('aside')).not.toBeNull();
  });
});
