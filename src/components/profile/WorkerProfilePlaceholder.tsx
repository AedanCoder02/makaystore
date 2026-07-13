'use client';

export default function WorkerProfilePlaceholder({ role }: { role: string }) {
  return (
    <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-playfair-display)', color: 'var(--makay-dark-navy)', marginBottom: '0.5rem' }}>
          Worker Profile
        </h1>
        <p style={{ color: 'var(--makay-mauve)', textTransform: 'capitalize' }}>
          {role} dashboard coming soon.
        </p>
      </div>
    </main>
  );
}
