'use client';

import { useState } from 'react';
import { X, User } from 'lucide-react';

export interface WorkerSale {
  saleId: string;
  product: string;
  amount: number;
  time: string;
}

export interface WorkerDetail {
  workerId: string;
  name: string;
  clockInTime: string;
  breakMinutes: number;
  activeMinutes: number;
  sales: WorkerSale[];
  notes: string;
}

interface WorkerDetailPanelProps {
  worker: WorkerDetail | null;
  onClose: () => void;
  onNotesChange: (workerId: string, notes: string) => void;
}

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function WorkerDetailPanel({ worker, onClose, onNotesChange }: WorkerDetailPanelProps) {
  const [notes, setNotes] = useState(worker?.notes ?? '');

  if (!worker) return null;

  const handleNotesBlur = () => {
    onNotesChange(worker.workerId, notes);
  };

  const activeHours = Math.floor(worker.activeMinutes / 60);
  const activeMins = worker.activeMinutes % 60;

  return (
    <div className="worker-panel-overlay" onClick={onClose}>
      <div className="worker-panel-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="worker-panel-header">
          <div className="worker-panel-avatar">
            <User size={20} />
          </div>
          <div>
            <h3 className="worker-panel-name">{worker.name}</h3>
            <p className="worker-panel-id">ID: {worker.workerId}</p>
          </div>
          <button className="worker-panel-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="worker-panel-body">
          <section className="worker-panel-section">
            <h4 className="worker-panel-section-title">Shift Timeline</h4>
            <div className="shift-timeline">
              <div className="shift-timeline-row">
                <span className="shift-label">Clock-in</span>
                <span className="shift-value">{formatTime(worker.clockInTime)}</span>
              </div>
              <div className="shift-timeline-row">
                <span className="shift-label">Break</span>
                <span className="shift-value">{worker.breakMinutes} min</span>
              </div>
              <div className="shift-timeline-row">
                <span className="shift-label">Active time</span>
                <span className="shift-value">{activeHours}h {activeMins}m</span>
              </div>
            </div>
          </section>

          <section className="worker-panel-section">
            <h4 className="worker-panel-section-title">Today&apos;s Sales</h4>
            {worker.sales.length === 0 ? (
              <p className="sup-empty">No sales yet.</p>
            ) : (
              <ul className="worker-sales-list">
                {worker.sales.map((sale) => (
                  <li key={sale.saleId} className="worker-sale-item">
                    <span className="worker-sale-product">{sale.product}</span>
                    <span className="worker-sale-amount">${sale.amount}</span>
                    <span className="worker-sale-time">{sale.time}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="worker-panel-section">
            <h4 className="worker-panel-section-title">Supervisor Notes</h4>
            <textarea
              className="worker-notes-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Add notes about this worker..."
              rows={4}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
