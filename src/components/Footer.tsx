'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { MapPin, MessageCircle, Mail, Clock, ArrowUpRight } from 'lucide-react';
import { useSiteContent } from '@/components/providers/SiteContentProvider';
import '../styles/footer.css';

// The WhatsApp line already used by the membership form and contract emails.
const DEFAULT_WHATSAPP = '+58 414 296 6058';

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Beach-club footer. Contact details are Studio keys
 * page:home:content:footer_{tagline,address,hours,whatsapp,instagram,email};
 * a detail with no value and no default is not shown.
 */
export default function Footer() {
  const t = useTranslations('footer');
  const { text, get } = useSiteContent();
  const ref = useRef<HTMLElement>(null);
  const year = new Date().getFullYear();

  // Wordmark rises as the footer scrolls into view.
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (window.innerHeight - r.top) / r.height));
        el.style.setProperty('--ft-p', p.toFixed(3));
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); };
  }, []);

  const k = (f: string) => `page:home:content:footer_${f}`;
  const whatsapp = get(k('whatsapp')) || DEFAULT_WHATSAPP;
  const waDigits = whatsapp.replace(/\D/g, '');
  const instagram = (get(k('instagram')) || '').replace(/^@/, '').trim();
  const email = (get(k('email')) || '').trim();
  const address = text(k('address'), t('address'));
  const hours = text(k('hours'), '');

  const sections = [
    { title: t('club.title'), links: [
      { href: '/events', label: t('club.events') },
      { href: '/reservations', label: t('club.reservations') },
      { href: '/membership', label: t('club.membership') },
      { href: '/allies', label: t('club.allies') },
    ] },
    { title: t('discover.title'), links: [
      { href: '/#experience', label: t('discover.experience') },
      { href: '/#community', label: t('discover.community') },
      { href: '/products', label: t('discover.shop') },
    ] },
    { title: t('account.title'), links: [
      { href: '/profile', label: t('account.profile') },
      { href: '/orders', label: t('account.orders') },
      { href: '/cart', label: t('account.cart') },
    ] },
  ];

  return (
    <footer ref={ref} id="footer" className="footer">
      <svg className="footer-wave" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 30 C 240 60 480 0 720 30 S 1200 60 1440 30 V60 H0 Z" />
      </svg>

      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <p className="footer-tagline">{text(k('tagline'), t('tagline'))}</p>
            <a className="footer-cta" href={`https://wa.me/${waDigits}`} target="_blank" rel="noopener noreferrer">
              {t('bookCta')} <ArrowUpRight size={18} />
            </a>
          </div>

          <ul className="footer-contact">
            {address && <li><MapPin size={18} aria-hidden="true" /><span>{address}</span></li>}
            {hours && <li><Clock size={18} aria-hidden="true" /><span>{hours}</span></li>}
            <li>
              <MessageCircle size={18} aria-hidden="true" />
              <a href={`https://wa.me/${waDigits}`} target="_blank" rel="noopener noreferrer">{whatsapp}</a>
            </li>
            {email && <li><Mail size={18} aria-hidden="true" /><a href={`mailto:${email}`}>{email}</a></li>}
            {instagram && (
              <li>
                <InstagramIcon />
                <a href={`https://instagram.com/${encodeURIComponent(instagram)}`} target="_blank" rel="noopener noreferrer">@{instagram}</a>
              </li>
            )}
          </ul>
        </div>

        <nav className="footer-grid" aria-label={t('navLabel')}>
          {sections.map(s => (
            <div key={s.title} className="footer-column">
              <h4 className="footer-column-heading">{s.title}</h4>
              <ul className="footer-links">
                {s.links.map(l => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}
              </ul>
            </div>
          ))}
        </nav>

        <p className="footer-wordmark" aria-hidden="true">
          {'MAKAY'.split('').map((c, i) => <span key={i} style={{ ['--i' as string]: i }}>{c}</span>)}
        </p>

        <div className="footer-bottom">
          <p className="footer-copyright">&copy; {year} Makay Beach Club. {t('copyright')}</p>
          <div className="footer-legal-links">
            <Link href="/legal/privacy">{t('legal.privacy')}</Link>
            <Link href="/legal/terms">{t('legal.terms')}</Link>
            <Link href="/legal/cookies">{t('legal.cookies')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
