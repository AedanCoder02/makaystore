/**
 * @jest-environment node
 */
// next/server needs the Fetch API globals (Request/Response/Headers), which
// jsdom (this project's default test environment) doesn't provide.
jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
const mockSql: any = jest.fn(() => ({ catch: () => Promise.resolve([]) }));
jest.mock('@/lib/db', () => ({ __esModule: true, default: mockSql }));
jest.mock('@/lib/location', () => ({
  getPanelLocation: jest.fn(() => Promise.resolve('la_marina')),
}));

import { auth } from '@clerk/nextjs/server';

describe('GET /api/admin/reports/stock', () => {
  beforeEach(() => jest.clearAllMocks());

  it('filters product rows by the current panel location', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: 'admin_1' });
    const { GET } = await import('@/app/api/admin/reports/stock/route');
    await GET();
    const [strings, ...values] = mockSql.mock.calls[0];
    expect(strings.join('?')).toContain('p.location =');
    expect(values).toContain('la_marina');
  });
});
