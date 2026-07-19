'use client';

import { useState } from 'react';
import { ClipboardPlus, MessageSquare, Clock, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Worker {
  workerId: string;
  name: string;
}

interface QuickActionsProps {
  workers: Worker[];
}

type ModalType = 'assign-task' | 'send-message' | 'extend-shift' | null;

export default function QuickActions({ workers }: QuickActionsProps) {
  const t = useTranslations('supervisor');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [formData, setFormData] = useState({
    workerId: workers[0]?.workerId ?? '',
    taskName: '',
    dueTime: '',
    message: '',
    duration: '30',
  });
  const [submitted, setSubmitted] = useState<string | null>(null);

  const close = () => {
    setActiveModal(null);
    setSubmitted(null);
    setFormData({ workerId: workers[0]?.workerId ?? '', taskName: '', dueTime: '', message: '', duration: '30' });
  };

  const handleSubmit = (e: React.FormEvent, label: string) => {
    e.preventDefault();
    setSubmitted(label);
    setTimeout(close, 1200);
  };

  return (
    <div className="sup-section">
      <div className="sup-section-header">
        <ClipboardPlus size={20} className="sup-section-icon" />
        <h2 className="sup-section-title">{t('quickActions')}</h2>
      </div>

      <div className="quick-actions-grid">
        <button className="quick-action-btn" onClick={() => setActiveModal('assign-task')}>
          <ClipboardPlus size={20} />{t('assignTask')}
        </button>
        <button className="quick-action-btn" onClick={() => setActiveModal('send-message')}>
          <MessageSquare size={20} />{t('sendMessage')}
        </button>
        <button className="quick-action-btn" onClick={() => setActiveModal('extend-shift')}>
          <Clock size={20} />{t('extendShift')}
        </button>
      </div>

      {activeModal && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {activeModal === 'assign-task' && t('assignTask')}
                {activeModal === 'send-message' && t('sendMessage')}
                {activeModal === 'extend-shift' && t('extendShift')}
              </h3>
              <button className="modal-close-btn" onClick={close} aria-label="Close modal"><X size={18} /></button>
            </div>

            {submitted ? (
              <div className="modal-success">{t('actionSubmitted')}</div>
            ) : (
              <form
                className="modal-form"
                onSubmit={(e) => handleSubmit(e,
                  activeModal === 'assign-task' ? t('assignTask')
                  : activeModal === 'send-message' ? t('sendMessage')
                  : t('extendShift')
                )}
              >
                <div className="modal-field">
                  <label className="modal-label">{t('workerField')}</label>
                  <select className="modal-select" value={formData.workerId}
                    onChange={(e) => setFormData({ ...formData, workerId: e.target.value })} required>
                    {workers.map((w) => <option key={w.workerId} value={w.workerId}>{w.name}</option>)}
                  </select>
                </div>

                {activeModal === 'assign-task' && (
                  <>
                    <div className="modal-field">
                      <label className="modal-label">{t('taskName')}</label>
                      <input className="modal-input" type="text" value={formData.taskName}
                        onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
                        placeholder="e.g. Restock display shelf" required />
                    </div>
                    <div className="modal-field">
                      <label className="modal-label">{t('dueTime')}</label>
                      <input className="modal-input" type="time" value={formData.dueTime}
                        onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })} required />
                    </div>
                  </>
                )}

                {activeModal === 'send-message' && (
                  <div className="modal-field">
                    <label className="modal-label">{t('messageField')}</label>
                    <textarea className="modal-textarea" value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Type your message..." rows={3} required />
                  </div>
                )}

                {activeModal === 'extend-shift' && (
                  <div className="modal-field">
                    <label className="modal-label">{t('extensionDuration')}</label>
                    <select className="modal-select" value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}>
                      {['15', '30', '60', '90', '120'].map((d) => (
                        <option key={d} value={d}>{d} {t('minLabel')}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button type="submit" className="modal-submit-btn">{t('confirm')}</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
