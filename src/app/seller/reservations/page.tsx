'use client';

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
const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmada', attended: 'Atendida', cancelled: 'Cancelada',
};

type RangeFilter = 'upcoming' | 'month' | 'all';
const RANGE_LABELS: Record<RangeFilter, string> = { upcoming: 'Próximas', month: 'Este mes', all: 'Todas' };

export default function SellerReservationsPage() {
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

  const todayCount = reservations.filter(r => r.reservation_date.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  const totalGuests = reservations.reduce((s, r) => s + r.party_size, 0);

  return (
    <div className="seller-page">
      {tutorialUI}
      <div className="seller-page-header">
        <div>
          <h1 className="seller-page-title">Reservaciones</h1>
          <p className="seller-page-sub">
            {mode === 'list' ? 'Próximas reservas de experiencias — consulta y confirma llegadas.' : 'Crea una reserva para un cliente (walk-in o por teléfono).'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {mode === 'list' ? (
            <button className="seller-btn-primary" onClick={() => setMode('create')}>
              <Plus size={16} /> Nueva Reserva
            </button>
          ) : (
            <button className="seller-btn-ghost" onClick={() => setMode('list')}>
              <List size={16} /> Ver Reservas
            </button>
          )}
          <button className="seller-btn-ghost help-button" onClick={() => tutorialStore.showTutorial('seller-reservations-tour')} aria-label="Show tutorial">
            <HelpCircle size={16} />
          </button>
        </div>
      </div>

      {mode === 'create' ? (
        <ReservationFlow embedded allowPastDates onDone={() => { setMode('list'); load(); }} />
      ) : (
      <>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {(Object.keys(RANGE_LABELS) as RangeFilter[]).map(r => (
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
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>

      <div className="seller-stats-grid">
        <div className="seller-stat-card">
          <Calendar size={22} className="seller-stat-icon" />
          <span className="seller-stat-value">{reservations.length}</span>
          <span className="seller-stat-label">{RANGE_LABELS[range]}</span>
        </div>
        <div className="seller-stat-card">
          <Clock size={22} className="seller-stat-icon" />
          <span className="seller-stat-value">{todayCount}</span>
          <span className="seller-stat-label">Hoy</span>
        </div>
        <div className="seller-stat-card">
          <Users size={22} className="seller-stat-icon" />
          <span className="seller-stat-value">{totalGuests}</span>
          <span className="seller-stat-label">Total de personas</span>
        </div>
      </div>

      {loading ? (
        <p style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>Cargando…</p>
      ) : reservations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--makay-mauve)', fontFamily: 'var(--font-montserrat)' }}>
          <Calendar size={40} style={{ margin: '0 auto 1rem', color: 'var(--makay-sand-cream)', display: 'block' }} />
          <p>Sin reservas próximas por ahora.</p>
        </div>
      ) : (
        <div className="sp-table-wrap">
          <table className="sp-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Experiencia</th>
                <th>Cliente</th>
                <th style={{ textAlign: 'right' }}>Pax</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th>Estado</th>
                <th style={{ width: 140 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map(r => (
                <tr key={r.id} className="sp-row">
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(r.reservation_date + 'T00:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short' })}</td>
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
                    <span className="sp-status-label">{STATUS_LABEL[r.status] ?? r.status}</span>
                  </td>
                  <td>
                    {r.status === 'confirmed' && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="seller-icon-btn save" title="Marcar como atendida" disabled={updating === r.id} onClick={() => updateStatus(r.id, 'attended')}>
                          <Check size={14} />
                        </button>
                        <button className="seller-icon-btn cancel" title="Cancelar" disabled={updating === r.id} onClick={() => updateStatus(r.id, 'cancelled')}>
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
