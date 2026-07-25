import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '페이지를 찾을 수 없습니다',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <section
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'var(--section-v) var(--section-h)',
        gap: '20px',
      }}
    >
      <p
        className="font-display"
        style={{
          fontSize: 'clamp(72px, 14vw, 128px)',
          lineHeight: 1,
          fontStyle: 'italic',
          color: 'var(--text-tertiary)',
          margin: 0,
        }}
      >
        404
      </p>
      <h1
        className="font-display"
        style={{ fontSize: 'clamp(24px, 4vw, 32px)', color: 'var(--text)', margin: 0 }}
      >
        찾으시는 페이지가 없어요
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, maxWidth: '420px', margin: 0 }}>
        페이지가 이동되었거나 더 이상 존재하지 않습니다.
        <br />
        아래에서 다시 우리 이야기로 돌아가 보세요.
      </p>
      <Link
        href="/"
        style={{
          marginTop: '8px',
          display: 'inline-block',
          padding: '12px 28px',
          borderRadius: '999px',
          background: 'var(--text)',
          color: 'var(--bg)',
          fontSize: '14px',
          fontWeight: 500,
          textDecoration: 'none',
          transition: 'opacity 0.2s ease',
        }}
      >
        홈으로 돌아가기
      </Link>
    </section>
  );
}
