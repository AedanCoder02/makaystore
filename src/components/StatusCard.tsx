'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function StatusCard({
  clockedIn,
  startTime,
}: {
  clockedIn: boolean;
  startTime?: string;
}) {
  const [elapsedTime, setElapsedTime] = useState('');
  const t = useTranslations('worker');

  useEffect(() => {
    if (!clockedIn || !startTime) {
      setElapsedTime('');
      return;
    }

    const updateElapsedTime = () => {
      const start = new Date(startTime);
      const now = new Date();
      const diff = now.getTime() - start.getTime();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      setElapsedTime(`${hours}h ${minutes}m`);
    };

    updateElapsedTime();
    const interval = setInterval(updateElapsedTime, 60000);

    return () => clearInterval(interval);
  }, [clockedIn, startTime]);

  return (
    <div className={`status-card ${clockedIn ? 'clocked-in' : 'clocked-out'}`}>
      <h2 className="status-text">
        {clockedIn ? t('clockedInStatus') : t('clockedOutStatus')}
      </h2>
      {clockedIn && elapsedTime && (
        <p className="elapsed-time">{t('workingFor').replace('{time}', elapsedTime)}</p>
      )}
    </div>
  );
}
