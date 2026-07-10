'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import '../styles/footer.css';

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="2,4 12,13 22,4" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.42 2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export default function Footer() {
  const t = useTranslations('footer');
  const currentYear = new Date().getFullYear();

  return (
    <footer id="footer" className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-column footer-column--brand">
            <span className="footer-logo">Makay</span>
            <p className="footer-brand-desc">{t('brand.description')}</p>
          </div>

          {/* Shop Column */}
          <div className="footer-column">
            <h4 className="footer-column-heading">{t('shop.title')}</h4>
            <ul className="footer-links">
              <li><Link href="/products">{t('shop.allProducts')}</Link></li>
              <li><Link href="/products?category=women">{t('shop.women')}</Link></li>
              <li><Link href="/products?category=men">{t('shop.men')}</Link></li>
              <li><Link href="/products?category=accessories">{t('shop.accessories')}</Link></li>
            </ul>
          </div>

          {/* Community Column */}
          <div className="footer-column">
            <h4 className="footer-column-heading">{t('community.title')}</h4>
            <ul className="footer-links">
              <li><Link href="/">{t('community.about')}</Link></li>
              <li><Link href="/">{t('community.events')}</Link></li>
              <li><Link href="/">{t('community.blog')}</Link></li>
              <li><Link href="/">{t('community.sustainability')}</Link></li>
            </ul>
          </div>

          {/* Connect Column */}
          <div className="footer-column">
            <h4 className="footer-column-heading">{t('connect.title')}</h4>
            <div className="footer-social-icons">
              <a
                href="https://instagram.com/makay"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="social-icon-link"
              >
                <InstagramIcon />
              </a>
              <a
                href="mailto:hello@makay.com"
                aria-label="Email"
                className="social-icon-link"
              >
                <MailIcon />
              </a>
              <a
                href="tel:+1800MAKAY"
                aria-label="Phone"
                className="social-icon-link"
              >
                <PhoneIcon />
              </a>
            </div>
            <p className="footer-contact-email">hello@makay.com</p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            &copy; {currentYear} Makay. {t('copyright')}
          </p>
          <div className="footer-legal-links">
            <Link href="/">{t('legal.privacy')}</Link>
            <Link href="/">{t('legal.terms')}</Link>
            <Link href="/">{t('legal.cookies')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
