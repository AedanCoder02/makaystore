'use client';

import { useUser } from '@clerk/nextjs';
import type { UserRole } from '@/lib/auth';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  customer: 0,
  worker: 1,
  supervisor: 2,
  admin: 3,
};

export const useAdminAuth = (requiredRole?: 'admin' | 'supervisor' | 'worker') => {
  const { user, isLoaded } = useUser();

  const role = ((user?.publicMetadata?.role as UserRole) || 'customer') as UserRole;

  const hasAccess = !requiredRole
    ? true
    : ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole as UserRole];

  return {
    user,
    role,
    hasAccess,
    isLoading: !isLoaded,
  };
};
