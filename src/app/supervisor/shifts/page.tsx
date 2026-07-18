'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface ActivityEntry {
  id: string;
  workerId: string;
  workerName: string;
  action: string;
  timestamp: string;
  status: string;
}

export default function SupervisorShiftsPage() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/supervisor/activity')
      .then((r) => r.ok ? r.json() : [])
      .then((data: ActivityEntry[]) => { setEntries(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Group by worker for a shift summary view
  const byWorker: Record<string, { name: string; events: ActivityEntry[] }> = {};
  for (const e of entries) {
    if (!byWorker[e.workerId]) byWorker[e.workerId] = { name: e.workerName, events: [] };
    byWorker[e.workerId].events.push(e);
  }

  return (
    <div className="sup-page">
      <div className="sup-page-header">
        <Clock size={22} className="sup-page-icon" />
        <h1 className="sup-page-title">Shifts</h1>
        <span className="sup-page-count">Today&apos;s activity log</span>
      </div>

      {loading ? (
        <p className="sup-loading">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="sup-empty-state">No shift activity recorded today.</p>
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
                    Out: {clockOut ? new Date(clockOut.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'active'}
                  </p>
                  <p className="sup-shift-hours">{hours} worked</p>
                </div>
                <span className={`sup-shift-status ${clockOut ? 'done' : 'active'}`}>
                  {clockOut ? 'Done' : 'Active'}
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
              <tr><th>Time</th><th>Worker</th><th>Action</th><th>Status</th></tr>
            </thead>
            <tbody>
              {[...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((e) => (
                <tr key={e.id}>
                  <td className="sup-td-muted">{new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{e.workerName}</td>
                  <td>{e.action}</td>
                  <td><span className={`sup-order-status sup-order-status--${e.status}`}>{e.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
