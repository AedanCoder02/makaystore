'use client';

import { useTranslations } from 'next-intl';
import { Approval } from '@/stores/supervisorStore';

interface ActivityApprovalListProps {
  pendingApprovals: Approval[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export default function ActivityApprovalList({
  pendingApprovals,
  onApprove,
  onReject,
}: ActivityApprovalListProps) {
  const t = useTranslations('supervisor');

  return (
    <div className="pending-approvals">
      <h2>{t('pendingApprovals')}</h2>
      {pendingApprovals.length === 0 ? (
        <p className="no-pending">{t('allApproved')}</p>
      ) : (
        <div className="approval-items">
          {pendingApprovals.map((approval) => (
            <div key={approval.id} className="approval-item">
              <div className="approval-info">
                <h4>{approval.workerName}</h4>
                <p className="action">
                  {approval.action === 'clock-in' ? t('clockInAction') : t('clockOutAction')}
                </p>
                <p className="timestamp">
                  {new Date(approval.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <div className="approval-actions">
                <button
                  className="btn btn-approve approve-button"
                  onClick={() => onApprove(approval.id)}
                  aria-label={t('approve')}
                >
                  ✓
                </button>
                <button
                  className="btn btn-reject"
                  onClick={() => onReject(approval.id)}
                  aria-label={t('reject')}
                >
                  ✗
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
