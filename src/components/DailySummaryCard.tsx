'use client';

import { useTranslations } from 'next-intl';

interface DailySummaryCardProps {
  totalWorkers: number;
  workersClockIn: number;
  totalHours: string;
}

export default function DailySummaryCard({
  totalWorkers,
  workersClockIn,
  totalHours,
}: DailySummaryCardProps) {
  const t = useTranslations('supervisor');

  return (
    <div className="daily-summary">
      <h2>{t('todaySummary')}</h2>
      <div className="summary-stats">
        <div className="stat">
          <span className="label">{t('workersClockIn')}:</span>
          <span className="value">
            {workersClockIn}/{totalWorkers}
          </span>
        </div>
        <div className="stat">
          <span className="label">{t('totalHours')}:</span>
          <span className="value">{totalHours}h</span>
        </div>
      </div>
    </div>
  );
}
