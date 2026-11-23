'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useUser } from '@clerk/nextjs';
import { Star, Quote } from 'lucide-react';
import { useSiteContent } from '@/components/providers/SiteContentProvider';
import { useReveal } from '@/hooks/useReveal';

interface Review { id: number; author_name: string; rating: number; comment: string; created_at: string }
interface Data { reviews: Review[]; count: number; average: number }

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="hx-stars" aria-hidden="true">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} fill={i <= Math.round(value) ? 'currentColor' : 'none'} strokeWidth={1.5} />
      ))}
    </span>
  );
}

/** Real, moderated guest reviews with an average rating and a write form. */
export default function HomeCommunity() {
  const t = useTranslations('homeCommunity');
  const locale = useLocale();
  const { text } = useSiteContent();
  const { isSignedIn } = useUser();
  const ref = useReveal<HTMLElement>(0.15);
  const [data, setData] = useState<Data | null>(null);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/reviews').then(r => (r.ok ? r.json() : null)).then(setData).catch(() => setData(null));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');
    setError('');
    const res = await fetch('/api/reviews', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment }),
    }).catch(() => null);
    if (res?.ok) { setState('sent'); setComment(''); return; }
    const body = await res?.json().catch(() => ({}));
    setError(res?.status === 409 ? t('errors.recent') : res?.status === 400 ? t('errors.length') : (body?.error ?? t('errors.generic')));
    setState('idle');
  };

  const reviews = data?.reviews ?? [];
  // Duplicate for a seamless marquee when there are enough cards.
  const marquee = reviews.length >= 4 ? [...reviews, ...reviews] : reviews;
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(locale === 'es' ? 'es-VE' : 'en-US', { month: 'short', year: 'numeric' });

  return (
    <section ref={ref} className="hx-community" id="community" aria-labelledby="hx-community-title">
      <div className="hx-wrap">
        <header className="hx-community-head" data-reveal>
          <div>
            <p className="hx-eyebrow">{t('eyebrow')}</p>
            <h2 id="hx-community-title" className="hx-title">{text('page:home:content:community_title', t('title'))}</h2>
          </div>
          {data && data.count > 0 && (
            <div className="hx-score" aria-label={t('scoreLabel', { average: data.average, count: data.count })}>
              <span className="hx-score-num">{data.average.toFixed(1)}</span>
              <span>
                <Stars value={data.average} size={18} />
                <span className="hx-score-count">{t('count', { count: data.count })}</span>
              </span>
            </div>
          )}
        </header>
      </div>

      {reviews.length > 0 ? (
        <div className={`hx-reviews${reviews.length >= 4 ? ' hx-reviews--marquee' : ''}`} data-reveal>
          <ul className="hx-reviews-track">
            {marquee.map((r, i) => (
              <li key={`${r.id}-${i}`} className="hx-review" aria-hidden={i >= reviews.length ? true : undefined}>
                <Quote size={22} className="hx-review-quote" aria-hidden="true" />
                <Stars value={r.rating} />
                <p className="hx-review-text">{r.comment}</p>
                <p className="hx-review-meta"><strong>{r.author_name}</strong> · {fmt(r.created_at)}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="hx-wrap"><p className="hx-lede hx-reviews-empty" data-reveal>{data ? t('empty') : ''}</p></div>
      )}

      <div className="hx-wrap hx-review-cta" data-reveal>
        {!open ? (
          isSignedIn
            ? <button className="hx-btn" onClick={() => setOpen(true)}>{t('write')}</button>
            : <Link className="hx-btn" href="/sign-in?redirect_url=/%23community">{t('signInToWrite')}</Link>
        ) : state === 'sent' ? (
          <p className="hx-review-thanks" role="status">{t('thanks')}</p>
        ) : (
          <form className="hx-review-form" onSubmit={submit}>
            <fieldset className="hx-rate">
              <legend>{t('yourRating')}</legend>
              {[1, 2, 3, 4, 5].map(n => (
                <button type="button" key={n} aria-label={t('starsAria', { n })} aria-pressed={rating === n}
                  className={n <= rating ? 'on' : ''} onClick={() => setRating(n)}>
                  <Star size={26} fill={n <= rating ? 'currentColor' : 'none'} strokeWidth={1.5} />
                </button>
              ))}
            </fieldset>
            <label htmlFor="hx-review-comment" className="hx-sr">{t('yourComment')}</label>
            <textarea id="hx-review-comment" required minLength={10} maxLength={600} rows={4}
              placeholder={t('placeholder')} value={comment} onChange={e => setComment(e.target.value)} />
            <div className="hx-review-actions">
              <span className="hx-review-hint">{t('moderated')} · {comment.length}/600</span>
              <button type="button" className="hx-btn hx-btn--ghost" onClick={() => setOpen(false)}>{t('cancel')}</button>
              <button type="submit" className="hx-btn" disabled={state === 'sending'}>{state === 'sending' ? t('sending') : t('send')}</button>
            </div>
            {error && <p className="hx-review-error" role="alert">{error}</p>}
          </form>
        )}
      </div>
    </section>
  );
}
