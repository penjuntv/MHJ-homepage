# MHJ QA Summary — Claude Code
## 검수일: 2026-03-26

### 총괄
- 총 검수 항목: 26건
- :red_circle: Critical: 4건
- :orange_circle: Major: 8건
- :yellow_circle: Minor: 10건
- :green_circle: Enhancement: 4건
- TypeScript 에러: 0건
- 빌드: 통과 (경고 7건 — img 태그)

---

### :red_circle: Critical 이슈 (즉시 수정 필요)

1. **API 인증 미비 (3건)** — `send-newsletter`, `send-test-newsletter`, `ai-insight` API가 인증 없이 호출 가능. 뉴스레터 오발송 및 Claude API 키 소진 위험.
2. **RLS 과도한 public 권한** — `articles`, `family_members`, `gallery`, `hero_slides`, `magazines`, `newsletters`, `site_settings`, `subscribers` 등의 ALL/DELETE/UPDATE 정책이 `{public}` 역할에 부여됨. anon 사용자가 데이터를 수정/삭제할 수 있음. `{authenticated}`로 제한 필요.

### :orange_circle: Major 이슈 (이번 주 내 수정)

1. **DB_SCHEMA.md 3곳 불일치** — Supabase 프로젝트 ID, author 기본값, 카테고리 CHECK 제약조건이 실제 DB와 다름
2. **`<title>` 중복** — 랜딩 페이지 `"MY MAIRANGI — Family Archive — MY MAIRANGI"`, StoryPress도 동일 패턴. layout.tsx의 title template 구조 수정 필요
3. **og_image_url 누락 6건** — 최근 published 블로그 글에 og_image_url 필드 비어있음
4. **translateY(-16px) 호버** — BlogCard.tsx, ArticleGrid.tsx에서 DESIGN_RULES 위반

### :yellow_circle: Minor 이슈 (백로그 등록)

1. 인디고 #4F46E5가 Navigation, SearchOverlay, BlogLibrary 등에 광범위 사용 (DESIGN_RULES: AI Insight 전용)
2. `<img>` 태그 7건 → next/image로 교체 권장
3. scripts/scrape-framer.ts에 구 작성자명 `'Heejong Jo'` 잔존
4. site-settings 한국어 설명에 세 딸 실명 포함
5. `<html lang="ko">` — 영어 콘텐츠 비중 고려하여 재검토
6. view_count=0인 published 글 8건, 매거진 더미 기사 4건, newsletters 0건

### :green_circle: Enhancement (향후 개선)

1. /go/fake-slug → 404 대신 홈 리다이렉트 (의도적일 수 있으나 확인 필요)
2. next.config에 productionBrowserSourceMaps: false 명시 권장
3. SearchOverlay translateY(-4px) 호버 — 미미하나 규칙과 불일치
4. media-kit 페이지 og:image 미설정

---

### 통과 항목 (정상)

- TypeScript: 에러 0건
- 빌드: 성공
- 구 도메인(mhj-homepage.vercel.app) 잔존: 없음
- 구 Supabase ID(코드 내): 없음
- 구 /admin 경로(코드 내): 없음
- 하드코딩 시크릿: 없음 (모두 process.env 참조)
- .env in .gitignore: 확인됨
- /mhj-desk 미인증 접근: 307 → login 정상
- /api/subscribe 입력 검증: 빈값/잘못된 형식 400 반환
- 404 처리: 존재하지 않는 페이지/블로그/매거진 모두 404 정상
- robots.txt: /admin, /mhj-desk, /go 차단, sitemap 경로 포함
- sitemap.xml: 정적 페이지 + 동적 블로그 + 태그 페이지 포함
- SEO 메타: 6개 주요 페이지 + 블로그 상세 — title, og:title, og:description, canonical 모두 존재
- DB author 기본값: 'Yussi' (정상)
- DB 카테고리 CHECK: 7개 신규 카테고리 (정상)
- Supabase 클라이언트: mhj-desk 전체 supabase-browser 통일 (auth 페이지만 createBrowserClient)
