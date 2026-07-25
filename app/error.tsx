'use client';

import { useEffect } from 'react';
import Link from 'next/link';

// 세그먼트 에러 바운더리: 루트 레이아웃 안에서 렌더됨(html/body/ThemeProvider 유지).
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        background: 'var(--bg)',
        padding: '48px 24px',
        gap: '20px',
      }}
    >
      <p
        className="font-display"
        style={{
          fontSize: 'clamp(56px, 12vw, 104px)',
          lineHeight: 1,
          fontStyle: 'italic',
          color: 'var(--text-tertiary)',
          margin: 0,
        }}
      >
        Oops
      </p>
      <h1
        className="font-display"
        style={{ fontSize: 'clamp(24px, 4vw, 32px)', color: 'var(--text)', margin: 0 }}
      >
        문제가 발생했어요
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, maxWidth: '420px', margin: 0 }}>
        잠시 후 다시 시도해 주세요. 계속 문제가 생기면 홈에서 다시 시작할 수 있어요.
      </p>
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={reset}
          style={{
            padding: '12px 28px',
            borderRadius: '999px',
            background: 'var(--text)',
            color: 'var(--bg)',
            fontSize: '14px',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          다시 시도
        </button>
        <Link
          href="/"
          style={{
            padding: '12px 28px',
            borderRadius: '999px',
            background: 'transparent',
            color: 'var(--text)',
            fontSize: '14px',
            fontWeight: 500,
            textDecoration: 'none',
            border: '1px solid var(--border-medium)',
          }}
        >
          홈으로
        </Link>
      </div>
    </main>
  );
}
