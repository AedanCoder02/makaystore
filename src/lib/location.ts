export type StoreLocation = 'guacuco' | 'la_marina';

export const LOCATIONS: StoreLocation[] = ['guacuco', 'la_marina'];

export function isStoreLocation(value: unknown): value is StoreLocation {
  return value === 'guacuco' || value === 'la_marina';
}

/**
 * Which location this deployment's public storefront serves.
 * Set via STORE_LOCATION env var per app (the Guacuco app leaves it unset/'guacuco';
 * the La Marina fork sets STORE_LOCATION=la_marina).
 */
export const STORE_LOCATION: StoreLocation = isStoreLocation(process.env.STORE_LOCATION)
  ? process.env.STORE_LOCATION
  : 'guacuco';

/** Backoffice-only: cookie name staff use to switch which location's data they're viewing. */
export const PANEL_LOCATION_COOKIE = 'panel_location';
