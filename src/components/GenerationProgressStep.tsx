'use client';

import { useEffect, useState, useRef } from 'react';

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
  const [estimatedTime, setEstimatedTime] = useState(60);
  const [error, setError] = useState('');
  const spinnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/admin/products/generate-3d/${requestId}`
        );
        const data = await response.json();

        if (data.status === 'completed' && data.glbUrl) {
          onComplete(data.glbUrl);
          clearInterval(pollInterval);
        } else if (data.status === 'failed') {
          setError(data.errorMessage || 'Generation failed');
          clearInterval(pollInterval);
        } else {
          setProgress(data.progress || 0);
          setEstimatedTime(data.estimatedTime || 30);
        }
      } catch (err) {
        setError('Failed to check status');
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [requestId, onComplete]);

  // Animate spinner with CSS
  useEffect(() => {
    if (spinnerRef.current) {
      spinnerRef.current.style.animation = 'spin 1s linear infinite';
    }
  }, []);

  return (
    <div className="step-card progress-card">
      <div className="spinner-icon" ref={spinnerRef}>⟳</div>
      <h2>Generating 3D Model...</h2>
      <p>This usually takes 1-2 minutes</p>

      {error && <div className="error">{error}</div>}

      {!error && (
        <>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="progress-info">
            <span>{progress}%</span>
            <span>Est. {estimatedTime}s remaining</span>
          </div>

          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </>
      )}
    </div>
  );
}
