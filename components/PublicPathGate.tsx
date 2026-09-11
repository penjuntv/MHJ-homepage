'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/** 분석 도구를 켜지 않는 경로 — 매거진 PNG 캡처 렌더러와 관리자. */
const PRIVATE_PREFIXES = ['/internal/', '/mhj-desk'];

/**
 * 비공개 경로에서는 자식(분석 도구)을 그리지 않는다.
 * 매거진 캡처 렌더러(`/internal/render/*`)의 notFound() 는 루트 404 로 오는데, 루트 404 는 분석 도구를 싣는다 —
 * 헤드리스 캡처가 잘못된 id 를 부를 때마다 GA·방문 기록이 생기면 안 된다. 세그먼트 not-found 로 막으려 했지만
 * `?token=` 인가 요청으로 재현해 보니 `app/internal/`·`app/internal/render/` 어느 쪽에 둬도 루트 404 가 떴다 —
 * 어느 404 가 뜨든 상관없이 **경로로** 막는다(2026-09-11 W6-C 코드리뷰).
 * 자식들은 DOM 을 남기지 않는 컴포넌트(스크립트 주입·비콘)라 서버/클라이언트 렌더 차이가 화면에 드러나지 않는다.
 */
export default function PublicPathGate({ children }: { children: ReactNode }) {
  const path = usePathname() ?? '';
  return PRIVATE_PREFIXES.some((p) => path.startsWith(p)) ? null : <>{children}</>;
}
