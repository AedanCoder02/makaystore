/**
 * @jest-environment node
 */
// next/server needs the Fetch API globals (Request/Response/Headers), which
// jsdom (this project's default test environment) doesn't provide.
jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn(), currentUser: jest.fn() }));
const mockSql: any = jest.fn(() => Promise.resolve([]));
jest.mock('@/lib/db', () => ({ __esModule: true, default: mockSql }));

import { auth, currentUser } from '@clerk/nextjs/server';

function makeRequest(body: Record<string, unknown>) {
  return { json: async () => body } as any;
}

describe('PATCH /api/admin/theme', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects an unauthenticated request', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: null });
    const { PATCH } = await import('@/app/api/admin/theme/route');
    const res = await PATCH(makeRequest({}));
    expect(res.status).toBe(401);
  });

  it('allows a user with role admin', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_1' });
    (currentUser as jest.Mock).mockResolvedValue({ publicMetadata: { role: 'admin' } });
    const { PATCH } = await import('@/app/api/admin/theme/route');
    const res = await PATCH(makeRequest({ heroTitle: 'x' }));
    expect(res.status).toBe(200);
  });

  it('allows a seller with the studio permission (Studio is reachable from the seller panel)', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_2' });
    (currentUser as jest.Mock).mockResolvedValue({
      publicMetadata: { role: 'seller' },
      unsafeMetadata: { permissions: ['sell', 'studio'] },
    });
    const { PATCH } = await import('@/app/api/admin/theme/route');
    const res = await PATCH(makeRequest({ heroTitle: 'x' }));
    expect(res.status).toBe(200);
  });

  it('rejects a seller WITHOUT the studio permission', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_3' });
    (currentUser as jest.Mock).mockResolvedValue({
      publicMetadata: { role: 'seller' },
      unsafeMetadata: { permissions: ['sell'] },
    });
    const { PATCH } = await import('@/app/api/admin/theme/route');
    const res = await PATCH(makeRequest({ heroTitle: 'x' }));
    expect(res.status).toBe(403);
  });

  it('rejects a plain customer with no permissions at all', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_4' });
    (currentUser as jest.Mock).mockResolvedValue({ publicMetadata: { role: 'customer' } });
    const { PATCH } = await import('@/app/api/admin/theme/route');
    const res = await PATCH(makeRequest({ heroTitle: 'x' }));
    expect(res.status).toBe(403);
  });

  it('rejects a customer who spoofs their own unsafeMetadata.permissions to include "studio"', async () => {
    // unsafeMetadata is Clerk's user-editable bucket — any signed-in user can
    // rewrite it client-side via the Clerk SDK. This is the exact attack the
    // permission check must not fall for: a plain customer (role unchanged,
    // since publicMetadata is backend-only) sets their own unsafeMetadata to
    // claim the 'studio' permission and must still be rejected.
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_5' });
    (currentUser as jest.Mock).mockResolvedValue({
      publicMetadata: { role: 'customer' },
      unsafeMetadata: { permissions: ['studio'] },
    });
    const { PATCH } = await import('@/app/api/admin/theme/route');
    const res = await PATCH(makeRequest({ heroTitle: 'x' }));
    expect(res.status).toBe(403);
  });

  it('allows a supervisor with the studio permission', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_6' });
    (currentUser as jest.Mock).mockResolvedValue({
      publicMetadata: { role: 'supervisor' },
      unsafeMetadata: { permissions: ['studio'] },
    });
    const { PATCH } = await import('@/app/api/admin/theme/route');
    const res = await PATCH(makeRequest({ heroTitle: 'x' }));
    expect(res.status).toBe(200);
  });
});
