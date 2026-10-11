/**
 * @jest-environment node
 */
// next/server needs the Fetch API globals (Request/Response/Headers), which
// jsdom (this project's default test environment) doesn't provide.
jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
const mockRows = [{ id: 1 }];
const mockSql: any = jest.fn(() => Promise.resolve(mockRows));
jest.mock('@/lib/db', () => ({ __esModule: true, default: mockSql }));
jest.mock('@/lib/location.server', () => ({
  getPanelLocation: jest.fn(() => Promise.resolve('la_marina')),
}));

import { auth } from '@clerk/nextjs/server';

describe('GET /api/seller/orders', () => {
  beforeEach(() => jest.clearAllMocks());

  it('filters by the current panel location', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_1' });
    const { GET } = await import('@/app/api/seller/orders/route');
    await GET();
    const [strings, ...values] = mockSql.mock.calls[0];
    expect(strings.join('?')).toContain('location =');
    expect(values).toContain('la_marina');
  });
});

describe('POST /api/seller/orders', () => {
  beforeEach(() => jest.clearAllMocks());

  it('stamps new orders with the current panel location', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_1' });
    const { POST } = await import('@/app/api/seller/orders/route');
    const req = {
      json: async () => ({
        client_id: 'c1', client_name: 'Jane', items: [{ id: 'p1', qty: 1 }], is_gift: true,
      }),
    } as any;
    await POST(req);
    const [strings, ...values] = mockSql.mock.calls[0];
    expect(strings.join('?')).toContain('location');
    expect(values).toContain('la_marina');
  });
});
