import { cookies } from 'next/headers';
import { isStoreLocation, PANEL_LOCATION_COOKIE, type StoreLocation } from '@/lib/location';

/** Backoffice-only: which location the current admin/seller/supervisor session is viewing. */
export async function getPanelLocation(): Promise<StoreLocation> {
  const store = await cookies();
  const value = store.get(PANEL_LOCATION_COOKIE)?.value;
  return isStoreLocation(value) ? value : 'guacuco';
}
