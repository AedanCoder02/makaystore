'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface RoleBasedGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'supervisor' | 'worker';
}

export default function RoleBasedGuard({ children, requiredRole }: RoleBasedGuardProps) {
  const { isLoading, hasAccess } = useAdminAuth(requiredRole);
  const t = useTranslations('access');

  if (isLoading) {
    return <div className="access-loading">{t('loading')}</div>;
  }

  if (!hasAccess) {
    return (
      <div className="access-denied">
        <h2>{t('denied')}</h2>
        <p>{t('noPermission')}</p>
        <Link href="/admin/dashboard" className="btn-primary-link">
          {t('backToDashboard')}
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
