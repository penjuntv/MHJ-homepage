import { draftMode } from 'next/headers';
import type { Magazine } from '@/lib/types';

/* ── 숨김 호(magazines.published = false) 공개 여부 — 한 곳에서 판정 ──
   서가·홈·검색·sitemap 은 `.eq('published', true)` 로 숨김 호를 빼 왔지만, 호·기사 주소
   (/magazine/[id], /magazine/[id]/[slug])는 주소만 알면 그대로 열렸다(2026-11 수정).
   이제 숨김 호의 주소는 404 이고, 관리자만 초안 미리보기(draftMode)로 본다 — 블로그 초안과 같은 방식:
   /mhj-desk 의 "뷰어로 보기" → /api/preview?magazine=<id>(middleware 가 관리자만 통과) → draftMode 쿠키.

   draftMode().isEnabled 는 읽기만 해서는 정적 렌더(ISR)를 깨지 않는다. cookies() 로 세션을 직접 보면
   기사 페이지가 재검증 때 "static → dynamic" 오류로 옛 200 페이지를 계속 내보낼 수 있어 쓰지 않는다. */

/** 숨김 호 = published 가 명시적으로 false (admin 목록의 '숨김' 표시와 같은 기준). */
export function isHiddenIssue(magazine: Pick<Magazine, 'published'>): boolean {
  return magazine.published === false;
}

/** 이 요청이 관리자 미리보기(draftMode)인가. */
export async function isIssuePreview(): Promise<boolean> {
  return (await draftMode()).isEnabled;
}

/* 로컬 개발 서버 전용 우회 — 발행 전 지면 잘림 감사(scripts/magazine-overflow-audit.mjs)는 로그인 없이
   숨김 호의 리더(?page=N)를 열어야 한다. `MAGAZINE_SHOW_HIDDEN=1 npm run dev` 로 띄운 서버에서만 통하고,
   프로덕션 빌드(NODE_ENV=production)에서는 값이 있어도 무시한다 — 운영 환경변수 실수로 숨김 호가 열리지 않게. */
const SHOW_HIDDEN_IN_DEV =
  process.env.NODE_ENV !== 'production' && process.env.MAGAZINE_SHOW_HIDDEN === '1';

/** 이 요청에 이 호를 보여 줘도 되는가 — 공개 호는 항상, 숨김 호는 관리자 미리보기일 때만. */
export async function canViewIssue(magazine: Pick<Magazine, 'published'>): Promise<boolean> {
  if (!isHiddenIssue(magazine)) return true;
  if (SHOW_HIDDEN_IN_DEV) return true;
  return isIssuePreview();
}
