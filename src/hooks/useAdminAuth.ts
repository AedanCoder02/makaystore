'use client';

import { useUser } from '@clerk/nextjs';
import type { UserRole } from '@/lib/auth';

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'supervisor' | 'worker';
  name?: string;
}

export interface AdminNav {
  title: string;
  description: string;
  href: string;
  icon: string;
  requiredRole: 'admin' | 'supervisor' | 'worker';
  badge?: string;
}

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
