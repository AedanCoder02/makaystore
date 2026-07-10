import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFF8F0',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <p style={{
        fontFamily: 'var(--font-montserrat)',
        fontSize: '0.875rem',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: '#A89080',
        marginBottom: '1rem',
      }}>
        404
      </p>
      <h1 style={{
        fontFamily: 'var(--font-playfair-display)',
        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
        fontWeight: 800,
        color: '#D4A574',
        marginBottom: '1.5rem',
        letterSpacing: '0.05em',
      }}>
        Page Not Found
      </h1>
      <p style={{
        fontFamily: 'var(--font-montserrat)',
        fontSize: '1rem',
        color: '#A89080',
        marginBottom: '2.5rem',
        maxWidth: '400px',
        lineHeight: 1.7,
      }}>
        This page doesn&apos;t exist. Return to the community.
      </p>
      <Link href="/" style={{
        padding: '0.875rem 2.5rem',
        backgroundColor: '#D4A574',
        color: 'white',
        borderRadius: '0.5rem',
        fontFamily: 'var(--font-montserrat)',
        fontWeight: 600,
        textDecoration: 'none',
        letterSpacing: '0.05em',
        transition: 'background-color 300ms ease',
      }}>
        Back to Makay
      </Link>
    </div>
  );
}
