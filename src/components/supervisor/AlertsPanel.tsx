'use client';

import { AlertTriangle, AlertCircle, X, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

export type AlertSeverity = 'warning' | 'critical';

export interface SupervisorAlert {
  id: string;
  severity: AlertSeverity;
  message: string;
  actionLabel?: string;
}

interface AlertsPanelProps {
  alerts: SupervisorAlert[];
  onDismiss: (alertId: string) => void;
}

export default function AlertsPanel({ alerts, onDismiss }: AlertsPanelProps) {
  const t = useTranslations('supervisor');

  return (
    <div className="sup-section">
      <div className="sup-section-header">
        <AlertTriangle size={20} className="sup-section-icon" />
        <h2 className="sup-section-title">{t('alertsTitle')}</h2>
        {alerts.length > 0 && <span className="alerts-count-badge">{alerts.length}</span>}
      </div>
      <div className="alerts-list">
        {alerts.length === 0 && <p className="sup-empty">{t('noAlerts')}</p>}
        {alerts.map((alert) => (
          <div key={alert.id} className={`alert-item alert-item-${alert.severity}`}>
            <div className="alert-icon-wrapper">
              {alert.severity === 'critical' ? <AlertCircle size={18} /> : <AlertTriangle size={18} />}
            </div>
            <div className="alert-content">
              <p className="alert-message">{alert.message}</p>
            </div>
            <div className="alert-actions">
              {alert.actionLabel && (
                <button className="alert-action-btn">
                  {alert.actionLabel}
                  <ArrowRight size={14} />
                </button>
              )}
              <button className="alert-dismiss-btn" onClick={() => onDismiss(alert.id)} aria-label="Dismiss alert">
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
