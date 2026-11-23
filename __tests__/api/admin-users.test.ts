/**
 * @jest-environment node
 */
// next/server needs the Fetch API globals (Request/Response/Headers), which
// jsdom (this project's default test environment) doesn't provide.
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
  currentUser: jest.fn(),
  clerkClient: jest.fn(),
}));

import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';

function makeRequest(body: Record<string, unknown>) {
  return { json: async () => body } as any;
}

describe('GET /api/admin/users', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects an unauthenticated request', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: null });
    const { GET } = await import('@/app/api/admin/users/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('rejects a plain customer (no role check previously meant any signed-in user could list every account)', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_1' });
    (currentUser as jest.Mock).mockResolvedValue({ publicMetadata: { role: 'customer' } });
    const { GET } = await import('@/app/api/admin/users/route');
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('allows an admin', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: 'admin_1' });
    (currentUser as jest.Mock).mockResolvedValue({ publicMetadata: { role: 'admin' } });
    (clerkClient as jest.Mock).mockResolvedValue({
      users: { getUserList: jest.fn().mockResolvedValue({ data: [] }) },
    });
    const { GET } = await import('@/app/api/admin/users/route');
    const res = await GET();
    expect(res.status).toBe(200);
  });
});

describe('PATCH /api/admin/users/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects an unauthenticated request', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: null });
    const { PATCH } = await import('@/app/api/admin/users/[id]/route');
    const res = await PATCH(makeRequest({ role: 'admin' }), { params: Promise.resolve({ id: 'target_1' }) });
    expect(res.status).toBe(401);
  });

  it('rejects a plain customer trying to grant themselves the admin role — the actual privilege-escalation path this closes', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: 'attacker_1' });
    (currentUser as jest.Mock).mockResolvedValue({ publicMetadata: { role: 'customer' } });
    const { PATCH } = await import('@/app/api/admin/users/[id]/route');
    const res = await PATCH(
      makeRequest({ role: 'admin' }),
      { params: Promise.resolve({ id: 'attacker_1' }) } // targeting their own id
    );
    expect(res.status).toBe(403);
  });

  it('rejects a seller trying to grant themselves extra permissions', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: 'seller_1' });
    (currentUser as jest.Mock).mockResolvedValue({ publicMetadata: { role: 'seller' } });
    const { PATCH } = await import('@/app/api/admin/users/[id]/route');
    const res = await PATCH(
      makeRequest({ permissions: ['studio'] }),
      { params: Promise.resolve({ id: 'seller_1' }) }
    );
    expect(res.status).toBe(403);
  });

  it('allows an admin to grant a permission to another user', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: 'admin_1' });
    (currentUser as jest.Mock).mockResolvedValue({ publicMetadata: { role: 'admin' } });
    const updateUserMetadata = jest.fn().mockResolvedValue({});
    (clerkClient as jest.Mock).mockResolvedValue({ users: { updateUserMetadata } });
    const { PATCH } = await import('@/app/api/admin/users/[id]/route');
    const res = await PATCH(
      makeRequest({ permissions: ['studio'] }),
      { params: Promise.resolve({ id: 'target_1' }) }
    );
    expect(res.status).toBe(200);
    expect(updateUserMetadata).toHaveBeenCalledWith('target_1', { publicMetadata: { permissions: ['studio'] } });
  });
});
