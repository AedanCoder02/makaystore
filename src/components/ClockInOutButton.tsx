'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('worker');
  const tCommon = useTranslations('common');

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
      aria-label={clockedIn ? t('clockOut') : t('clockIn')}
    >
      {loading ? tCommon('processing') : clockedIn ? t('clockOut') : t('clockIn')}
    </button>
  );
}
