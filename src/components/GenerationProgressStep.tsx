'use client';

import { useEffect, useState, useRef } from 'react';

const TIMEOUT_MS = 25 * 60 * 1000; // 25 minutes — CPU inference takes 15-20 min

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
  const [statusText, setStatusText] = useState('Sending image to AI…');
  const startTime = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    // Persist requestId so page refresh can resume
    if (requestId) {
      try { sessionStorage.setItem('tripo_request_id', requestId); } catch {}
    }

    const tick = setInterval(() => {
      const sec = Math.floor((Date.now() - startTime.current) / 1000);
      setElapsed(sec);
      // Update status text based on elapsed time
      if (sec < 15)       setStatusText('Sending image to TRELLIS.2…');
      else if (sec < 40)  setStatusText('Generating 3D structure…');
      else if (sec < 90)  setStatusText('Baking 2048px textures…');
      else if (sec < 180) setStatusText('Finalising mesh and GLB export…');
      else                setStatusText('Almost done — exporting high-resolution model…');
    }, 1000);

    const timeout = setTimeout(() => {
      clearInterval(intervalRef.current);
      clearInterval(tick);
      setError('Generation timed out after 25 minutes. The job may still be running on the server — check back or try again.');
    }, TIMEOUT_MS);

    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/products/generate-3d/${requestId}`);
        if (!res.ok) return; // transient error — keep polling
        const data = await res.json();

        if (data.status === 'completed' && data.glbUrl) {
          clearInterval(intervalRef.current);
          clearInterval(tick);
          clearTimeout(timeout);
          try { sessionStorage.removeItem('tripo_request_id'); } catch {}
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
    }, 5000); // poll every 5s (was 3s — reduce load on CPU server)

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(tick);
      clearTimeout(timeout);
    };
  }, [requestId, onComplete]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  const estimatedRemaining = Math.max(0, 15 * 60 - elapsed);
  const remMins = Math.floor(estimatedRemaining / 60);
  const remSecs = estimatedRemaining % 60;

  return (
    <div className="wizard-step-card">
      <div className="wizard-step-header">
        <div className="wizard-step-icon">{error ? '⚙️' : '🔄'}</div>
        <div>
          <h2 className="wizard-step-title">
            {error ? 'Generation Failed' : 'Generating 3D Model…'}
          </h2>
          <p className="wizard-step-desc">
            {error
              ? 'Something went wrong during inference'
              : 'TRELLIS.2 on FAL.ai — high-quality textured 3D, usually under 2 minutes'}
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
            <div className="gen3d-progress-fill" style={{ width: `${Math.max(progress, 3)}%` }} />
          </div>
          <div className="gen3d-progress-meta">
            <span>{progress}% complete</span>
            <span>Elapsed: {timeStr}</span>
          </div>

          <div className="gen3d-status-box">
            <div className="gen3d-spinner-wrap">
              <div className="gen3d-spinner" />
              <span>{statusText}</span>
            </div>
            {elapsed > 60 && estimatedRemaining > 0 && (
              <p className="gen3d-eta">
                Est. remaining: ~{remMins}m {remSecs}s
              </p>
            )}
            <p className="gen3d-warning">
              Keep this tab open. Generation takes 1–3 minutes.
            </p>
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
