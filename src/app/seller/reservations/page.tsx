'use client';
import { useTranslations } from 'next-intl';

import { useEffect, useState, useCallback } from 'react';
import { Calendar, Clock, Users, Phone, Mail, Check, X, HelpCircle, Plus, List } from 'lucide-react';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';
import ReservationFlow from '@/components/reservations/ReservationFlow';

interface Reservation {
  id: number;
  name: string;
  email: string;
  phone: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  experience_name: string | null;
  total_price: string | null;
  has_extra_addon: boolean;
  notes: string | null;
  status: string;
}

const STATUS_COLOR: Record<string, string> = {
  confirmed: '#D4A574', attended: '#10b981', cancelled: '#9ca3af',
};

type RangeFilter = 'upcoming' | 'month' | 'all';
const RANGES: RangeFilter[] = ['upcoming', 'month', 'all'];

export default function SellerReservationsPage() {
  const tb = useTranslations('seller.reservationsPage');
  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [range, setRange] = useState<RangeFilter>('month');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const tutorialStore = useTutorialStore();
  const tutorialUI = useTutorialOverlay('seller-reservations-tour');

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/seller/reservations?range=${range}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setReservations(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [range]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!tutorialStore.isCompleted('seller-reservations-tour') && !tutorialStore.currentTutorial) {
      tutorialStore.showTutorial('seller-reservations-tour');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = async (id: number, status: string) => {
    setUpdating(id);
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    await fetch('/api/seller/reservations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    }).catch(() => {});
    setUpdating(null);
  };

  // Venezuela local date (UTC-4), not UTC, so the count doesn't roll over at 8 PM.
  const todayLocal = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Caracas' });
  const todayCount = reservations.filter(r => r.reservation_date.slice(0, 10) === todayLocal).length;
  const totalGuests = reservations.reduce((s, r) => s + r.party_size, 0);

  return (
    <div className="seller-page">
      {tutorialUI}
      <div className="seller-page-header">
        <div>
          <h1 className="seller-page-title">{tb('reservations')}</h1>
          <p className="seller-page-sub">
            {mode === 'list' ? tb('upcomingExperienceBookingsCheckAnd') : tb('createABookingForA')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {mode === 'list' ? (
            <button className="seller-btn-primary" onClick={() => setMode('create')}>
              <Plus size={16} /> {tb('newBooking')}
            </button>
          ) : (
            <button className="seller-btn-ghost" onClick={() => setMode('list')}>
              <List size={16} /> {tb('viewBookings')}
            </button>
          )}
          <button className="seller-btn-ghost help-button" onClick={() => tutorialStore.showTutorial('seller-reservations-tour')} aria-label={tb('showTutorial')}>
            <HelpCircle size={16} />
          </button>
        </div>
      </div>

      {mode === 'create' ? (
        <ReservationFlow embedded allowPastDates onDone={() => { setMode('list'); load(); }} />
      ) : (
      <>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {RANGES.map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            style={{
              padding: '0.4rem 0.9rem', borderRadius: 100, fontSize: '0.8rem',
              fontFamily: 'var(--font-montserrat)', fontWeight: 600, cursor: 'pointer',
              border: '1px solid', transition: 'all .15s',
              borderColor: range === r ? 'var(--makay-dark-navy)' : '#e5e7eb',
              background: range === r ? 'var(--makay-dark-navy)' : '#fff',
              color: range === r ? '#fff' : 'var(--makay-mauve)',
            }}
          >
            {tb(`range.${r}`)}
          </button>
        ))}
      </div>

      <div className="seller-stats-grid">
        <div className="seller-stat-card">
          <Calendar size={22} className="seller-stat-icon" />
          <span className="seller-stat-value">{reservations.length}</span>
          <span className="seller-stat-label">{tb(`range.${range}`)}</span>
        </div>
        <div className="seller-stat-card">
          <Clock size={22} className="seller-stat-icon" />
          <span className="seller-stat-value">{todayCount}</span>
          <span className="seller-stat-label">{tb('today')}</span>
        </div>
        <div className="seller-stat-card">
          <Users size={22} className="seller-stat-icon" />
          <span className="seller-stat-value">{totalGuests}</span>
          <span className="seller-stat-label">{tb('totalGuests')}</span>
        </div>
      </div>

      {loading ? (
        <p style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>{tb('loading')}</p>
      ) : reservations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--makay-mauve)', fontFamily: 'var(--font-montserrat)' }}>
          <Calendar size={40} style={{ margin: '0 auto 1rem', color: 'var(--makay-sand-cream)', display: 'block' }} />
          <p>{tb('noUpcomingBookingsForNow')}</p>
        </div>
      ) : (
        <div className="sp-table-wrap">
          <table className="sp-table">
            <thead>
              <tr>
                <th>{tb('date')}</th>
                <th>{tb('time')}</th>
                <th>{tb('experience')}</th>
                <th>{tb('guest')}</th>
                <th style={{ textAlign: 'right' }}>{tb('guests')}</th>
                <th style={{ textAlign: 'right' }}>{tb('total')}</th>
                <th>{tb('status2')}</th>
                <th style={{ width: 140 }}>{tb('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map(r => (
                <tr key={r.id} className="sp-row">
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(r.reservation_date.slice(0, 10) + 'T00:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short' })}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{r.reservation_time}</td>
                  <td>
                    <span className="sp-title">{r.experience_name || '—'}</span>
                    {r.has_extra_addon && <span className="sp-meta">+ Extra</span>}
                  </td>
                  <td>
                    <span className="sp-title">{r.name}</span>
                    <span className="sp-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Mail size={10} /> {r.email}</span>
                    <span className="sp-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Phone size={10} /> {r.phone}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>{r.party_size}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{r.total_price ? `$${Number(r.total_price).toFixed(2)}` : '—'}</td>
                  <td>
                    <span className="sp-status-dot" style={{ background: STATUS_COLOR[r.status] ?? '#9ca3af' }} />
                    <span className="sp-status-label">{['confirmed', 'attended', 'cancelled'].includes(r.status) ? tb(`status.${r.status}`) : r.status}</span>
                  </td>
                  <td>
                    {r.status === 'confirmed' && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="seller-icon-btn save" title={tb('markAsAttended')} disabled={updating === r.id} onClick={() => updateStatus(r.id, 'attended')}>
                          <Check size={14} />
                        </button>
                        <button className="seller-icon-btn cancel" title={tb('cancel')} disabled={updating === r.id} onClick={() => updateStatus(r.id, 'cancelled')}>
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </>
      )}
    </div>
  );
}
