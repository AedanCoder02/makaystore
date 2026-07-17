'use client';

import { useEffect, useState, useRef } from 'react';

const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export default function GenerationProgressStep({
  requestId,
  onComplete,
  onCancel,
}: {
  requestId: string;
  onComplete: (glbUrl: string) => void;
  onCancel: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const startTime = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    // Tick elapsed time every second for display
    const tick = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000);

    // Timeout guard
    const timeout = setTimeout(() => {
      clearInterval(intervalRef.current);
      clearInterval(tick);
      setError('Generation timed out after 5 minutes. The server may be busy — try again.');
    }, TIMEOUT_MS);

    // Poll status
    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/products/generate-3d/${requestId}`);
        const data = await res.json();

        if (data.status === 'completed' && data.glbUrl) {
          clearInterval(intervalRef.current);
          clearInterval(tick);
          clearTimeout(timeout);
          onComplete(data.glbUrl);
        } else if (data.status === 'failed') {
          clearInterval(intervalRef.current);
          clearInterval(tick);
          clearTimeout(timeout);
          setError(data.errorMessage || 'Generation failed on the server.');
        } else {
          setProgress(data.progress || 0);
        }
      } catch {
        // transient network error — keep polling
      }
    }, 3000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(tick);
      clearTimeout(timeout);
    };
  }, [requestId, onComplete]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return (
    <div className="wizard-step-card">
      <div className="wizard-step-header">
        <div className="wizard-step-icon">⚙️</div>
        <div>
          <h2 className="wizard-step-title">
            {error ? 'Generation Failed' : 'Generating 3D Model…'}
          </h2>
          <p className="wizard-step-desc">
            {error ? 'Something went wrong during inference' : 'TripoSR is processing your image on CPU — this takes 2–4 minutes'}
          </p>
        </div>
      </div>

      {error ? (
        <div className="gen3d-error" style={{ marginBottom: '1.5rem' }}>
          <span>⚠</span> {error}
        </div>
      ) : (
        <>
          <div className="gen3d-progress-track">
            <div className="gen3d-progress-fill" style={{ width: `${Math.max(progress, 5)}%` }} />
          </div>
          <div className="gen3d-progress-meta">
            <span>{progress}% complete</span>
            <span>Elapsed: {timeStr}</span>
          </div>
          <div className="gen3d-spinner-wrap">
            <div className="gen3d-spinner" />
            <span>Processing on Railway server…</span>
          </div>
        </>
      )}

      <div className="wizard-step-actions">
        <button className="wizard-btn-secondary" onClick={onCancel}>
          {error ? '← Try Again' : 'Cancel'}
        </button>
      </div>
    </div>
  );
}
