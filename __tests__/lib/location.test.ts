// Use var to avoid temporal dead zone with jest.mock()
var mockCookies: jest.Mock;

jest.mock('next/headers', () => {
  mockCookies = mockCookies || jest.fn();
  return { cookies: mockCookies };
});

import { cookies } from 'next/headers';

describe('isStoreLocation', () => {
  it('accepts guacuco and la_marina', async () => {
    const { isStoreLocation } = await import('@/lib/location');
    expect(isStoreLocation('guacuco')).toBe(true);
    expect(isStoreLocation('la_marina')).toBe(true);
  });

  it('rejects anything else', async () => {
    const { isStoreLocation } = await import('@/lib/location');
    expect(isStoreLocation('madrid')).toBe(false);
    expect(isStoreLocation(undefined)).toBe(false);
    expect(isStoreLocation(null)).toBe(false);
    expect(isStoreLocation(123)).toBe(false);
  });
});

describe('LOCATIONS', () => {
  it('lists exactly the two valid locations', async () => {
    const { LOCATIONS } = await import('@/lib/location');
    expect(LOCATIONS).toEqual(['guacuco', 'la_marina']);
  });
});

describe('STORE_LOCATION', () => {
  const ORIGINAL_ENV = process.env.STORE_LOCATION;

  afterEach(() => {
    process.env.STORE_LOCATION = ORIGINAL_ENV;
    jest.resetModules();
  });

  it('defaults to guacuco when STORE_LOCATION is unset', async () => {
    delete process.env.STORE_LOCATION;
    jest.resetModules();
    const { STORE_LOCATION } = await import('@/lib/location');
    expect(STORE_LOCATION).toBe('guacuco');
  });

  it('uses STORE_LOCATION when it is a valid location', async () => {
    process.env.STORE_LOCATION = 'la_marina';
    jest.resetModules();
    const { STORE_LOCATION } = await import('@/lib/location');
    expect(STORE_LOCATION).toBe('la_marina');
  });

  it('falls back to guacuco when STORE_LOCATION is invalid', async () => {
    process.env.STORE_LOCATION = 'nonsense';
    jest.resetModules();
    const { STORE_LOCATION } = await import('@/lib/location');
    expect(STORE_LOCATION).toBe('guacuco');
  });
});

describe('getPanelLocation', () => {
  afterEach(() => jest.resetModules());

  it('defaults to guacuco when no cookie is set', async () => {
    (cookies as jest.Mock).mockResolvedValue({ get: () => undefined });
    const { getPanelLocation } = await import('@/lib/location');
    expect(await getPanelLocation()).toBe('guacuco');
  });

  it('returns la_marina when the cookie is set to la_marina', async () => {
    (cookies as jest.Mock).mockResolvedValue({ get: () => ({ value: 'la_marina' }) });
    const { getPanelLocation } = await import('@/lib/location');
    expect(await getPanelLocation()).toBe('la_marina');
  });

  it('falls back to guacuco when the cookie value is invalid', async () => {
    (cookies as jest.Mock).mockResolvedValue({ get: () => ({ value: 'drop-table' }) });
    const { getPanelLocation } = await import('@/lib/location');
    expect(await getPanelLocation()).toBe('guacuco');
  });
});
