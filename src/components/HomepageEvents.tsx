'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Ticket, ArrowRight } from 'lucide-react';

const BG = 'https://d8j0ntlcm91z4.cloudfront.net/user_3EB2I1ekVpQy4uJr8950nm5Jt41/hf_20260719_020223_13228ad3-42dc-44fe-88f5-9624ff49e7b9.png';

interface Event {
  id: number; title: string; description: string;
  event_date: string; location: string; image_url: string;
  price: number; capacity: number; tickets_sold: number;
}

export default function HomepageEvents() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetch('/api/events').then(r => r.ok ? r.json() : []).then(d => setEvents(Array.isArray(d) ? d.slice(0, 3) : [])).catch(() => {});
  }, []);

  return (
    <section style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Beach background with overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${BG})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(28,22,17,0.75) 0%, rgba(28,22,17,0.88) 100%)' }} />

      <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', padding: 'clamp(4rem, 8vw, 7rem) 1.25rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'clamp(2rem, 4vw, 3rem)', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--makay-peachy-rose)', marginBottom: '0.75rem' }}>
              Beach Club Events
            </p>
            <h2 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.1 }}>
              Upcoming Experiences
            </h2>
          </div>
          <Link href="/events" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-montserrat)',
            fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none',
            transition: 'color 0.2s', whiteSpace: 'nowrap',
          }}>
            View all events <ArrowRight size={14} />
          </Link>
        </div>

        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <Calendar size={40} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
            <p style={{ fontFamily: 'var(--font-montserrat)', color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
              No upcoming events yet. Check back soon.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {events.map(ev => {
              const soldOut = ev.tickets_sold >= ev.capacity;
              return (
                <Link key={ev.id} href={`/events/${ev.id}`} style={{ textDecoration: 'none' }}>
                  <article style={{
                    background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, overflow: 'hidden',
                    transition: 'border-color 0.2s, transform 0.2s',
                    cursor: 'pointer',
                  }}>
                    {ev.image_url && (
                      <img src={ev.image_url} alt={ev.title} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    {!ev.image_url && (
                      <div style={{ height: 100, background: 'rgba(212,165,116,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Calendar size={32} style={{ color: 'var(--makay-peachy-rose)' }} />
                      </div>
                    )}
                    <div style={{ padding: '1.25rem' }}>
                      <h3 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: '0 0 0.5rem' }}>{ev.title}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1rem' }}>
                        {ev.event_date && (
                          <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Calendar size={11} style={{ color: 'var(--makay-peachy-rose)' }} />
                            {new Date(ev.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {ev.location && (
                          <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <MapPin size={11} /> {ev.location}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--makay-peachy-rose)' }}>
                          {Number(ev.price) === 0 ? 'Free' : `$${Number(ev.price).toFixed(2)}`}
                        </span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.35rem 0.875rem', borderRadius: '100px',
                          background: soldOut ? 'rgba(255,255,255,0.08)' : 'var(--makay-peachy-rose)',
                          color: '#fff', fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', fontWeight: 600,
                        }}>
                          <Ticket size={12} /> {soldOut ? 'Sold Out' : 'Get Tickets'}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
