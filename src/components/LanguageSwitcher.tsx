'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { locales, type Locale } from '@/i18n/config';

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const locale = useLocale();
  const t = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) return;

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('makay-locale', nextLocale);
    }

    // Update URL: strip current locale prefix then prepend next one
    let newPath = pathname;

    // Strip leading /es/ or /en/ prefix if present
    const localePrefix = new RegExp(`^/(${locales.join('|')})(/?)`);
    newPath = newPath.replace(localePrefix, '/');

    // Add prefix for non-default locale (ES); EN uses no prefix
    if (nextLocale !== 'en') {
      newPath = `/${nextLocale}${newPath}`;
    }

    startTransition(() => {
      router.push(newPath);
    });
  };

  return (
    <div
      className={`language-switcher ${className}`}
      role="group"
      aria-label={t('language')}
    >
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          disabled={isPending}
          aria-pressed={locale === loc}
          className={`language-btn${locale === loc ? ' language-btn--active' : ''}`}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
