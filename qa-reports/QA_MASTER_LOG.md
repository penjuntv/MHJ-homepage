# MHJ QA Master Log — Claude Code
## 검수일: 2026-03-26
## 검수자: Claude Code

| # | 영역 | 항목 | 심각도 | 파일/위치 | 상세 설명 |
|---|------|------|--------|----------|----------|
| 1 | 보안 | API 인증 미비 — send-newsletter | :red_circle: Critical | `app/api/send-newsletter/route.ts` | 비인증 상태에서 POST 시 401/403 없이 validation 에러만 반환. 인증된 사용자만 호출 가능해야 함 |
| 2 | 보안 | API 인증 미비 — send-test-newsletter | :red_circle: Critical | `app/api/send-test-newsletter/route.ts` | 동일 — 인증 체크 없음 |
| 3 | 보안 | API 인증 미비 — ai-insight | :red_circle: Critical | `app/api/ai-insight/route.ts` | 동일 — 누구나 Claude API 키 소진 가능 |
| 4 | 보안 | RLS 정책 과도한 public 권한 | :red_circle: Critical | Supabase RLS | `articles`, `family_members`, `gallery`, `hero_slides`, `magazines`, `newsletters`, `site_settings`, `subscribers` 등 다수 테이블의 ALL 정책이 `{public}` 역할에 부여됨. `{authenticated}`로 변경 필요 |
| 5 | 문서 | DB_SCHEMA.md 구 Supabase ID | :orange_circle: Major | `docs/DB_SCHEMA.md:3` | `asatbuonduelfrhdkwgu` (구 프로젝트) → `vpayqdatpqajsmalpfmq` (현재)로 업데이트 필요 |
| 6 | 문서 | DB_SCHEMA.md author 기본값 불일치 | :orange_circle: Major | `docs/DB_SCHEMA.md:62` | 문서: `'Heejong Jo'` / 실제 DB: `'Yussi'` |
| 7 | 문서 | DB_SCHEMA.md 카테고리 CHECK 불일치 | :orange_circle: Major | `docs/DB_SCHEMA.md:60` | 문서: `Daily/School/Kids/Travel/Food` / 실제 DB: 7개 신규 카테고리 |
| 8 | SEO | `<title>` 중복 — 랜딩 페이지 | :orange_circle: Major | `app/layout.tsx:14` | `"MY MAIRANGI — Family Archive — MY MAIRANGI"` — default title이 template에 다시 감싸짐 |
| 9 | SEO | `<title>` 중복 — StoryPress | :orange_circle: Major | StoryPress metadata | `"StoryPress — 4 Words a Day... \| MY MAIRANGI — MY MAIRANGI"` — 자체 타이틀에 "MY MAIRANGI" 포함 + template suffix |
| 10 | SEO | og_image_url 누락 6건 | :orange_circle: Major | DB `blogs` | id 47-51, 57 — 최근 published 글에 og_image_url 없음 (자동 생성 /api/og로 대체되고 있으나 DB 필드 비어있음) |
| 11 | 디자인 | translateY(-16px) 호버 — BlogCard | :orange_circle: Major | `components/BlogCard.tsx:29` | DESIGN_RULES 9.1 위반: 카드 translateY 호버 금지 |
| 12 | 디자인 | translateY(-16px) 호버 — ArticleGrid | :orange_circle: Major | `components/ArticleGrid.tsx:80` | DESIGN_RULES 9.1 위반: 카드 translateY 호버 금지 |
| 13 | 디자인 | #4F46E5 인디고 네비게이션 사용 | :yellow_circle: Minor | `components/Navigation.tsx:114,180,212,242` | DESIGN_RULES 6.3: 인디고는 AI Insight/인터랙티브에만 사용. 네비 active 상태에 하드코딩됨 |
| 14 | 디자인 | #4F46E5 검색/블로그 등 광범위 사용 | :yellow_circle: Minor | `SearchOverlay.tsx`, `BlogLibrary.tsx`, `ArticleGrid.tsx` 등 | accent 색상이 AI Insight 외 다수 위치에 사용됨 |
| 15 | 코드 | `<img>` 태그 사용 7건 (빌드 경고) | :yellow_circle: Minor | 빌드 로그 참조 | next/image 대신 `<img>` 사용 — LCP/대역폭 영향 |
| 16 | 코드 | console.log 잔존 — scripts/ | :yellow_circle: Minor | `scripts/scrape-framer.ts` | 스크립트 파일이므로 의도적일 수 있음 |
| 17 | 코드 | 구 작성자명 잔존 — scrape-framer | :yellow_circle: Minor | `scripts/scrape-framer.ts:21` | `AUTHOR = 'Heejong Jo'` — 구 이름 |
| 18 | 코드 | 가족 실명 잔존 — site-settings | :yellow_circle: Minor | `lib/site-settings.ts:19` | about_who_description_kr에 세 딸 실명(유민/유현/유진) 포함 |
| 19 | SEO | `<html lang="ko">` 유지 여부 | :yellow_circle: Minor | `app/layout.tsx` | 콘텐츠 대부분 영어 전환됨. `lang="en"` 또는 혼합 고려 |
| 20 | DB | view_count 0인 published 글 8건 | :yellow_circle: Minor | DB `blogs` id 13,23-25,27-30 | view tracking이 작동하지 않거나 초기 글들 |
| 21 | DB | 매거진 빈 콘텐츠 기사 4건 | :yellow_circle: Minor | DB `articles` id 22,24,25,34 | "Test ing" 매거진 더미 데이터 + Celebrations 1건 |
| 22 | DB | newsletters 테이블 비어있음 | :yellow_circle: Minor | DB `newsletters` | status='sent' 0건 — 아직 뉴스레터 발송 이력 없음 |
| 23 | 에러 | /go/fake-slug → 302 홈 리다이렉트 | :green_circle: Enhancement | `app/go/[slug]/route.ts` | 존재하지 않는 affiliate slug가 404 대신 홈으로 리다이렉트됨 |
| 24 | 보안 | sourcemap 설정 미명시 | :green_circle: Enhancement | `next.config.*` | productionBrowserSourceMaps 명시적 false 설정 권장 |
| 25 | 디자인 | SearchOverlay translateY(-4px) 호버 | :green_circle: Enhancement | `components/SearchOverlay.tsx:234` | 미미한 수준이나 DESIGN_RULES와 엄밀히 불일치 |
| 26 | SEO | media-kit 페이지 og:image 미설정 | :green_circle: Enhancement | `app/(public)/media-kit/page.tsx` | og:image 없음 — 기본 og 이미지로 폴백 |
