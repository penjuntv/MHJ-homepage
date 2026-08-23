'use client';

// 루트 레이아웃 자체가 실패할 때만 렌더됨 → ThemeProvider/globals.css 밖이라
// CSS 변수를 쓸 수 없다(§5 예외). 자체 html/body + 안전한 하드코딩 폴백 색상 사용.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          background: '#FFFFFF',
          color: '#1A1A1A',
          fontFamily: 'sans-serif',
          padding: '48px 24px',
          gap: '16px',
        }}
      >
        <h1 style={{ fontSize: '28px', margin: 0 }}>문제가 발생했어요</h1>
        <p style={{ color: '#64748B', fontSize: '15px', maxWidth: '420px', margin: 0 }}>
          일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: '8px',
            padding: '12px 28px',
            borderRadius: '999px',
            background: '#1A1A1A',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
