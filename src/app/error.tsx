'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', gap: 16, padding: 24,
      textAlign: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <span style={{ fontSize: 48 }}>😵</span>
      <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>문제가 발생했습니다</h2>
      <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
        {error.message || '알 수 없는 오류가 발생했습니다.'}
      </p>
      <button
        onClick={reset}
        style={{
          marginTop: 8, padding: '10px 24px', borderRadius: 8,
          background: '#d97706', color: 'white', border: 'none',
          fontSize: 14, fontWeight: 500, cursor: 'pointer',
        }}
      >
        다시 시도
      </button>
    </div>
  );
}
