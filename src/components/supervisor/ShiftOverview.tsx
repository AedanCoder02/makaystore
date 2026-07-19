'use client';

import { Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface ShiftRow {
  workerId: string;
  name: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualClockIn: string | null;
  status: 'on-shift' | 'not-started' | 'completed' | 'absent';
}

interface ShiftOverviewProps {
  shifts: ShiftRow[];
}

function fmt(time: string | null) {
  if (!time) return '--';
  return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ShiftOverview({ shifts }: ShiftOverviewProps) {
  const t = useTranslations('supervisor');

  const STATUS_LABELS: Record<ShiftRow['status'], string> = {
    'on-shift':    t('onShift'),
    'not-started': t('notStarted'),
    completed:     t('completedStatus'),
    absent:        t('absent'),
  };

  const STATUS_CLASSES: Record<ShiftRow['status'], string> = {
    'on-shift':    'shift-status-active',
    'not-started': 'shift-status-pending',
    completed:     'shift-status-done',
    absent:        'shift-status-absent',
  };

  return (
    <div className="sup-section">
      <div className="sup-section-header">
        <Clock size={20} className="sup-section-icon" />
        <h2 className="sup-section-title">{t('shiftOverview')}</h2>
      </div>
      <div className="shift-overview-list">
        {shifts.map((shift) => {
          const hasGap = !shift.actualClockIn && shift.status !== 'not-started';
          return (
            <div key={shift.workerId} className={`shift-row ${hasGap ? 'shift-row-gap' : ''}`}>
              <div className="shift-row-name">{shift.name}</div>
              <div className="shift-row-times">
                <span className="shift-scheduled">{fmt(shift.scheduledStart)} – {fmt(shift.scheduledEnd)}</span>
                <span className="shift-divider">|</span>
                <span className="shift-actual">{t('clockInLabel')} {fmt(shift.actualClockIn)}</span>
              </div>
              <div className={`shift-status-badge ${STATUS_CLASSES[shift.status]}`}>
                {STATUS_LABELS[shift.status]}
              </div>
              {hasGap && <div className="shift-gap-indicator">{t('coverageGap')}</div>}
            </div>
          );
        })}
        {shifts.length === 0 && <p className="sup-empty">{t('noShiftsScheduled')}</p>}
      </div>
    </div>
  );
}
