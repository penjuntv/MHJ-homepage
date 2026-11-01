import type { Metadata } from 'next';
import NotFoundContent from '@/components/NotFoundContent';

export const metadata: Metadata = {
  // 영어 사이트라 제목도 영어. robots 는 꼭 적는다 — 빼면 루트 레이아웃의 "index, follow" 가 따라온다
  // (Next 가 따로 넣는 noindex 와 태그가 둘이 되지만 둘 다 noindex 라 무해).
  // canonical 은 루트 레이아웃 것이 홈을 가리키며 따라오므로 비운다(404 에는 canonical 을 두지 않는다).
  title: 'Page not found',
  robots: { index: false, follow: true },
  alternates: { canonical: null },
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
