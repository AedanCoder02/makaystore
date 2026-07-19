'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, Ticket } from 'lucide-react';

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

export default function EventsListing() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/events')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setEvents(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.25rem' }}>
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, color: 'var(--makay-dark-navy)', margin: 0 }}>
          Beach Club Events
        </h1>
        <p style={{ fontFamily: 'var(--font-montserrat)', color: 'var(--makay-mauve)', marginTop: '0.75rem', fontSize: '1rem' }}>
          Exclusive experiences for Makay members
        </p>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--makay-mauve)', fontFamily: 'var(--font-montserrat)' }}>Loading events…</p>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <Calendar size={48} style={{ color: 'var(--makay-sand-cream)', marginBottom: '1rem' }} />
          <p style={{ fontFamily: 'var(--font-montserrat)', color: 'var(--makay-mauve)' }}>No upcoming events yet. Check back soon.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {events.map(event => {
            const remaining = event.capacity - event.tickets_sold;
            const soldOut = remaining <= 0;
            return (
              <div key={event.id} style={{ background: '#fff', border: '1px solid var(--makay-sand-cream)', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {event.image_url ? (
                  <img src={event.image_url} alt={event.title} style={{ width: '100%', height: 200, objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div style={{ width: '100%', height: 140, background: 'linear-gradient(135deg, var(--makay-sand-cream), var(--makay-peachy-rose))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={40} style={{ color: '#fff' }} />
                  </div>
                )}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h2 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--makay-dark-navy)', margin: '0 0 0.5rem' }}>
                    {event.title}
                  </h2>
                  <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: 'var(--makay-mauve)', margin: '0 0 1rem', lineHeight: 1.5, flex: 1 }}>
                    {event.description}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
                    {event.event_date && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-dark-navy)' }}>
                        <Calendar size={13} style={{ color: 'var(--makay-peachy-rose)' }} />
                        {new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                    {event.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-mauve)' }}>
                        <MapPin size={13} /> {event.location}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: soldOut ? '#ef4444' : '#10b981' }}>
                      <Users size={13} /> {soldOut ? 'Sold out' : `${remaining} spots left`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--makay-peachy-rose)' }}>
                      {Number(event.price) === 0 ? 'Free' : `$${Number(event.price).toFixed(2)}`}
                    </span>
                    <Link href={`/events/${event.id}`} style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.6rem 1.25rem', borderRadius: '100px',
                      background: soldOut ? 'var(--makay-sand-cream)' : 'var(--makay-dark-navy)',
                      color: soldOut ? 'var(--makay-mauve)' : '#fff',
                      fontFamily: 'var(--font-montserrat)', fontSize: '0.8rem', fontWeight: 600,
                      textDecoration: 'none', pointerEvents: soldOut ? 'none' : 'auto',
                    }}>
                      <Ticket size={13} /> {soldOut ? 'Sold Out' : 'Get Tickets'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
