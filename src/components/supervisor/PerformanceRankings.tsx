'use client';

import { Award } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface WorkerRank {
  workerId: string;
  name: string;
  salesToday: number;
  tasksCompleted: number;
  hoursWorked: number;
  score: number;
}

interface PerformanceRankingsProps {
  rankings: WorkerRank[];
}

export default function PerformanceRankings({ rankings }: PerformanceRankingsProps) {
  const t = useTranslations('supervisor');
  const sorted = [...rankings].sort((a, b) => b.score - a.score);

  return (
    <div className="sup-section">
      <div className="sup-section-header">
        <Award size={20} className="sup-section-icon" />
        <h2 className="sup-section-title">{t('performanceRankings')}</h2>
      </div>
      <div className="rankings-table-wrapper">
        <table className="rankings-table">
          <thead>
            <tr>
              <th>{t('rank')}</th>
              <th>{t('worker')}</th>
              <th>{t('salesCol')}</th>
              <th>{t('tasksCol')}</th>
              <th>{t('hoursCol')}</th>
              <th>{t('score')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((worker, idx) => (
              <tr key={worker.workerId} className={idx === 0 ? 'rankings-top-row' : ''}>
                <td className="rank-cell">
                  {idx === 0 ? <span className="rank-gold">#1</span> : <span className="rank-number">#{idx + 1}</span>}
                </td>
                <td className="rankings-name-cell">
                  {idx === 0 && <Award size={14} className="top-performer-icon" />}
                  {worker.name}
                </td>
                <td>${worker.salesToday}</td>
                <td>{worker.tasksCompleted}</td>
                <td>{worker.hoursWorked}h</td>
                <td>
                  <span className={`score-badge ${idx === 0 ? 'score-badge-gold' : ''}`}>
                    {worker.score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
