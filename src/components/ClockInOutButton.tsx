'use client';

import { useState } from 'react';

export default function ClockInOutButton({
  clockedIn,
  onClockIn,
  onClockOut,
}: {
  clockedIn: boolean;
  onClockIn: () => void;
  onClockOut: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      if (clockedIn) {
        onClockOut();
      } else {
        onClockIn();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`clock-in-button ${clockedIn ? 'clocked-in' : ''}`}
      onClick={handleClick}
      disabled={loading}
      aria-label={clockedIn ? 'Clock Out' : 'Clock In'}
    >
      {loading ? 'Processing...' : clockedIn ? 'Clock Out' : 'Clock In'}
    </button>
  );
}
