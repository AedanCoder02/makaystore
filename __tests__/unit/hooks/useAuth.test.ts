/**
 * Unit tests for useAuth hook
 */
import { renderHook, act } from '@testing-library/react';

// Mock @clerk/nextjs before import
const mockUseAuth = jest.fn();
const mockUseUser = jest.fn();

jest.mock('@clerk/nextjs', () => ({
  useAuth: () => mockUseAuth(),
  useUser: () => mockUseUser(),
}));

import { useAuth } from '@/hooks/useAuth';

describe('useAuth', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ userId: 'u1', isLoaded: true, isSignedIn: true });
    mockUseUser.mockReturnValue({ user: { publicMetadata: { role: 'admin' } } });
  });

  it('returns userId from clerk', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.userId).toBe('u1');
  });

  it('returns isLoaded true', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoaded).toBe(true);
  });

  it('returns isSignedIn true when user is signed in', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isSignedIn).toBe(true);
  });

  it('returns role from publicMetadata', async () => {
    const { result } = renderHook(() => useAuth());
    // role is set via useEffect — check after mount
    expect(result.current.role).toBe('admin');
  });

  it('isAuthorized returns true for matching role', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthorized(['admin', 'supervisor'])).toBe(true);
  });

  it('isAuthorized returns false for non-matching role', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthorized(['worker', 'customer'])).toBe(false);
  });

  it('defaults role to customer when no publicMetadata', () => {
    mockUseUser.mockReturnValue({ user: { publicMetadata: {} } });
    const { result } = renderHook(() => useAuth());
    expect(result.current.role).toBe('customer');
  });

  it('handles unauthenticated state', () => {
    mockUseAuth.mockReturnValue({ userId: null, isLoaded: true, isSignedIn: false });
    mockUseUser.mockReturnValue({ user: null });
    const { result } = renderHook(() => useAuth());
    expect(result.current.userId).toBeNull();
    expect(result.current.isSignedIn).toBe(false);
  });
});
