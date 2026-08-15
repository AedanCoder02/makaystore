'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Clock, Check, X as XIcon } from 'lucide-react';

interface ActivityEntry {
  id: string;
  workerId: string;
  workerName: string;
  action: string;
  timestamp: string;
  status: string;
}

export default function SupervisorShiftsPage() {
  const t = useTranslations('supervisor');
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const handleApproval = async (id: string, action: 'approve' | 'reject') => {
    setProcessing(id);
    try {
      await fetch('/api/supervisor/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId: id, action }),
      });
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, status: action === 'approve' ? 'approved' : 'rejected' } : e
        )
      );
    } finally {
      setProcessing(null);
    }
  };

  useEffect(() => {
    fetch('/api/supervisor/activity')
      .then((r) => r.ok ? r.json() : [])
      .then((data: ActivityEntry[]) => { setEntries(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const byWorker: Record<string, { name: string; events: ActivityEntry[] }> = {};
  for (const e of entries) {
    if (!byWorker[e.workerId]) byWorker[e.workerId] = { name: e.workerName, events: [] };
    byWorker[e.workerId].events.push(e);
  }

  return (
    <div className="sup-page">
      <div className="sup-page-header">
        <Clock size={22} className="sup-page-icon" />
        <h1 className="sup-page-title">{t('shifts')}</h1>
        <span className="sup-page-count">{t('date')}</span>
      </div>

      {loading ? (
        <p className="sup-loading">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="sup-empty-state">{t('noShifts')}</p>
      ) : (
        <div className="sup-shifts-grid">
          {Object.entries(byWorker).map(([id, { name, events }]) => {
            const clockIn = events.find((e) => e.action.includes('in'));
            const clockOut = events.find((e) => e.action.includes('out'));
            let hours = '—';
            if (clockIn && clockOut) {
              const diff = (new Date(clockOut.timestamp).getTime() - new Date(clockIn.timestamp).getTime()) / 3600000;
              hours = `${diff.toFixed(1)}h`;
            }
            return (
              <div key={id} className="sup-shift-card">
                <div className="sup-shift-avatar">{name[0]}</div>
                <div className="sup-shift-info">
                  <p className="sup-shift-name">{name}</p>
                  <p className="sup-shift-times">
                    In: {clockIn ? new Date(clockIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    {' · '}
                    Out: {clockOut ? new Date(clockOut.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t('active')}
                  </p>
                  <p className="sup-shift-hours">{hours} {t('hoursWorked')}</p>
                </div>
                <span className={`sup-shift-status ${clockOut ? 'done' : 'active'}`}>
                  {clockOut ? t('offline') : t('active')}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {entries.length > 0 && (
        <div className="sup-table-wrap" style={{ marginTop: '2rem' }}>
          <h2 className="sup-section-title" style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Full Log</h2>
          <table className="sup-table">
            <thead>
              <tr><th>{t('date')}</th><th>{t('worker')}</th><th>Acción</th><th>{t('status')}</th><th>Aprobar</th></tr>
            </thead>
            <tbody>
              {[...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((e) => (
                <tr key={e.id}>
                  <td className="sup-td-muted">{new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{e.workerName}</td>
                  <td>{e.action}</td>
                  <td><span className={`sup-order-status sup-order-status--${e.status}`}>{e.status}</span></td>
                  <td>
                    {e.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => handleApproval(e.id, 'approve')}
                          disabled={processing === e.id}
                          style={{ background: 'var(--makay-sage, #7a9e7e)', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                        >
                          <Check size={13} /> Aprobar
                        </button>
                        <button
                          onClick={() => handleApproval(e.id, 'reject')}
                          disabled={processing === e.id}
                          style={{ background: 'var(--makay-coral, #c0655a)', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                        >
                          <XIcon size={13} /> Rechazar
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
