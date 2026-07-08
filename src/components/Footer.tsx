'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import '../styles/footer.css';

export default function Footer() {
  const t = useTranslations('footer');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-column">
            <h3 className="footer-column-title">{t('brand.title')}</h3>
            <p className="footer-brand-desc">{t('brand.description')}</p>
          </div>

          {/* Shop Column */}
          <div className="footer-column">
            <h4 className="footer-column-heading">{t('shop.title')}</h4>
            <ul className="footer-links">
              <li>
                <Link href="/products">{t('shop.allProducts')}</Link>
              </li>
              <li>
                <Link href="/products?category=women">{t('shop.women')}</Link>
              </li>
              <li>
                <Link href="/products?category=men">{t('shop.men')}</Link>
              </li>
              <li>
                <Link href="/products?category=accessories">{t('shop.accessories')}</Link>
              </li>
            </ul>
          </div>

          {/* Customer Service Column */}
          <div className="footer-column">
            <h4 className="footer-column-heading">{t('support.title')}</h4>
            <ul className="footer-links">
              <li>
                <a href="mailto:hello@makay.com">{t('support.contact')}</a>
              </li>
              <li>
                <Link href="/">{t('support.faq')}</Link>
              </li>
              <li>
                <Link href="/">{t('support.shipping')}</Link>
              </li>
              <li>
                <Link href="/">{t('support.returns')}</Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div className="footer-column">
            <h4 className="footer-column-heading">{t('legal.title')}</h4>
            <ul className="footer-links">
              <li>
                <Link href="/">{t('legal.privacy')}</Link>
              </li>
              <li>
                <Link href="/">{t('legal.terms')}</Link>
              </li>
              <li>
                <Link href="/">{t('legal.cookies')}</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="footer-social">
          <h4 className="footer-social-title">{t('social.title')}</h4>
          <div className="footer-social-links">
            <a
              href="https://instagram.com/makay"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="social-link"
            >
              📷
            </a>
            <a
              href="https://tiktok.com/@makay"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="social-link"
            >
              🎵
            </a>
            <a
              href="https://twitter.com/makay"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="social-link"
            >
              𝕏
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-payment">
            <span className="payment-icons">💳 💰 🏦</span>
            <span className="payment-text">{t('payment.text')}</span>
          </div>

          <div className="footer-copyright">
            <p>
              © {currentYear} Makay. {t('copyright')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
