import type { Metadata } from 'next';
import AnalyticsShell from '@/components/AnalyticsShell';
import NotFoundContent from '@/components/NotFoundContent';

export const metadata: Metadata = {
  title: '페이지를 찾을 수 없습니다',
  robots: { index: false, follow: true },
};

// 루트 not-found: (public) 레이아웃 밖(미매칭 URL)에서 렌더되므로 nav/footer 없이 자립.
// 오타·옛 링크 유입이 가장 많이 닿는 곳인데 분석 도구가 레이아웃에만 있어 **아무것도 기록되지 않았다** —
// 레이아웃과 같은 AnalyticsShell 을 여기서 직접 마운트한다. 이제 어느 URL 이 404 인지가 page_events 에,
// 거기서 어디로 빠지는지가 GA 에 남는다(2026-09-11 W6-C).
export default function RootNotFound() {
  return (
    <>
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
        <NotFoundContent />
      </main>
      <AnalyticsShell notFound />
    </>
  );
}
