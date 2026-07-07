'use client';

import type { RotationStatus } from '@/stores/rotationStore';

type BadgeStatus = RotationStatus | 'pending';

interface RotationStatusBadgeProps {
  status: BadgeStatus;
}

const STATUS_COLORS: Record<BadgeStatus, string> = {
  active: '#10b981',
  paused: '#f59e0b',
  archived: '#6b7280',
  pending: '#3b82f6',
};

export default function RotationStatusBadge({ status }: RotationStatusBadgeProps) {
  return (
    <span
      className="status-badge"
      style={{ backgroundColor: STATUS_COLORS[status] }}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
