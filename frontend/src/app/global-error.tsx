'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#0a0a0a',
          color: '#fafafa',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 300 }}>
          Something went wrong
        </h2>
        <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '2rem' }}>
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={() => reset()}
          style={{
            padding: '12px 32px',
            backgroundColor: '#fafafa',
            color: '#0a0a0a',
            border: 'none',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
