'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { LOCATIONS, PANEL_LOCATION_COOKIE, isStoreLocation, type StoreLocation } from '@/lib/location';

const LOCATION_LABELS: Record<StoreLocation, string> = {
  guacuco: 'Guacuco',
  la_marina: 'La Marina',
};

// Pages whose data actually changes when the switcher is flipped — every
// products/orders/reports query scoped by getPanelLocation(). Rendering the
// switcher anywhere outside this list is misleading: flipping it would
// visibly do nothing, since nothing on that page reads the cookie.
const LOCATION_AWARE_PATH_PREFIXES = [
  '/admin/dashboard',
  '/admin/orders',
  '/admin/reports',
  '/seller/dashboard',
  '/seller/sell',
  '/seller/products',
  '/seller/stock',
  '/seller/rotation',
  '/supervisor/dashboard',
  '/supervisor/orders',
  '/supervisor/reports',
];

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

interface Props {
  collapsed?: boolean;
}

export default function LocationSwitcher({ collapsed }: Props) {
  const [location, setLocation] = useState<StoreLocation>('guacuco');
  const pathname = usePathname();

  useEffect(() => {
    const stored = readCookie(PANEL_LOCATION_COOKIE);
    if (isStoreLocation(stored)) setLocation(stored);
  }, []);

  function selectLocation(next: StoreLocation) {
    document.cookie = `${PANEL_LOCATION_COOKIE}=${next}; path=/; max-age=31536000`;
    setLocation(next);
    window.location.reload();
  }

  const isLocationAware = LOCATION_AWARE_PATH_PREFIXES.some((prefix) => pathname?.startsWith(prefix));
  if (collapsed || !isLocationAware) return null;

  return (
    <div className="location-switcher" role="group" aria-label="Ubicación">
      <MapPin size={14} className="location-switcher-icon" />
      {LOCATIONS.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => selectLocation(loc)}
          className={`location-switcher-btn${location === loc ? ' active' : ''}`}
          aria-pressed={location === loc}
        >
          {LOCATION_LABELS[loc]}
        </button>
      ))}
    </div>
  );
}
