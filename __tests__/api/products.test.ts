/**
 * @jest-environment node
 */
// next/server needs the Fetch API globals (Request/Response/Headers), which
// jsdom (this project's default test environment) doesn't provide.
const mockRows = [{ id: '1', title: 'Towel', location: 'guacuco' }];
const mockSql = jest.fn(() => Promise.resolve(mockRows));
jest.mock('@/lib/db', () => ({ __esModule: true, default: mockSql }));

describe('GET /api/products', () => {
  afterEach(() => jest.clearAllMocks());

  it('queries only STORE_LOCATION\'s catalog', async () => {
    const { GET } = await import('@/app/api/products/route');
    await GET();
    const [strings, ...values] = mockSql.mock.calls[0];
    const queryText = strings.join('?');
    expect(queryText).toContain('p.location =');
    expect(values).toContain('guacuco');
  });
});
