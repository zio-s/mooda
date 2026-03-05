'use client';

import Link from 'next/link';

export default function CafeDetailError({
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
      <span style={{ fontSize: 48 }}>☕</span>
      <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>카페 정보를 불러올 수 없습니다</h2>
      <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
        {error.message || '잠시 후 다시 시도해주세요.'}
      </p>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button
          onClick={reset}
          style={{
            padding: '10px 24px', borderRadius: 8,
            background: '#d97706', color: 'white', border: 'none',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}
        >
          다시 시도
        </button>
        <Link
          href="/map"
          style={{
            padding: '10px 24px', borderRadius: 8,
            background: '#f3f4f6', color: '#374151', border: 'none',
            fontSize: 14, fontWeight: 500, textDecoration: 'none',
          }}
        >
          지도로 돌아가기
        </Link>
      </div>
    </div>
  );
}
