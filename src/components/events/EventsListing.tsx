'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, Ticket, Star, Crown, Award, Shield } from 'lucide-react';

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
  tags?: string;
}

const TIERS = [
  { key: 'free',   label: 'Explorer', color: '#A89080', icon: Shield, perks: ['Full catalog access', 'Member QR card', 'Event access'] },
  { key: 'bronze', label: 'Bronze',   color: '#CD7F32', icon: Award,  perks: ['Explorer perks', 'Early drop access', '5% credit back'] },
  { key: 'silver', label: 'Silver',   color: '#A8A9AD', icon: Star,   perks: ['Bronze perks', 'Priority event tickets', '10% credit back'] },
  { key: 'gold',   label: 'Gold',     color: '#D4AF37', icon: Star,   perks: ['Silver perks', 'VIP event access', '15% credit back', 'Personal stylist'] },
  { key: 'vip',    label: 'VIP',      color: '#D4A574', icon: Crown,  perks: ['All perks', 'Exclusive collections', '20% credit back', 'Complimentary alterations'] },
];

const TIER_SPEND: Record<string, number | null> = {
  free: 0, bronze: 100, silver: 300, gold: 700, vip: 1500,
};

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
    <main>
      {/* ── Hero ── */}
      <section style={{
        position: 'relative',
        background: 'linear-gradient(160deg, #1e1611 0%, #2c1f14 50%, #1a1208 100%)',
        color: '#fff',
        padding: 'clamp(4rem, 10vw, 8rem) 1.25rem clamp(3rem, 8vw, 6rem)',
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        {/* Decorative gradient orbs */}
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,165,116,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,132,87,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--makay-peachy-rose)', marginBottom: '1rem' }}>
            Makay Beach Club
          </p>
          <h1 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700, lineHeight: 1.1, marginBottom: '1.25rem' }}>
            Exclusive Experiences
          </h1>
          <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: '2rem' }}>
            Curated events, intimate gatherings, and member-only moments at the beach club.
            Each event is designed to connect the Makay community.
          </p>
          <Link href="#events" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.875rem 2rem', background: 'var(--makay-peachy-rose)',
            color: '#fff', borderRadius: '100px', fontFamily: 'var(--font-montserrat)',
            fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}>
            <Ticket size={16} /> Browse Events
          </Link>
        </div>
      </section>

      {/* ── Events grid ── */}
      <section id="events" style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(3rem, 6vw, 5rem) 1.25rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, color: 'var(--makay-dark-navy)', margin: '0 0 0.75rem' }}>
            Upcoming Events
          </h2>
          <p style={{ fontFamily: 'var(--font-montserrat)', color: 'var(--makay-mauve)', fontSize: '0.95rem' }}>
            Reserve your spot before it sells out.
          </p>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--makay-mauve)', fontFamily: 'var(--font-montserrat)', padding: '3rem' }}>Loading events…</p>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <Calendar size={52} style={{ color: 'var(--makay-sand-cream)', marginBottom: '1.25rem', display: 'block', margin: '0 auto 1.25rem' }} />
            <p style={{ fontFamily: 'var(--font-montserrat)', color: 'var(--makay-mauve)', fontSize: '1rem', marginBottom: '0.5rem' }}>No events scheduled yet.</p>
            <p style={{ fontFamily: 'var(--font-montserrat)', color: '#c4b4a0', fontSize: '0.85rem' }}>Check back soon for upcoming beach club events.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {events.map(ev => {
              const remaining = ev.capacity - ev.tickets_sold;
              const soldOut = remaining <= 0;
              const soldPct = Math.round((ev.tickets_sold / ev.capacity) * 100);
              const tags = ev.tags ? ev.tags.split(',').map(s => s.trim()).filter(Boolean) : [];

              return (
                <article key={ev.id} style={{
                  background: '#fff',
                  border: '1px solid var(--makay-sand-cream)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                }}>
                  {/* Cover */}
                  <div style={{ position: 'relative', height: 200, background: 'linear-gradient(135deg, var(--makay-sand-cream), var(--makay-peachy-rose))' }}>
                    {ev.image_url && (
                      <img src={ev.image_url} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    {!ev.image_url && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Calendar size={48} color="rgba(255,255,255,0.6)" />
                      </div>
                    )}
                    {/* Price badge */}
                    <div style={{
                      position: 'absolute', top: '0.875rem', right: '0.875rem',
                      background: 'rgba(28,22,17,0.85)', backdropFilter: 'blur(8px)',
                      color: '#fff', padding: '0.3rem 0.75rem', borderRadius: '100px',
                      fontFamily: 'var(--font-playfair-display)', fontSize: '0.95rem', fontWeight: 700,
                    }}>
                      {Number(ev.price) === 0 ? 'Free' : `$${Number(ev.price).toFixed(2)}`}
                    </div>
                    {soldOut && (
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-montserrat)', fontWeight: 700, color: '#fff', fontSize: '1rem', letterSpacing: '0.1em',
                      }}>SOLD OUT</div>
                    )}
                  </div>

                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.75rem' }}>
                    {/* Tags */}
                    {tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {tags.map(tag => (
                          <span key={tag} style={{ padding: '0.15rem 0.55rem', background: 'rgba(212,165,116,0.12)', borderRadius: '100px', fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', fontWeight: 600, color: 'var(--makay-peachy-rose)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tag}</span>
                        ))}
                      </div>
                    )}

                    <h3 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--makay-dark-navy)', margin: 0, lineHeight: 1.2 }}>
                      {ev.title}
                    </h3>

                    <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: 'var(--makay-mauve)', margin: 0, lineHeight: 1.6, flex: 1 }}>
                      {ev.description?.slice(0, 120)}{ev.description?.length > 120 ? '…' : ''}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {ev.event_date && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-dark-navy)' }}>
                          <Calendar size={13} style={{ color: 'var(--makay-peachy-rose)', flexShrink: 0 }} />
                          {new Date(ev.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      {ev.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-mauve)' }}>
                          <MapPin size={13} style={{ flexShrink: 0 }} /> {ev.location}
                        </div>
                      )}
                    </div>

                    {/* Capacity bar */}
                    <div>
                      <div style={{ height: 4, background: 'var(--makay-sand-cream)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(soldPct, 100)}%`, borderRadius: 2, background: soldPct >= 90 ? '#ef4444' : soldPct >= 60 ? '#f59e0b' : '#10b981', transition: 'width 0.4s' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', color: 'var(--makay-mauve)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Users size={10} />{ev.tickets_sold} going</span>
                        <span>{soldOut ? 'Sold out' : `${remaining} left`}</span>
                      </div>
                    </div>

                    <Link href={`/events/${ev.id}`} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                      padding: '0.75rem', borderRadius: '12px',
                      background: soldOut ? 'var(--makay-sand-cream)' : 'var(--makay-dark-navy)',
                      color: soldOut ? 'var(--makay-mauve)' : '#fff',
                      fontFamily: 'var(--font-montserrat)', fontSize: '0.85rem', fontWeight: 600,
                      textDecoration: 'none', pointerEvents: soldOut ? 'none' : 'auto',
                    }}>
                      <Ticket size={14} /> {soldOut ? 'Sold Out' : 'Get Tickets'}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Membership section ── */}
      <section style={{ background: 'linear-gradient(160deg, #1e1611, #2c1f14)', padding: 'clamp(4rem, 8vw, 7rem) 1.25rem', color: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem, 5vw, 4rem)' }}>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--makay-peachy-rose)', marginBottom: '0.875rem' }}>
              Membership Program
            </p>
            <h2 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, margin: '0 0 1rem' }}>
              Unlock Your Benefits
            </h2>
            <p style={{ fontFamily: 'var(--font-montserrat)', color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem', maxWidth: 520, margin: '0 auto' }}>
              Every purchase moves you toward the next tier. More you shop, more you unlock.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '1rem' }}>
            {TIERS.map((tier, i) => {
              const Icon = tier.icon;
              const isVip = tier.key === 'vip';
              const spendReq = TIER_SPEND[tier.key];
              return (
                <div key={tier.key} style={{
                  background: isVip ? `linear-gradient(135deg, rgba(212,165,116,0.2), rgba(212,132,87,0.1))` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isVip ? tier.color + '40' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '16px',
                  padding: '1.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {isVip && (
                    <div style={{ position: 'absolute', top: 0, right: 0, background: tier.color, color: '#fff', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', padding: '0.2rem 0.6rem', borderRadius: '0 16px 0 8px', fontFamily: 'var(--font-montserrat)' }}>TOP</div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                    <Icon size={18} style={{ color: tier.color }} />
                    <span style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1rem', fontWeight: 700, color: tier.color }}>{tier.label}</span>
                  </div>
                  {spendReq !== null && spendReq > 0 && (
                    <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      From ${spendReq} total spend
                    </p>
                  )}
                  {spendReq === 0 && (
                    <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      All members
                    </p>
                  )}
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {tier.perks.map(perk => (
                      <li key={perk} style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                        <span style={{ color: tier.color, fontWeight: 700, flexShrink: 0 }}>✓</span> {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link href="/sign-up" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '1rem 2.5rem', background: 'var(--makay-peachy-rose)',
              color: '#fff', borderRadius: '100px', fontFamily: 'var(--font-montserrat)',
              fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
            }}>
              Join Makay Club
            </Link>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.875rem' }}>
              Free to join. Tier upgrades happen automatically.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
