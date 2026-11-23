'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { animate } from 'animejs';
import '../styles/newsletter.css';

export default function Newsletter() {
  const t = useTranslations('newsletter');
  const sectionRef = useRef<any>(null);
  const headingRef = useRef<any>(null);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        if (headingRef.current) {
          animate(headingRef.current, {
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 700,
            easing: 'easeOutQuad',
          });
        }

        const form = sectionRef.current?.querySelector('.newsletter-form');
        if (form) {
          animate(form, {
            opacity: [0, 1],
            translateY: [30, 0],
            duration: 600,
            delay: 150,
            easing: 'easeOutQuad',
          });
        }

        observer.unobserve(entry.target);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || sending) return;
    setSending(true);
    setError('');
    const res = await fetch('/api/newsletter', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
    }).catch(() => null);
    setSending(false);
    if (res?.ok) { setSubmitted(true); setEmail(''); return; }
    setError(res?.status === 400 ? t('invalid') : t('error'));
  };

  return (
    <section ref={sectionRef} id="newsletter" className="newsletter">
      <div className="newsletter-container">
        <h2 ref={headingRef} className="newsletter-heading">
          {t('heading')}
        </h2>

        <p className="newsletter-subheading">{t('subheading')}</p>

        {submitted ? (
          <div className="newsletter-success">
            <div className="success-icon">✓</div>
            <p className="success-message">{t('successMessage')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="newsletter-form">
            <input
              type="email"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="newsletter-input"
              required
            />
            <button type="submit" className="newsletter-button" disabled={sending}>
              {sending ? t('sending') : t('subscribe')}
            </button>
          </form>
        )}
        {error && <p className="newsletter-error" role="alert">{error}</p>}

        <p className="newsletter-privacy">{t('privacy')}</p>
      </div>
    </section>
  );
}
