'use client';

export default function SupervisorError({ error }: { error: Error & { digest?: string } }) {
  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', color: '#fff', background: '#1a1a1a', minHeight: '100vh' }}>
      <h2 style={{ color: '#ff6b6b', marginBottom: '1rem' }}>Supervisor Error</h2>
      <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', color: '#ffd6d6' }}>
        {error.message}
        {'\n\n'}
        {error.stack}
      </pre>
      {error.digest && <p style={{ color: '#aaa', marginTop: '1rem' }}>Digest: {error.digest}</p>}
    </div>
  );
}
