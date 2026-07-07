/**
 * Component tests for RoleBasedGuard — auth guard + role access
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

// Must be prefixed with 'mock' to be accessible inside jest.mock factory
const mockAuthReturn = { isLoading: false, hasAccess: true, role: 'admin', user: {} };

jest.mock('@/hooks/useAdminAuth', () => ({
  useAdminAuth: () => mockAuthReturn,
}));

import { render, screen } from '@testing-library/react';
import RoleBasedGuard from '@/components/RoleBasedGuard';

const setAuth = (overrides: Partial<typeof mockAuthReturn>) => {
  Object.assign(mockAuthReturn, {
    isLoading: false,
    hasAccess: true,
    role: 'admin',
    user: {},
    ...overrides,
  });
};

describe('RoleBasedGuard', () => {
  beforeEach(() => {
    setAuth({ isLoading: false, hasAccess: true, role: 'admin', user: {} });
  });

  it('renders children when user has access', () => {
    setAuth({ hasAccess: true, role: 'admin' });
    render(
      <RoleBasedGuard requiredRole="admin">
        <div>Protected Content</div>
      </RoleBasedGuard>
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('shows access denied when user lacks the required role', () => {
    setAuth({ hasAccess: false, role: 'worker' });
    render(
      <RoleBasedGuard requiredRole="admin">
        <div>Protected Content</div>
      </RoleBasedGuard>
    );
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('shows loading state while auth is resolving', () => {
    setAuth({ isLoading: true, hasAccess: false, role: 'customer', user: null });
    render(
      <RoleBasedGuard requiredRole="admin">
        <div>Protected Content</div>
      </RoleBasedGuard>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children without requiredRole restriction', () => {
    setAuth({ hasAccess: true, role: 'customer' });
    render(
      <RoleBasedGuard>
        <div>Public Content</div>
      </RoleBasedGuard>
    );
    expect(screen.getByText('Public Content')).toBeInTheDocument();
  });
});
