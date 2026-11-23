'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { SiteSettings } from '@/lib/siteSettings';

interface SiteContent {
  settings: SiteSettings;
  locale: string;
  /**
   * Studio text for `key` in the current language: `key@<locale>` first,
   * then the language-neutral `key`, then `fallback` (usually a translation).
   */
  text: (key: string, fallback?: string) => string;
  /** Raw setting (no language lookup). */
  get: (key: string) => string | undefined;
}

const Ctx = createContext<SiteContent | null>(null);

export const STUDIO_PREVIEW_MESSAGE = 'makay-studio:preview';

export default function SiteContentProvider({
  initial, locale, children,
}: { initial: SiteSettings; locale: string; children: React.ReactNode }) {
  const [preview, setPreview] = useState<SiteSettings | null>(null);

  // Studio renders the site in a same-origin iframe and posts unsaved edits
  // here, so the preview updates live without touching the DOM directly.
  useEffect(() => {
    if (window.parent === window) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === STUDIO_PREVIEW_MESSAGE && e.data.settings && typeof e.data.settings === 'object') {
        setPreview(e.data.settings as SiteSettings);
      }
    };
    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type: `${STUDIO_PREVIEW_MESSAGE}:ready` }, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const value = useMemo<SiteContent>(() => {
    const settings = preview ? { ...initial, ...preview } : initial;
    const get = (key: string) => {
      const v = settings[key];
      return v === undefined || v === null || v === '' ? undefined : String(v);
    };
    return {
      settings,
      locale,
      get,
      text: (key, fallback = '') => get(`${key}@${locale}`) ?? get(key) ?? fallback,
    };
  }, [initial, preview, locale]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSiteContent(): SiteContent {
  const v = useContext(Ctx);
  if (v) return v;
  // Outside the provider (tests, isolated renders): behave as "nothing set".
  return { settings: {}, locale: 'es', get: () => undefined, text: (_k, f = '') => f };
}
