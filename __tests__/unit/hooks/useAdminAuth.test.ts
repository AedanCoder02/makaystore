/**
 * Unit tests for useAdminAuth hook
 */
import { renderHook } from '@testing-library/react';

// Mock Clerk before importing hook
jest.mock('@clerk/nextjs', () => require('../../mocks/clerk.js'));

describe('useAdminAuth', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  const renderAdminAuth = (requiredRole?: 'admin' | 'supervisor' | 'worker') => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useAdminAuth } = require('@/hooks/useAdminAuth');
    return renderHook(() => useAdminAuth(requiredRole));
  };

  it('returns hasAccess=true when no requiredRole is given', () => {
    const { result } = renderAdminAuth();
    expect(result.current.hasAccess).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('admin user has access to all roles', () => {
    const { result: admin } = renderAdminAuth('admin');
    expect(admin.current.hasAccess).toBe(true);

    const { result: supervisor } = renderAdminAuth('supervisor');
    expect(supervisor.current.hasAccess).toBe(true);

    const { result: worker } = renderAdminAuth('worker');
    expect(worker.current.hasAccess).toBe(true);
  });

  it('returns the user role from publicMetadata', () => {
    const { result } = renderAdminAuth();
    expect(result.current.role).toBe('admin');
  });

  it('returns the user object', () => {
    const { result } = renderAdminAuth();
    expect(result.current.user).toBeDefined();
    expect(result.current.user?.publicMetadata?.role).toBe('admin');
  });

  it('returns hasAccess=false when Clerk returns null user (unauthenticated)', () => {
    // Override mock to return null user
    jest.doMock('@clerk/nextjs', () => ({
      useUser: jest.fn(() => ({ user: null, isLoaded: true, isSignedIn: false })),
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useAdminAuth } = require('@/hooks/useAdminAuth');
    const { result } = renderHook(() => useAdminAuth('admin'));

    expect(result.current.hasAccess).toBe(false);
  });
});
