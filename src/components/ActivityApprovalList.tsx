'use client';

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
  return (
    <div className="pending-approvals">
      <h2>Pending Approvals</h2>
      {pendingApprovals.length === 0 ? (
        <p className="no-pending">All activities approved.</p>
      ) : (
        <div className="approval-items">
          {pendingApprovals.map((approval) => (
            <div key={approval.id} className="approval-item">
              <div className="approval-info">
                <h4>{approval.workerName}</h4>
                <p className="action">
                  {approval.action === 'clock-in' ? '→ Clock In' : '← Clock Out'}
                </p>
                <p className="timestamp">
                  {new Date(approval.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <div className="approval-actions">
                <button
                  className="btn btn-approve approve-button"
                  onClick={() => onApprove(approval.id)}
                  aria-label="Approve"
                >
                  ✓
                </button>
                <button
                  className="btn btn-reject"
                  onClick={() => onReject(approval.id)}
                  aria-label="Reject"
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
