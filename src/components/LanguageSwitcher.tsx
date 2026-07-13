'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const currentLocale = typeof document !== 'undefined'
    ? document.cookie.match(/NEXT_LOCALE=([^;]+)/)?.[1] ?? 'en'
    : 'en';

  const switchLocale = (nextLocale: Locale) => {
    if (nextLocale === currentLocale) return;
    document.cookie = `NEXT_LOCALE=${nextLocale};path=/;max-age=31536000`;
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className={`language-switcher ${className}`} role="group" aria-label="Language">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          disabled={isPending}
          aria-pressed={currentLocale === loc}
          className={`language-btn${currentLocale === loc ? ' language-btn--active' : ''}`}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
