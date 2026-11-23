'use client';

import { useEffect, useState, useCallback } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSupervisorStore } from '@/stores/supervisorStore';

export interface ActivityEvent {
  id: string;
  workerId: string;
  workerName: string;
  type: string;
  action: string;
  note?: string;
  status: string;
  timestamp: string;
}

const TYPE_LABELS: Record<string, string> = {
  'clock-in':     'Entrada',
  'clock-out':    'Salida',
  'stock-update': 'Stock',
  'sale':         'Venta',
};

const TYPE_COLOR: Record<string, string> = {
  'clock-in':     '#10b981',
  'clock-out':    '#ef4444',
  'stock-update': '#3b82f6',
  'sale':         '#8b5cf6',
};

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDateTime(timestamp: string) {
  const d = new Date(timestamp);
  return d.toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// LiveActivityFeed is self-fetching so filter state stays local
export default function LiveActivityFeed({ events: _ignored }: { events?: ActivityEvent[] }) {
  const t = useTranslations('supervisor');
  const workers = useSupervisorStore(s => s.workersStatus);

  const [events, setEvents]           = useState<ActivityEvent[]>([]);
  const [loading, setLoading]         = useState(true);
  const [sellerFilter, setSellerFilter] = useState('');
  const [typeFilter, setTypeFilter]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (sellerFilter) params.set('seller', sellerFilter);
    if (typeFilter)   params.set('type', typeFilter);
    const data = await fetch(`/api/supervisor/activity?${params}`)
      .then(r => r.ok ? r.json() : [])
      .catch(() => []);
    setEvents(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [sellerFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="sup-section">
      <div className="sup-section-header" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <Activity size={20} className="sup-section-icon" />
        <h2 className="sup-section-title" style={{ flex: 1 }}>{t('liveActivityFeed')}</h2>

        {/* Seller filter */}
        {workers.length > 0 && (
          <select
            value={sellerFilter}
            onChange={e => setSellerFilter(e.target.value)}
            style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', padding: '0.25rem 0.5rem', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', color: 'var(--makay-dark-navy)', cursor: 'pointer' }}
          >
            <option value="">Todos los vendedores</option>
            {workers.map(w => (
              <option key={w.workerId} value={w.workerId}>{w.name}</option>
            ))}
          </select>
        )}

        {/* Action type filter */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {(['', 'clock-in', 'clock-out', 'stock-update', 'sale'] as const).map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: 100, border: `1px solid ${typeFilter === type ? (TYPE_COLOR[type] ?? 'var(--makay-peachy-rose)') : '#e5e7eb'}`, background: typeFilter === type ? `${TYPE_COLOR[type] ?? 'var(--makay-peachy-rose)'}18` : '#fff', color: typeFilter === type ? (TYPE_COLOR[type] ?? 'var(--makay-peachy-rose)') : 'var(--makay-mauve)', cursor: 'pointer' }}
            >
              {type === '' ? 'Todos' : TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        <button
          onClick={load}
          disabled={loading}
          style={{ background: 'none', border: 'none', cursor: loading ? 'wait' : 'pointer', color: 'var(--makay-mauve)', display: 'flex', padding: '0.2rem' }}
          title="Actualizar"
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      <div className="activity-feed-list">
        {loading ? (
          <p className="sup-empty" style={{ padding: '1rem 0' }}>Cargando…</p>
        ) : events.length === 0 ? (
          <p className="sup-empty">{t('noActivityToday')}</p>
        ) : events.map((event) => (
          <div key={event.id} className="activity-feed-item">
            <div className="activity-avatar">{getInitials(event.workerName)}</div>
            <div className="activity-content" style={{ flex: 1, minWidth: 0 }}>
              <span className="activity-worker">{event.workerName}</span>{' '}
              <span
                className="activity-action"
                style={{ color: TYPE_COLOR[event.type] ?? 'var(--makay-dark-navy)' }}
              >
                {event.action}
              </span>
              {event.note && (
                <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.7rem', color: 'var(--makay-mauve)', margin: '0.1rem 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {event.note}
                </p>
              )}
            </div>
            <div className="activity-time" style={{ flexShrink: 0, fontSize: '0.68rem' }}>
              {formatDateTime(String(event.timestamp))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
