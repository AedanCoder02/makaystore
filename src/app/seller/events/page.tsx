'use client';

import { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, ExternalLink } from 'lucide-react';
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
  status: string;
}

export default function SellerEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/events')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setEvents(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="seller-page">
      <div className="seller-page-header">
        <div>
          <h1 className="seller-page-title">Upcoming Events</h1>
          <p className="seller-page-sub">Share these events with your clients to drive engagement.</p>
        </div>
        <Link href="/membership" target="_blank" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem', background: 'var(--makay-sand-cream)', borderRadius: '10px', fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: 'var(--makay-dark-navy)', textDecoration: 'none', fontWeight: 600 }}>
          <ExternalLink size={14} /> Customer View
        </Link>
      </div>

      {loading ? (
        <p style={{ fontFamily: 'var(--font-montserrat)', color: 'var(--makay-mauve)' }}>Loading…</p>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--makay-mauve)', fontFamily: 'var(--font-montserrat)' }}>
          <Calendar size={40} style={{ margin: '0 auto 1rem', color: 'var(--makay-sand-cream)', display: 'block' }} />
          <p>No events scheduled yet. Admins create events in the admin panel.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {events.map(ev => {
            const remaining = ev.capacity - ev.tickets_sold;
            const soldOut = remaining <= 0;
            return (
              <div key={ev.id} style={{ background: '#fff', border: '1px solid var(--makay-sand-cream)', borderRadius: '14px', overflow: 'hidden' }}>
                {ev.image_url && (
                  <img src={ev.image_url} alt={ev.title} style={{ width: '100%', height: 140, objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
                <div style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--makay-dark-navy)', margin: '0 0 0.5rem' }}>{ev.title}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.875rem' }}>
                    {ev.event_date && (
                      <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: 'var(--makay-mauve)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Calendar size={11} />
                        {new Date(ev.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {ev.location && (
                      <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: 'var(--makay-mauve)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={11} /> {ev.location}
                      </span>
                    )}
                    <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: soldOut ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Users size={11} /> {soldOut ? 'Sold out' : `${remaining} spots left`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--makay-peachy-rose)' }}>
                      {Number(ev.price) === 0 ? 'Free' : `$${Number(ev.price).toFixed(2)}`}
                    </span>
                    {!soldOut && (
                      <Link href={`/events/${ev.id}`} target="_blank" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-montserrat)', fontWeight: 600, color: 'var(--makay-dark-navy)', textDecoration: 'underline' }}>
                        Share link →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
