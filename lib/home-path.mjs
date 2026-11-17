/**
 * 지금 경로가 홈인가 — 클라이언트 컴포넌트가 `usePathname()` 으로 홈을 가를 때 쓰는 한 곳.
 *
 * Vercel 이 홈(`/`)을 ISR 로 다시 만들 때는 서버 렌더의 `usePathname()` 이 `/index` 를 돌려준다
 * (빌드 직후 HTML 은 `/`, 재생성된 HTML 의 RSC 경로 조각은 `["","index"]` — 2026-11-18 운영·미리보기 실측, 로컬 next start 는 재현 안 됨).
 * 브라우저는 `/` 라서 `=== '/'` 로 가르면 서버와 클라이언트가 다른 화면을 그려 React #418 이 나고,
 * React 가 페이지 전체를 브라우저에서 다시 그린다(홈 첫 그리기 1.3초 지연).
 *
 * `.mjs` 인 이유: 앱(TSX)과 node 테스트(`scripts/qa/test-home-path.mjs`)가 같은 코드를 쓰기 위해서다.
 */

/** @param {string | null | undefined} pathname */
export function isHomePath(pathname) {
  return pathname === '/' || pathname === '/index';
}
