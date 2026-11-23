'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { HelpCircle, Clock, CheckCircle, LogIn, LogOut } from 'lucide-react';
import { useSellerActivity } from '@/hooks/useSellerActivity';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatDayHeader(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return 'Hoy';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function groupByDay(entries: { id: number; created_at: string }[]) {
  const groups: { day: string; items: typeof entries }[] = [];
  entries.forEach(entry => {
    const day = new Date(entry.created_at).toDateString();
    let group = groups.find(g => g.day === day);
    if (!group) { group = { day, items: [] }; groups.push(group); }
    group.items.push(entry);
  });
  return groups;
}

export default function SellerActivityPage() {
  const t = useTranslations('worker');
  const ts = useTranslations('seller');
  const activity = useSellerActivity();
  const tutorialStore = useTutorialStore();
  const tutorialUI = useTutorialOverlay('worker-clock-in');

  useEffect(() => {
    if (!tutorialStore.isCompleted('worker-clock-in')) {
      tutorialStore.showTutorial('worker-clock-in');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const elapsed = activity.clockedIn && activity.clockInTime
    ? Math.floor((Date.now() - new Date(activity.clockInTime).getTime()) / 60000)
    : 0;

  return (
    <div className="worker-activity-container">
      <div className="activity-header">
        <h1>{t('myActivity')}</h1>
        <button
          className="help-button seller-btn-ghost"
          onClick={() => tutorialStore.showTutorial('worker-clock-in')}
          aria-label={t('showTutorial')}
          title={t('showTutorial')}
        >
          <HelpCircle size={18} />
        </button>
      </div>

      <div className="activity-content">
        {/* Status card */}
        <div className="activity-status-card">
          <div className={`activity-status-dot ${activity.clockedIn ? 'active' : ''}`} />
          <div>
            <p className="activity-status-label">
              {activity.clockedIn ? t('clockedInStatus') : t('clockedOutStatus')}
            </p>
            {activity.clockedIn && activity.clockInTime && (
              <p className="activity-status-sub">
                {t('workingFor', { time: `${elapsed}m` })}
              </p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="seller-stats-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="seller-stat-card">
            <Clock size={20} style={{ color: 'var(--makay-peachy-rose)' }} />
            <p className="seller-stat-value">{activity.hoursWorked}h</p>
            <p className="seller-stat-label">{t('hoursWorked')}</p>
          </div>
          <div className="seller-stat-card">
            <CheckCircle size={20} style={{ color: 'var(--makay-ocean-teal)' }} />
            <p className="seller-stat-value">{activity.todaySessions}</p>
            <p className="seller-stat-label">{ts('sessionsToday')}</p>
          </div>
        </div>

        {/* Clock in / out */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button
            className="seller-btn-primary"
            onClick={activity.clockIn}
            disabled={activity.clockedIn || activity.loading}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <LogIn size={16} /> {t('clockIn')}
          </button>
          <button
            className="seller-btn-ghost"
            onClick={activity.clockOut}
            disabled={!activity.clockedIn || activity.loading}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <LogOut size={16} /> {t('clockOut')}
          </button>
        </div>

        {activity.error && (
          <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{activity.error}</p>
        )}

        {/* Activity log */}
        <div className="activity-log-section">
          <h3 style={{ fontFamily: 'var(--font-playfair)', marginBottom: '0.75rem', fontSize: '1.1rem' }}>
            {t('todayActivity')}
          </h3>
          {activity.log.length === 0 ? (
            <p style={{ color: 'var(--makay-mauve)', fontSize: '0.875rem' }}>{t('noActivity')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {groupByDay(activity.log).map(group => (
                <div key={group.day}>
                  <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--makay-mauve)', margin: '0 0 0.5rem' }}>
                    {formatDayHeader(group.items[0].created_at)}
                    <span style={{ marginLeft: '0.5rem', fontWeight: 600, textTransform: 'none', letterSpacing: 'normal', color: 'var(--makay-peachy-rose)' }}>
                      {group.items.filter((e: any) => e.type === 'clock-in').length} sesión{group.items.filter((e: any) => e.type === 'clock-in').length !== 1 ? 'es' : ''}
                    </span>
                  </p>
                  <div className="activity-log-list">
                    {group.items.map((entry: any) => (
                      <div key={entry.id} className="activity-log-row">
                        <span className={`activity-log-type ${entry.type === 'clock-in' ? 'in' : 'out'}`}>
                          {entry.type === 'clock-in' ? '→' : '←'} {entry.type === 'clock-in' ? t('clockIn') : t('clockOut')}
                        </span>
                        <span className="activity-log-time">
                          {formatDate(entry.created_at)} {formatTime(entry.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {tutorialUI}
    </div>
  );
}
