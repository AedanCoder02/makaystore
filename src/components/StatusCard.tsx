'use client';

import { useMemo, useState, useEffect } from 'react';

export default function StatusCard({
  clockedIn,
  startTime,
}: {
  clockedIn: boolean;
  startTime?: string;
}) {
  const [elapsedTime, setElapsedTime] = useState('');

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
    const interval = setInterval(updateElapsedTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [clockedIn, startTime]);

  return (
    <div className={`status-card ${clockedIn ? 'clocked-in' : 'clocked-out'}`}>
      <h2 className="status-text">
        {clockedIn ? 'You are clocked IN' : 'You are clocked OUT'}
      </h2>
      {clockedIn && elapsedTime && (
        <p className="elapsed-time">You've been working for {elapsedTime}</p>
      )}
    </div>
  );
}
