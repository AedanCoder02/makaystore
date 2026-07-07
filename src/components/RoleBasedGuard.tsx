'use client';

import Link from 'next/link';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface RoleBasedGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'supervisor' | 'worker';
}

export default function RoleBasedGuard({ children, requiredRole }: RoleBasedGuardProps) {
  const { isLoading, hasAccess } = useAdminAuth(requiredRole);

  if (isLoading) {
    return <div className="access-loading">Cargando...</div>;
  }

  if (!hasAccess) {
    return (
      <div className="access-denied">
        <h2>Acceso Denegado</h2>
        <p>No tiene permiso para ver esta página.</p>
        <Link href="/admin/dashboard" className="btn-primary-link">
          Volver al Panel
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
