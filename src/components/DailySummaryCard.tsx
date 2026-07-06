'use client';

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
  return (
    <div className="daily-summary">
      <h2>Today's Summary</h2>
      <div className="summary-stats">
        <div className="stat">
          <span className="label">Workers Clocked In:</span>
          <span className="value">
            {workersClockIn}/{totalWorkers}
          </span>
        </div>
        <div className="stat">
          <span className="label">Total Hours:</span>
          <span className="value">{totalHours}h</span>
        </div>
      </div>
    </div>
  );
}
