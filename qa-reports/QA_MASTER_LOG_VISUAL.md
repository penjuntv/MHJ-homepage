# MHJ QA Master Log — Antigravity (Visual)
## 검수일: 2026-03-26
## 검수자: Antigravity + Playwright

| # | 영역 | 페이지 | 항목 | 심각도 | 스크린샷 경로 | 상세 설명 |
|---|------|--------|------|--------|-------------|----------|
| 1 | 공통 | 전체 | 최대폭 규정 위반 | 🔴 Critical | `homepage/homepage-full-desktop-light.png` | 데스크탑 모드에서 메인 콘텐츠 컨테이너의 `max-width`가 1440px로 측정됨 (규정: 1320px) |
| 2 | 공통 | 전체 | 최대 border-radius 규정 위반 | 🔴 Critical | `blog-list/blog-list-full-desktop-light.png` | 일부 버튼 및 요소들의 `border-radius`가 50px(완전한 둥근 모양)로 설정됨 (규정: 최대 12px) |
| 3 | 타이포그래피 | `/storypress`, `/gallery` | H1 폰트 사이즈 초과 | 🔴 Critical | `storypress/storypress-full-desktop-light.png` | StoryPress 히어로 H1이 120px, Gallery가 80px로 기준치를 초과함 (규정: 최대 72px) |
| 4 | 카드 디자인 | `/magazine` | 매거진 카드 비율 위반 | 🔴 Critical | `magazine-shelf/magazine-shelf-full-desktop-light.png` | 매거진 카드의 비율이 16:9 (1.77)로 렌더링됨 (규정: 3:4) |
| 5 | 블로그 | `/blog/[slug]` | 커버/본문 영역 확인 | 🟡 Minor | `blog-detail/blog-detail-0-desktop-light.png` | 블로그 본문(`contentW`) 너비 등 일부 수동 측정 필요. 자동화 스크립트로 캡처 완료 |
| 6 | Admin 연동 | `/mhj-desk` | Google OAuth 로그인 | 🟠 Major | - | `penjunetv@gmail.com`으로 자동화된 접근 시 Google의 "This browser is not secure" 블락 발생으로 자동화 검수 생략 (수동 확인 필요) |
| 7 | 다크모드 | 전체 | 라이트/다크 호환성 | 🟢 Enhancement | `dark-mode/homepage-dark.png` | 다크모드 대응 완료 여부 확인 캡처 완료 |
| 8 | 반응형 | 전체 | 브레이크포인트 검수 | 🟢 Enhancement | `responsive/mobile-375/mobile-375-homepage.png` 등 | 7개 뷰포트에서 가로 스크롤 및 레이아웃 깨짐 여부 검증용 스크린샷 촬영 완료 |
| 9 | 에러페이지 | `/*` | 404 커스텀 페이지 확인 | 🟢 Enhancement | `errors/404-page.png` | 커스텀 디자인 에러페이지 렌더링 확인 |
