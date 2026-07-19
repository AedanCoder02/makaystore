'use client';

import { Activity } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface ActivityEvent {
  id: string;
  workerName: string;
  action: string;
  timestamp: string;
}

interface LiveActivityFeedProps {
  events: ActivityEvent[];
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function LiveActivityFeed({ events }: LiveActivityFeedProps) {
  const t = useTranslations('supervisor');

  function formatRelativeTime(timestamp: string) {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('justNow');
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  }

  const shown = events.slice(0, 10);

  return (
    <div className="sup-section">
      <div className="sup-section-header">
        <Activity size={20} className="sup-section-icon" />
        <h2 className="sup-section-title">{t('liveActivityFeed')}</h2>
      </div>
      <div className="activity-feed-list">
        {shown.map((event) => (
          <div key={event.id} className="activity-feed-item">
            <div className="activity-avatar">{getInitials(event.workerName)}</div>
            <div className="activity-content">
              <span className="activity-worker">{event.workerName}</span>{' '}
              <span className="activity-action">{event.action}</span>
            </div>
            <div className="activity-time">{formatRelativeTime(event.timestamp)}</div>
          </div>
        ))}
        {shown.length === 0 && <p className="sup-empty">{t('noActivityToday')}</p>}
      </div>
    </div>
  );
}
