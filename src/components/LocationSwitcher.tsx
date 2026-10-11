'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { LOCATIONS, PANEL_LOCATION_COOKIE, isStoreLocation, type StoreLocation } from '@/lib/location';

const LOCATION_LABELS: Record<StoreLocation, string> = {
  guacuco: 'Guacuco',
  la_marina: 'La Marina',
};

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

interface Props {
  collapsed?: boolean;
}

export default function LocationSwitcher({ collapsed }: Props) {
  const [location, setLocation] = useState<StoreLocation>('guacuco');

  useEffect(() => {
    const stored = readCookie(PANEL_LOCATION_COOKIE);
    if (isStoreLocation(stored)) setLocation(stored);
  }, []);

  function selectLocation(next: StoreLocation) {
    document.cookie = `${PANEL_LOCATION_COOKIE}=${next}; path=/; max-age=31536000`;
    setLocation(next);
    window.location.reload();
  }

  if (collapsed) return null;

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
