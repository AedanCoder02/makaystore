'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Calendar, MapPin, Users, ArrowLeft, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import '@/styles/event-detail.css';

interface Event {
  id: number;
  title: string;
  description: string;
  content?: string;
  event_date: string | null;
  location: string;
  image_url: string;
  gallery?: string[];
  tags?: string;
  price: number;
  capacity: number;
  tickets_sold: number;
}

export default function EventDetailPage({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = use(paramsPromise);
  const t = useTranslations('eventPage');
  const locale = useLocale();
  const router = useRouter();
  const { addToCart } = useCart();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ customer_name: '', customer_email: '', quantity: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setEvent(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const gallery = event?.gallery ?? [];

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') setLightbox(i => (i === null ? i : (i + 1) % gallery.length));
      if (e.key === 'ArrowLeft') setLightbox(i => (i === null ? i : (i - 1 + gallery.length) % gallery.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, gallery.length]);

  if (loading) return <p className="evd-state">{t('loading')}</p>;
  if (!event) return (
    <div className="evd-state">
      <p>{t('notFound')}</p>
      <Link href="/events">← {t('back')}</Link>
    </div>
  );

  const remaining = event.capacity - event.tickets_sold;
  const soldOut = remaining <= 0;
  const isPaid = Number(event.price) > 0;
  const total = Number(event.price) * form.quantity;
  const isPast = !!event.event_date && new Date(event.event_date).getTime() < Date.now() - 12 * 3600 * 1000;
  const maxQty = Math.max(1, Math.min(remaining, 10));
  const paragraphs = (event.content ?? '').split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const tags = (event.tags ?? '').split(',').map(s => s.trim()).filter(Boolean);

  const handleFree = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/events/${id}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? t('errors.generic'));
      } else {
        setSuccess(true);
        setEvent(ev => ev ? { ...ev, tickets_sold: ev.tickets_sold + form.quantity } : ev);
      }
    } catch {
      setError(t('errors.network'));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaid = () => {
    addToCart({
      productId: `event-${event.id}`,
      variantId: `event-${event.id}`,
      quantity: form.quantity,
      price: Number(event.price),
      title: event.title,
      category: 'event',
    });
    router.push('/cart');
  };

  return (
    <main className="evd">
      <section className="evd-hero" style={event.image_url ? { backgroundImage: `url("${event.image_url}")` } : undefined}>
        <div className="evd-hero-shade" />
        <div className="evd-hero-inner">
          <Link href="/events" className="evd-back"><ArrowLeft size={14} /> {t('back')}</Link>
          {tags.length > 0 && (
            <div className="evd-tags">{tags.map(tag => <span key={tag}>{tag}</span>)}</div>
          )}
          <h1>{event.title}</h1>
          <div className="evd-meta">
            {event.event_date && (
              <span><Calendar size={15} />
                {new Date(event.event_date).toLocaleString(locale === 'es' ? 'es-VE' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {event.location && <span><MapPin size={15} /> {event.location}</span>}
            <span className={soldOut ? 'evd-soldout' : 'evd-left'}><Users size={15} /> {soldOut ? t('soldOut') : t('spotsLeft', { count: remaining })}</span>
          </div>
        </div>
      </section>

      <div className="evd-body">
        <article className="evd-article">
          {event.description && <p className="evd-lede">{event.description}</p>}
          {paragraphs.map((p, i) => <p key={i}>{p}</p>)}

          {gallery.length > 0 && (
            <section className="evd-gallery" aria-label={t('gallery')}>
              <h2>{t('gallery')}</h2>
              <div className="evd-gallery-grid">
                {gallery.map((src, i) => (
                  <button key={src + i} className="evd-gallery-item" onClick={() => setLightbox(i)} aria-label={t('openPhoto', { n: i + 1 })}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            </section>
          )}
        </article>

        <aside className="evd-ticket">
          <h2>{isPaid ? t('getTickets') : t('reserve')}</h2>
          <p className="evd-price">{isPaid ? `$${Number(event.price).toFixed(2)}` : t('free')}<span>{isPaid ? t('perPerson') : ''}</span></p>

          {isPast ? (
            <p className="evd-note">{t('ended')}</p>
          ) : success ? (
            <div className="evd-success">
              <div className="evd-check"><Check size={24} color="#fff" /></div>
              <p className="evd-success-title">{t('youreIn')}</p>
              <p>{t('confirmation', { email: form.customer_email })}</p>
            </div>
          ) : soldOut ? (
            <p className="evd-note evd-soldout">{t('soldOutLong')}</p>
          ) : isPaid ? (
            <div className="evd-form">
              <label htmlFor="evd-qty">{t('quantity', { max: maxQty })}</label>
              <input id="evd-qty" type="number" min={1} max={maxQty} value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: Math.max(1, Math.min(Number(e.target.value) || 1, maxQty)) }))}
                className="seller-input" />
              <div className="evd-total"><span>{t('total')}</span><strong>${total.toFixed(2)}</strong></div>
              <button type="button" className="evd-cta" onClick={handlePaid}>{t('addToCart')}</button>
              <p className="evd-hint">{t('paidHint')}</p>
            </div>
          ) : (
            <form onSubmit={handleFree} className="evd-form">
              <label htmlFor="evd-name">{t('name')} *</label>
              <input id="evd-name" required value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} className="seller-input" autoComplete="name" />
              <label htmlFor="evd-email">{t('email')} *</label>
              <input id="evd-email" required type="email" value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))} className="seller-input" autoComplete="email" />
              <label htmlFor="evd-qty">{t('quantity', { max: maxQty })}</label>
              <input id="evd-qty" type="number" min={1} max={maxQty} value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: Math.max(1, Math.min(Number(e.target.value) || 1, maxQty)) }))}
                className="seller-input" />
              {error && <p className="evd-error" role="alert">{error}</p>}
              <button type="submit" className="evd-cta" disabled={submitting}>{submitting ? t('processing') : t('confirm')}</button>
            </form>
          )}
        </aside>
      </div>

      {lightbox !== null && gallery[lightbox] && (
        <div className="evd-lightbox" role="dialog" aria-modal="true" onClick={() => setLightbox(null)}>
          <button className="evd-lb-close" aria-label={t('close')} onClick={() => setLightbox(null)}><X size={22} /></button>
          {gallery.length > 1 && (
            <button className="evd-lb-nav evd-lb-prev" aria-label={t('prev')} onClick={e => { e.stopPropagation(); setLightbox((lightbox - 1 + gallery.length) % gallery.length); }}><ChevronLeft size={28} /></button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={gallery[lightbox]} alt="" onClick={e => e.stopPropagation()} />
          {gallery.length > 1 && (
            <button className="evd-lb-nav evd-lb-next" aria-label={t('next')} onClick={e => { e.stopPropagation(); setLightbox((lightbox + 1) % gallery.length); }}><ChevronRight size={28} /></button>
          )}
        </div>
      )}
    </main>
  );
}
