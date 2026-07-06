'use client';

import { Activity } from '@/stores/workerStore';

export default function ActivityLogWorker({ activityLog }: { activityLog: Activity[] }) {
  return (
    <div className="activity-log">
      <h3 className="activity-title">Today's Activity</h3>
      {activityLog.length === 0 ? (
        <p className="no-activity">No activity yet.</p>
      ) : (
        <div className="activity-items">
          {activityLog.map((activity, idx) => (
            <div key={idx} className="activity-item">
              <span className="activity-time">
                {new Date(activity.timestamp).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}
              </span>
              <span className="activity-action">
                {activity.action === 'clock-in' ? '→ Clocked In' : '← Clocked Out'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
