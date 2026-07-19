'use client';

import { useEffect, useState, use } from 'react';
import { Calendar, MapPin, Users, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';

interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  location: string;
  image_url: string;
  price: number;
  capacity: number;
  tickets_sold: number;
}

export default function EventDetailPage({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = use(paramsPromise);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ customer_name: '', customer_email: '', quantity: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setEvent(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
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
        const body = await res.json();
        setError(body.error ?? 'Something went wrong');
      } else {
        setSuccess(true);
        setEvent(ev => ev ? { ...ev, tickets_sold: ev.tickets_sold + form.quantity } : ev);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '4rem', fontFamily: 'var(--font-montserrat)', color: 'var(--makay-mauve)' }}>Loading…</p>;
  if (!event) return (
    <div style={{ textAlign: 'center', padding: '4rem 1.25rem' }}>
      <p style={{ fontFamily: 'var(--font-montserrat)', color: 'var(--makay-mauve)' }}>Event not found.</p>
      <Link href="/events" style={{ color: 'var(--makay-peachy-rose)', fontFamily: 'var(--font-montserrat)' }}>← Back to events</Link>
    </div>
  );

  const remaining = event.capacity - event.tickets_sold;
  const soldOut = remaining <= 0;
  const total = Number(event.price) * form.quantity;

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.25rem' }}>
      <Link href="/events" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--makay-mauve)', fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', textDecoration: 'none', marginBottom: '1.5rem' }}>
        <ArrowLeft size={14} /> Back to events
      </Link>

      {event.image_url && (
        <img src={event.image_url} alt={event.title} style={{ width: '100%', height: 280, objectFit: 'cover', borderRadius: '16px', marginBottom: '1.5rem' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      )}

      <h1 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--makay-dark-navy)', margin: '0 0 0.75rem' }}>
        {event.title}
      </h1>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        {event.event_date && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.85rem', color: 'var(--makay-dark-navy)' }}>
            <Calendar size={15} style={{ color: 'var(--makay-peachy-rose)' }} />
            {new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
        {event.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.85rem', color: 'var(--makay-mauve)' }}>
            <MapPin size={15} /> {event.location}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.85rem', color: soldOut ? '#ef4444' : '#10b981' }}>
          <Users size={15} /> {soldOut ? 'Sold out' : `${remaining} spots remaining`}
        </div>
      </div>

      <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.95rem', color: 'var(--makay-mauve)', lineHeight: 1.7, marginBottom: '2rem' }}>
        {event.description}
      </p>

      {/* Ticket form */}
      <div style={{ background: '#fff', border: '1px solid var(--makay-sand-cream)', borderRadius: '20px', padding: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--makay-dark-navy)', marginBottom: '1.5rem' }}>
          {Number(event.price) === 0 ? 'Reserve Your Spot' : 'Get Tickets'}
        </h2>

        {success ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Check size={24} color="#fff" />
            </div>
            <p style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--makay-dark-navy)', marginBottom: '0.5rem' }}>
              You&apos;re in!
            </p>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.88rem', color: 'var(--makay-mauve)' }}>
              Confirmation sent to {form.customer_email}
            </p>
          </div>
        ) : soldOut ? (
          <p style={{ fontFamily: 'var(--font-montserrat)', color: '#ef4444', textAlign: 'center', padding: '1rem 0' }}>This event is sold out.</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--makay-dark-navy)', display: 'block', marginBottom: '0.35rem' }}>Full Name *</label>
              <input required value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                placeholder="Your full name" className="seller-input" style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--makay-dark-navy)', display: 'block', marginBottom: '0.35rem' }}>Email *</label>
              <input required type="email" value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))}
                placeholder="your@email.com" className="seller-input" style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--makay-dark-navy)', display: 'block', marginBottom: '0.35rem' }}>
                Number of Tickets (max {Math.min(remaining, 10)})
              </label>
              <input type="number" min={1} max={Math.min(remaining, 10)} value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: Math.max(1, Math.min(Number(e.target.value), remaining)) }))}
                className="seller-input" style={{ width: 100 }} />
            </div>

            {error && <p style={{ color: '#ef4444', fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem' }}>{error}</p>}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <div>
                <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-mauve)', margin: 0 }}>Total</p>
                <p style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--makay-peachy-rose)', margin: 0 }}>
                  {total === 0 ? 'Free' : `$${total.toFixed(2)}`}
                </p>
              </div>
              <button type="submit" disabled={submitting}
                style={{ padding: '0.75rem 2rem', borderRadius: '100px', background: 'var(--makay-dark-navy)', color: '#fff', border: 'none', fontFamily: 'var(--font-montserrat)', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Processing…' : 'Confirm Tickets'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
