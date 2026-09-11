import type { Metadata } from 'next';
import NotFoundContent from '@/components/NotFoundContent';

export const metadata: Metadata = {
  title: '페이지를 찾을 수 없습니다',
  robots: { index: false, follow: true },
};

// 앱 안의 notFound() 가 여기로 온다(레이아웃 안 — 네비·푸터·분석 도구가 이미 있다). 본문은 루트 404 와 공유.
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
      <NotFoundContent />
    </section>
  );
}
