import { GoogleAnalytics } from '@next/third-parties/google';
import OutboundLinkTracker from '@/components/OutboundLinkTracker';
import AnalyticsBeacon from '@/components/AnalyticsBeacon';
import { GA_ID } from '@/lib/analytics';
import PublicPathGate from '@/components/PublicPathGate';

/**
 * 공개 화면의 분석 도구 한 벌 — (public) 레이아웃과 루트 404(레이아웃 밖)가 같이 쓴다.
 * 루트 레이아웃에 두지 않는 이유: 관리자(`/mhj-desk`)도 루트 레이아웃을 공유한다.
 * 새 도구는 **여기에** 넣는다 — 레이아웃에만 넣었다가 루트 404 가 아무것도 기록하지 않던 일을 되풀이하지 않게(2026-09-11 W6-C).
 */
export default function AnalyticsShell({ notFound = false }: {
  /** 루트 404 에서 true — pageview 에 `status: 404` 를 달아 진짜 방문과 가른다. */
  notFound?: boolean;
}) {
  return (
    <PublicPathGate>
      <OutboundLinkTracker />
      <AnalyticsBeacon pageMeta={notFound ? { status: 404 } : undefined} />
      <GoogleAnalytics gaId={GA_ID} />
    </PublicPathGate>
  );
}
