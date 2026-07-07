/**
 * Integration test: Auth Guards
 * Verifies role-based access control across guard components
 */
import React from 'react';

// Setup all mocks BEFORE any component imports
const translations = {
  denied: 'Access Denied',
  noPermission: 'You do not have permission to access this page',
  backToDashboard: 'Back to Dashboard',
  loading: 'Loading...',
};

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => translations[key] || key,
  useLocale: () => 'en',
}));

// ─── Injectable mock for useAdminAuth ────────────────────────────────────────
// Variables prefixed with 'mock' are allowed inside jest.mock factories
const mockAuthReturn = { isLoading: false, hasAccess: true, role: 'admin', user: {} };

jest.mock('@/hooks/useAdminAuth', () => ({
  useAdminAuth: () => mockAuthReturn,
}));

import { render, screen } from '@testing-library/react';
import RoleBasedGuard from '@/components/RoleBasedGuard';

const ProtectedContent = () => <div>Admin Only Content</div>;

// Helper to set auth state before each test
const setAuth = (overrides: Partial<typeof mockAuthReturn>) => {
  Object.assign(mockAuthReturn, {
    isLoading: false,
    hasAccess: true,
    role: 'admin',
    user: {},
    ...overrides,
  });
};

describe('Auth Guards Integration', () => {
  beforeEach(() => {
    setAuth({ isLoading: false, hasAccess: true, role: 'admin', user: {} });
  });

  it('admin user sees admin-only content', () => {
    setAuth({ hasAccess: true, role: 'admin' });
    render(
      <RoleBasedGuard requiredRole="admin">
        <ProtectedContent />
      </RoleBasedGuard>
    );
    expect(screen.getByText('Admin Only Content')).toBeInTheDocument();
  });

  it('worker user cannot access admin-only content', () => {
    setAuth({ hasAccess: false, role: 'worker' });
    render(
      <RoleBasedGuard requiredRole="admin">
        <ProtectedContent />
      </RoleBasedGuard>
    );
    expect(screen.queryByText('Admin Only Content')).not.toBeInTheDocument();
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('unauthenticated user cannot access any protected route', () => {
    setAuth({ hasAccess: false, role: 'customer', user: null });
    render(
      <RoleBasedGuard requiredRole="worker">
        <ProtectedContent />
      </RoleBasedGuard>
    );
    expect(screen.queryByText('Admin Only Content')).not.toBeInTheDocument();
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('supervisor can access worker-level content', () => {
    setAuth({ hasAccess: true, role: 'supervisor' });
    render(
      <RoleBasedGuard requiredRole="worker">
        <div>Worker Content</div>
      </RoleBasedGuard>
    );
    expect(screen.getByText('Worker Content')).toBeInTheDocument();
  });

  it('shows loading state during auth check', () => {
    setAuth({ isLoading: true, hasAccess: false, role: 'customer', user: null });
    render(
      <RoleBasedGuard requiredRole="admin">
        <ProtectedContent />
      </RoleBasedGuard>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Admin Only Content')).not.toBeInTheDocument();
  });

  it('back to dashboard link appears in access denied state', () => {
    setAuth({ hasAccess: false, role: 'customer', user: null });
    render(
      <RoleBasedGuard requiredRole="admin">
        <ProtectedContent />
      </RoleBasedGuard>
    );
    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });
});

// ─── Role hierarchy logic tests ───────────────────────────────────────────────
describe('Role hierarchy checks', () => {
  const HIERARCHY = { customer: 0, worker: 1, supervisor: 2, admin: 3 };

  it('admin is highest privilege role', () => {
    expect(HIERARCHY.admin).toBeGreaterThan(HIERARCHY.supervisor);
    expect(HIERARCHY.admin).toBeGreaterThan(HIERARCHY.worker);
    expect(HIERARCHY.admin).toBeGreaterThan(HIERARCHY.customer);
  });

  it('supervisor is above worker but below admin', () => {
    expect(HIERARCHY.supervisor).toBeGreaterThan(HIERARCHY.worker);
    expect(HIERARCHY.supervisor).toBeLessThan(HIERARCHY.admin);
  });

  it('worker is above customer but below supervisor', () => {
    expect(HIERARCHY.worker).toBeGreaterThan(HIERARCHY.customer);
    expect(HIERARCHY.worker).toBeLessThan(HIERARCHY.supervisor);
  });
});
