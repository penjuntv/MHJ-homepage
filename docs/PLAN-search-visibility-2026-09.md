# MHJ 검색 노출 업그레이드 마스터 플랜 (2026-09-08 → 2026-11-03, 8주)

> 입력: `docs/self-diagnosis/2026-09-07-instruction.md`(지시서) → `docs/self-diagnosis/2026-09-07-report/`(Opus 조사, finding 35개 · 가설 18개 판정)
> 이 문서는 **실행 계획**이다. 코드 변경은 아직 0. 작업 하나 = 대화 하나(CLAUDE.md 규칙 12). 각 작업의 Done 은 규칙 11·13 을 포함한다.
> 상태 표기: ☐ 미착수 · ◐ 진행 · ☑ 완료 · ⛔ 게이트 대기. 착수·완료 시 이 문서의 상태를 갱신한다.

---

## 0. 한 장 요약

**조사가 바꾼 전제**: 이 사이트는 **영어 사이트**다(발행 80편 중 한글 본문 3편). 그런데 `lang="ko"` 로 신고하고, 홈 제목은 브랜드명뿐이며, 글에는 목록·표·저자 자격이 하나도 없다. 크롤링 인프라(봇 접근·SSR·sitemap·JSON-LD)는 이미 완성돼 있다. **막힌 게 아니라 발견될 이유가 없는 상태**다.

**전략 결론 3줄**
1. **정본은 영어(en-NZ)**. 승부처는 "뉴질랜드 학교·정착을 실제로 겪는 한국 가족의 1인칭 기록" 이라는 빈 자리다. 영어 쿼리의 경쟁자는 정부·학술·이주업체뿐이고 가족 기록은 없다.
2. **네이버는 문을 열되(등록 10분) 기대치는 낮게**. 한국어 텍스트가 없어 웹문서 랭킹이 붙을 수 없다. 글마다 **한국어 요약 블록**(`<section lang="ko">`)을 붙여 실험하고 8주 후 판단한다.
3. **AI 답변 엔진 인용은 구조 문제**. 저자 박스·엔티티 `@id`·핵심 요약 목록·FAQ 를 **템플릿과 코드로** 붙인다. 80편을 한 편씩 고치는 게 아니라 컴포넌트 1개가 80편에 적용되게 한다.

**8주 목표 (2026-11-03 재측정)**

| 지표 | 지금 (2026-09-07) | 8주 목표 | 출처 |
|---|---|---|---|
| `no-store` 공개 URL | 17 | **0** (매거진 9는 별건 판정 시 제외) | `raw/meta-by-url.json` 재실행 |
| `<html lang>` 신고 정합 | `ko` 137/137 (본문 영어) | `en-NZ` 137/137 | 라이브 크롤 |
| 글 페이지 저자 박스·`@id` | 0 / 80 | **80 / 80** | 라이브 |
| 목록·표 보유 글 | 0 / 80 | 조회 상위 20 + 신규 전편 | SQL |
| OG 폴백 크롤 차단 | 59편 차단 | 차단 0 · 폴백 ≤ 40 | robots + SQL |
| 갱신일 신호 | 없음 | `updated_at` 기반 전편 | JSON-LD |
| 색인 URL (Google / Bing / Naver) | 미측정 | ≥130 / ≥100 / ≥50 | 각 콘솔 |
| 주간 유기 세션 | ≈ 21 (naver 0) | 60 (방향 목표, 근거 약함) | `page_events` |
| AI 프로브 인용 | 미측정 | 20문항 중 ≥ 2 | Q7 재실행 |
| 구독자 | 15 | 30 | SQL |

---

## 1. 전략

### 1.1 엔진별 승부처

| 엔진 | 현재 | 병목 | 이 플랜의 답 |
|---|---|---|---|
| **Google** | 브랜드 쿼리 1위, 주제 쿼리 0 | 언어 신고 오류·제목·구조·갱신 신호 | W2 언어/정체성 · W4 스키마 · W5 정비 |
| **Bing** (=DuckDuckGo·Brave) | 유입 google 과 동률, IndexNow 정상 | 등록 미확인 | W0 등록 · 회수 가장 확실 |
| **Naver** | 유입 0, 코드 준비 완료 | 등록 미확인 + 한국어 텍스트 부재 | W0 등록 · W4 한국어 요약 블록(실험) |
| **AI 답변 엔진** | 봇 11종 전부 200 | 인용 적합성 4/12 (목록·저자 0) | W2 저자·엔티티 · W4 요약 목록·FAQ · llms-full 전문화 |
| Daum/Kakao | — | 등록·OG 차단 | W0 등록 · W1 OG robots |

### 1.2 언어 정책 (권고안 — D1 에서 확정)

**"영어 정본 + 한국어 요약 블록"** 을 권고한다.
- `<html lang="en-NZ">`, `inLanguage: 'en-NZ'`, `og:locale en_NZ` 로 통일 (3줄 + 정리).
- 글마다 `summary_ko`(150~300자, 핵심 3~5줄 목록) 를 `<section lang="ko">` 로 본문 직후 렌더. 블록 단위 `lang` 이라 언어 신호가 정직하고, **목록 요건(AI 인용)도 함께 채운다**.
- 초안은 AI(`/api/ai-seo` 확장)가 쓰고 **두 분이 승인**한다. 승인 없이 게시하지 않는다.
- 상위 20편부터 → 8주 후 네이버 수집·유입을 보고 전편 확대 또는 중단.
- 네이버 블로그 배포는 요약 블록이 생긴 뒤 선택(그 요약이 곧 배포 원고).

이유: (1) 본문이 영어라는 사실은 바꿀 수 없고 바꿀 이유도 없다 — Home Learning 정보형이 이미 검색을 탄다. (2) 한국어 독자·네이버를 완전히 포기하기엔 "뉴질랜드 한국 가족"이 정체성이다. (3) 풀 `/ko/` 이중언어(L급)는 주 0.88편 발행 여력에 맞지 않는다.

### 1.3 콘텐츠 축

- **클러스터 A 학년 축**(Home Learning 17편 자산): 입학 → Year 1 → 성적표 → Year 7 → NCEA. 허브 후보 `starting-school-in-new-zealand`(99회).
- **클러스터 B 정착 축**: 학교 준비 → 도시락 → 도서관(3편 → 허브 1편) → 생활.
- 발행 비중을 Home Learning 쪽으로 옮긴다(평균 조회 22.9 vs Life in Aotearoa 13.2, 그런데 글 수는 반대).

---

## 2. 결정 게이트 (사용자) — 권고안 포함

| # | 결정 | 권고 | 막히는 작업 |
|---|---|---|---|
| **D1** | 1순위 독자·언어 | **영어 정본 + 한국어 요약 블록** (§1.2) | W2-A, W4-A(summary_ko), W5 네이버 |
| **D2** | 글 제목 | **(가) `seo_title` 컬럼 신설** — 지면 제목 불변, `<title>`·OG 만 검색형. `Schhol` 오타는 별도 승인 | W4-A/B/C |
| **D3** | 발행 템플릿 | **(가) 정형 삽입물만 규격화**(핵심 요약 목록·FAQ·인포블록) + preflight 는 **경고 모드**로 시작, 4주 후 차단 모드 | W4-B/C, W5 |
| **D4** | 발행 여력 | **새 글 주 1 + 기존 글 보강 주 2** (8주 = 새 8 + 보강 16) | W5 |
| **D5** | 노출의 최종 목표 순위 | **유기 유입 → 구독 → StoryPress 전환** | W6-C, 측정 |
| Q9-E1 | 정비 순서 | **조회 상위 × 결함 겹치는 글부터** (기존 "ORPHAN 전수 → THIN 전수" 대체) | W5 |
| Q9-E2 | cover_caption | **(가) 새 글부터 필수, 기존 72편 소급 안 함** | W4-C, W5 |
| 콘텐츠 | NCEA 2편 통합 · Library Tour 허브 신설 | 통합 권고 / 허브 권고 | W5 |
| 보안 | 범위 밖 발견(API 무인증) 처리 | **W1 에 포함** (비용·데이터 노출) | W1-S |

**2026-09-08 사용자 확정: 위 권고안 전부 채택("권고대로").** D1~D5·Q9 게이트는 열렸다. 콘텐츠 개별 건(NCEA 통합·오타 수정·제목 문구)은 실행 시점에 건별 승인.

---

## 3. 로드맵 (트랙 × 웨이브)

```
주차   1        2        3        4        5        6        7        8
W0  ■■ 사용자 콘솔 작업·결정 (코드 0)
W1  ■■■ 기술SEO 즉시패치 3건 + 보안 하드닝
W2        ■■■ 언어·정체성 / 저자·엔티티 / 카테고리 허브        ⛔D1
W3              ■■■■ P-27 캐싱 / CLS / 매거진 썸네일 / 폰트
W4              ■■■■■■ SEO 컬럼 마이그레이션 → 렌더 → 폼 → 감사 → 피드  ⛔D2 D3
W5                    ■■■■■■■■■■ 콘텐츠 정비·허브·신규 (지속)        ⛔D4
W6                          ■■■■■ 대비·접근성 / 글 페이지 전환 / 검색
M   ●          ●                ● +4w                          ● +8w
```

의존: W4-A(마이그레이션) → W4-B/C/D. W2-A(언어) → W4-A 의 `summary_ko`. W1-B(감사식) → 모든 기준선 재잠금.

---

## 4. 작업 명세

형식: **id · 제목** — finding · 파일 · 노력 · 게이트 · Done · 검증

### W0. 사용자 작업 (이번 주, 코드 0)

| id | 작업 | 절차 | 산출 |
|---|---|---|---|
| ☐ U-1 | **네이버 서치어드바이저 등록** | `docs/naver-quickstart-10min.md` 7단계 그대로. 소유확인 태그는 이미 심겨 있음 | 등록 완료 + 사이트맵 "가져온 URL 수" 스크린샷 |
| ☐ U-2 | Bing Webmaster (GSC Import) · Daum 검색등록 | Q3·Q4 | 색인 URL 수 · IndexNow 수신 기록 |
| ☐ U-3 | GSC 내보내기 | Q1 절차. **verification 토큰 2개 중 어느 속성이 살아 있는지** 먼저 | CSV 4개 + 색인 보고서 스크린샷 |
| ☐ U-4 | Vercel | ① Functions Region → `syd1` 가능하면 변경(코드 0 으로 TTFB 개선) ② Speed Insights 30일 ③ Firewall 설정 | 스크린샷 3장 |
| ☐ U-5 | AI 프로브 before | Q7 의 5문항 × 4엔진, 웹검색 켜고 | 인용 유무 20칸 표 |
| ☐ U-6 | 결정 D1~D5 · Q9 | §2 | 답변 |

### W1. 기술SEO 즉시패치 (1주차, 게이트 없음)

**☑ W1-A · 크롤·색인 신호 패치** (2026-09-08 PR #52 머지·라이브 확인: robots `Allow: /api/og` 15건, og:image 137/137 응답) — F-A-02 · F-A-04(2) · F-A-07 · F-A-08 · F-A-09 · F-B-05(og) · F-F-02 · 노력 S · 1 PR
- `app/robots.ts`: `PRIVATE_PATHS` 앞에 `allow: ['/', '/api/og']` — `/api/og` 만 예외, 나머지 `/api/*` 는 계속 차단
- `app/llms.txt/route.ts:116` `app.mhz.nz` → `app.mhj.nz`
- 공용 `lib/seo.ts` 에 `baseOpenGraph()` 헬퍼: `siteName: 'My Mairangi Journal'`, `locale`(D1 전엔 현행 유지) — 하위 페이지 openGraph 가 루트를 덮어써 `og:site_name`·`og:locale` 이 137 페이지에서 사라지는 문제 해소
- `app/(public)/blog/[slug]/page.tsx` generateMetadata: `openGraph.publishedTime`(=`created_at`), `modifiedTime`(W4 전까지 동일값), `type:'article'` 유지
- 같은 파일 JSON-LD `image`: 하드코딩 `width/height` 제거
- ~~`/blog?page>1`·카테고리 `?page>1`: noindex~~ **철회** — PR #51 이 페이지 2+ 를 의도적으로 `index, follow`(오래된 글 발견 경로)로 두었다. 존중.
- `app/api/revalidate/route.ts:52` `ALL_PUBLIC_PATHS` += `/sitemap.xml` `/feed.xml` `/llms.txt` `/llms-full.txt` `/gallery` `/mairangi-notes`; `BlogForm.tsx:359` paths += `/blog/category/{slug}` + 위 4개; `app/feed.xml/route.ts` 에 `export const revalidate = 3600`; `send-newsletter` 는 이미 `/mairangi-notes` 를 revalidate 함(보고서 F-F-02 오탐) — 개별 호 `/mairangi-notes/[issue]` 만 추가; `revalidateTag('magazines')` 는 소비처가 없으니 제거하거나 매거진 쿼리에 태그 부여(택1, 제거 권고)
- **구현 중 추가 발견(2026-09-08, 코드리뷰)**: 기존 정적 OG 이미지 `/og-default.jpg`·`/og-about.jpg`·`/og-blog.jpg`·`/og-gallery.jpg`·`/og-magazine.jpg`·`/og-storypress.jpg` 6개가 저장소에 없어 **라이브 전부 404** 였다(조사 보고서는 og:image 존재만 세고 응답은 안 봤다). 브랜드 킷 `og-default.png`(1200×630)를 `public/` 에 싣고 참조를 교체. 부수 수정: revalidate 파생 경로를 서버 소유(`derived` 플래그)로, 매거진 어드민 3곳 연결, 뉴스레터 호 세그먼트 갱신, feed.xml 수동 Cache-Control 제거, 입력 검증.
- Done: build+tsc ✅ · 로컬 prod 서버에서 11개 라우트 og:image 전부 200 ✅ · `/code-review high` 10건 전부 수정 ✅ · 배포 후 `audit-endpoints` · 라이브 `robots.txt` `Allow: /api/og` · 글 3편 `og:site_name`·`article:published_time` 재확인
- 후속(W1-B 에 편입): 주간 감사에 "각 페이지가 광고하는 og:image URL 이 200 인지" 검사 추가 — 이번 404 6건이 CI 를 통과해 온 이유.

**☑ W1-B · 감사 위음성·검색 버그·주간 감사 ⑪** (2026-09-08 PR #53 머지) — F-A-03 · F-E-03(1,4) · F-E-04(2) · 노력 S · 1 PR
- OG 폴백 정의('' 또는 `/api/og`, 59편)를 SKILL.md SQL·회귀 스크립트(`isOgApi`)·`mhj-desk/seo` **세 곳에 동일하게** 적용(기준선 59). 감사 ⑪ 은 `scripts/audit-live-pages.mjs` 로 no-store 와 **og:image 응답**을 함께 잰다(허용 목록 `scripts/qa/no-store-allowlist.json` = 매거진 9, 단위 테스트 11케이스, 음성 대조군 exit 1·2 실증).
- OG 폴백 판정을 `nullif(btrim(og_image_url),'') IS NULL` 로 — **세 곳 동시**: `.claude/skills/seo-audit-runner/SKILL.md` SQL · `app/mhj-desk/seo/page.tsx:27` · `scripts/audit-seo-regression.mjs` → 수치 0→59 가 되므로 `--update-baseline` 으로 기준선 재잠금(핸드오프 §5-5 규율)
- `components/SearchOverlay.tsx:23-32` QUICK_LINKS 를 `lib/constants.ts` 의 현행 7카테고리 slug 로 (죽은 링크 5개 제거)
- `app/api/search/route.ts:46-51` `articles` 에 발행 가드(`article_status='published'`) + ILIKE 입력 이스케이프
- `app/(public)/blog/[slug]/page.tsx:36-63` `getAdjacentBlogs` 정렬을 `id` → 발행일
- **신규 주간 감사 ⑪** `scripts/audit-cache-headers.mjs`: sitemap 전 URL 의 `cache-control` 에 `no-store` 가 허용 목록(`scripts/qa/no-store-allowlist.json`, 근거 경로 필수) 밖에서 나오면 exit 1 — P-27 세 번째 재발 방지. 양성 대조군(허용 목록 비우고 exit 1) 실증 후 `site-audit.yml` 편입
- Done: `audit-seo-regression.mjs` 가 OG 폴백 59 보고 · 검색 오버레이 QuickLink 7개 전부 카테고리 페이지 도착 · 새 감사 exit 코드 3종 실증

**◐ W1-C · 홈 LCP** (2026-09-08 구현 완료, PR 대기 — 브랜치 `seo/w1c-home-lcp`) — F-C-02 · 노력 S · 1 PR
- **원인 확정**: 홈은 `HeroCarousel` 을 쓰지 않는다(import 0건, 죽은 컴포넌트). 실제 LCP 요소는 `app/(public)/page.tsx` `EditorialHero` 의 메인 `SafeImage` 이고 `priority` 가 없어 lazy 였다. `priority` + `fetchPriority="high"` 추가 → 로컬 prod 에서 `<link rel=preload as=image>` 생성, `loading` 속성 제거, 첫 이미지 요청이 내비게이션 +22ms. `heading-order`(홈 H1 = 히어로 글 제목)는 W2-A 에서.
- 정리 후보(별건): `components/HeroCarousel.tsx` 는 어디서도 import 되지 않는다 — `lib/types.ts` 의 캐러셀 타입과 함께 삭제 검토.
- Done: 라이브 홈 HTML 의 `EditorialHero` 메인 `<img>` 에 `loading` 속성 없음(eager) + `fetchpriority="high"` + `<link rel=preload as=image>` · 글·소개 페이지 히어로도 `fetchPriority="high"` · LH-desktop 홈 LCP < 800ms 는 배포 후 재측정

**◐ W1-S · API 보안 하드닝** (2026-09-08 구현 완료, PR 대기 — 브랜치 `security/w1s-api-hardening`) — `06-frontend-backend.md` F5 · 노력 S~M · 1 PR
- `/api/ai-seo`·`/api/ai-insight`(`blog_id` 없는 자유 호출 경로 제거)·`/api/carousel*` 8개: `hasAdminSession(request)`(revalidate 라우트에 이미 있음) 재사용
- `/api/preview`: `CAPTURE_SECRET` 급 시크릿 요구 · `/api/carousel/proxy-image`: 호스트 allowlist(Supabase Storage·Unsplash) · `/api/view`: IP+slug 60초 쿨다운(comments 패턴 재사용)
- 구현: 미들웨어 matcher 로 관리자 전용 API 8경로 게이트(JSON 401/403, `getUser`; 내비게이션은 리다이렉트; 갱신 쿠키 보존) — send-newsletter·send-test·magazine/capture 의 인라인 검사 3곳 제거 · 공개 `ai-insight` 에 발행 가드(draftMode 예외) · subscribe·track 에도 rate-limit · `/api/ai-insight` `blog_id` 필수 + IP 쿨다운(`lib/rate-limit.ts`) · `proxy-image` Storage 공개 경로 allowlist(`lib/image-proxy-allow.mjs`) · `/api/view` 삭제(호출처 0) · 공개 라우트 8개 `PUBLIC_ROUTE_OK` · source-guard `scripts/audit-api-auth.mjs`. 정리 후보: 호출처 0 인 `carousel/caption`·`carousel/generate`·`carousel-v3/preview`·`newsletter-preview`. 후속: anon RPC `increment_view_count` EXECUTE(핸드오프 §3 ①).
- Done: 무인증 curl 이 401 · 관리자 화면 기능 회귀 없음(배포 후 사용자가 AI 메타·미리보기 버튼 확인) · `audit-endpoints` ✅

### W2. 언어·정체성·엔티티 (2주차) ⛔ D1

**◐ W2-A · 언어 신고 정합 + 홈 정체성** (2026-09-08 구현 완료, PR 대기 — 브랜치 `seo/w2a-language-identity`) — F-A-01 · H17 · F-E-02(2) · 노력 S · 1 PR
- `app/layout.tsx:104` `lang="en-NZ"` · `:36` `locale:'en_NZ'` · `blog/[slug]/page.tsx:252` `inLanguage:'en-NZ'` · 홈/storypress `['en','ko']` → `'en-NZ'`
- 루트 `metadata` 의 한국어 `description`·`keywords`(라이브 미노출 죽은 코드) → 영어 description 으로 정리, `keywords` 삭제
- 홈 `<title>`: `My Mairangi Journal — A Korean Family's School & Life Notes from Auckland's North Shore` (60자 내 조정) · description 동일 축
- 홈 `<h1>` 을 정체성 문장으로 고정(시각적으로는 작게), 캐러셀 글 제목은 `<h2>` → `heading-order` 위반 해소
- Done: 라이브 137 URL `lang` 전부 `en-NZ` · JSON-LD `inLanguage` 단일 · 홈 H1 고정 · LH `heading-order` 통과

**◐ W2-B · 저자 박스 + 엔티티 그래프** (2026-09-08 구현 완료, PR 대기 — 브랜치 `seo/w2b-author-entity`) — F-D-07 · F-B-04(1,2) · F-B-05 · H12 · 노력 S~M · 1 PR
- `components/AuthorBox.tsx`: 사진 + "Yussi · Writer · Social work student, Massey University"(재학생 — 석사 취득 표기 금지) + 소개 1~2문장 + `/about` 링크. 글 본문 직후(인포블록 앞)
- JSON-LD 정규화(`lib/seo.ts`): `Organization @id ${SITE}/#organization` name `My Mairangi Journal` alternateName `MHJ` · `WebSite @id ${SITE}/#website` · `Person @id ${SITE}/about#yussi`(jobTitle·alumniOf·knowsAbout; sameAs 는 URL 확보 시) · `Person @id ${SITE}/about#penny`(Editor, former journalist) · BlogPosting.author/publisher 는 `@id` 참조 · Article(매거진) 도 동일
- `sameAs` 용 외부 프로필 URL 은 사용자에게 받는다(인스타·유튜브·링크드인 등). 없으면 Organization sameAs 만
- **실명 P0**: 사이트 표기(PeNnY/Yussi/Min·Hyun·Jin)만. name-guard 훅이 막으면 우회 금지
- Done: 80편 저자 박스 · `raw/jsonld` 재추출 시 `@id` 참조 80/80 · Rich Results Test 통과 스크린샷 · 3화면

**◐ W2-C · 카테고리 허브 + 기둥 정렬** (2026-09-08 구현 완료, PR 대기 — 브랜치 `seo/w2c-category-hubs`) — F-A-06 · F-D-04 · F-E-05 · 노력 M · 1 PR
- 구현(2026-09-08): 소개문·description·Start here 는 `lib/category-intros.ts` 코드 상수, `site_settings.category_intro_{slug}` 는 소개문 덮어쓰기 전용(관리자 CATEGORY INTROS 섹션). Start here 는 코드에서만 관리. 한글 병기는 D1(영어 정본)에 따라 보류
- 카테고리 페이지 상단: 소개문 + "Start here" 3편 + 고유 description
- 홈 기둥 셀 → `/blog/category/{slug}` · Local Guide 를 기둥에 편입(또는 4기둥을 7카테고리 축으로 재정의 — 사용자 선택) · 카테고리 라벨 한글 병기(D1 이 한국어 독자를 포함할 때)
- Done: 8개 허브 description 전부 고유 · 기둥 셀이 허브로 도착 · 3화면

### W3. 캐싱·성능 (3~4주차, 게이트 없음)

**☑ W3-A · P-27 재발 해소 — 목록·카테고리 8개** (병행 세션 PR #51, 2026-09-08 머지 — 경로 세그먼트 `/blog/page/[n]` 방식 ①로 구현됨) — F-C-01 · H18 · 노력 M · 위험 중간 · Plan Mode 필수
- Opus 정정 반영: **매거진 9개의 `?page` 는 살아 있는 뷰어 상태**라 이번 범위 밖. 대상은 `/blog` + 카테고리 7개
- 방식 ②: 1페이지를 `searchParams` 없는 정적 라우트로, 페이지네이션은 `/blog/page/[n]`·`/blog/category/[slug]/page/[n]` 동적 라우트로 분리. `?page=N` → 308. `BlogLibrary.tsx:53` 링크 생성 변경. `next.config.mjs` 의 `?category=` 리다이렉트 맵이 `?page` 를 carry-over 하는 부분 재검토. W1-A 의 page>1 noindex 유지
- Done: `raw/meta-by-url.json` 재실행에서 `no-store` 17 → 9 · 8개 URL `x-vercel-cache` PRERENDER/HIT · TTFB 중앙값 < 400ms · 빌드표 `ƒ`→`○` · 주간 감사 ⑪ 허용 목록에 매거진 9개만 남김
- 잔여(라이브 재측정): 배포 후 `no-store` 9 확인은 W1-B 의 감사 ⑪ 편입 시 함께.

**◐ W3-B · 목록 CLS 0.19** (2026-09-08 구현 완료, PR 대기 — 브랜치 `perf/w3b-list-cls`; 원인 = `<style jsx>` 모바일 규칙이 SSR 에 안 실림, 실측 0.188 → 0.0001) — F-C-03 · 노력 S(원인 특정 후)
- 모바일 375px Playwright `PerformanceObserver('layout-shift')` 로 요소 특정 → 카드 이미지 `aspect-ratio` 고정 또는 필터 바 높이 예약
- Done: LH-mobile `/blog`·카테고리 CLS < 0.1

**☑ W3-C · 매거진 썸네일 최적화 + 폰트 웨이트 정리** — F-C-05(2) · F-C-04(2) · 노력 S
- `PageThumbnail`·`MagazineViewer` 표지 그리드만 `nextImageUrl` 경유(지면 렌더 무영향). 뷰어 본체 20파일은 보류
- 실제 사용 웨이트 감사 후 `globals.css:8` 요청을 Playfair 6→2~3, Noto 4→2 로 축소. `next/font` 이전(L)은 보류
- Done: `/magazine` 이미지 전송량 −50% · 폰트 CSS 92KB 감소 · 매거진 지면 픽셀 디프 0.00%
- **실측 후 축소(2026-09-08, PR `perf/w3c-fonts-trim`)**: `/magazine`·`/magazine/[id]`(뷰어 `?page` 포함) 이미지 응답 **전부 `/_next/image`, RAW 0**(553KB·78KB) — 보고서의 "미최적화 20파일"은 이미지 파일형 기사(`article.pdf_url`)가 있을 때만 렌더되는 경로로 현재 발행 호에 없음 → 조건부 후속: 이미지형 기사를 발행하면 `MagazineViewer.tsx` `<img src={article.pdf_url}>` 2곳을 `nextImageUrl` 로. 폰트는 `document.fonts` 실측에서 Noto 4웨이트·Playfair 5페이스 **전부 사용 중**이라 줄일 수 없고, **Caveat 만 미사용 → 제거**. 진짜 지렛대(`@import` 체인 → `next/font` 셀프호스팅, 잔여 CLS 0.01 의 `adjustFontFallback`)는 리터럴 50곳+·캡처 파이프라인 때문에 L 급 별건으로 W6 뒤에.

**☐ W3-D · 함수 리전** — U-4 결과에 따름. 가능하면 코드 0. 불가하면 기록만.

### W4. SEO 운영 컬럼과 구조 (3~5주차) ⛔ D2 D3

**☑ W4-A · 마이그레이션 "SEO 운영 컬럼"** — F-A-04 · F-D-01 · F-D-02 · F3 · 노력 M · 위험 중간 — **2026-09-08 완료** (PR `seo/w4a-seo-columns`)
- 결과: `updated_at`·`seo_title`·`summary_ko`(D1)·`faq_json`·`related_slugs`·`og_image_alt` 라이브(`docs/migrations/2026-09-08_seo_operating_columns.sql` + `…_set_blogs_updated_at_v2.sql`) · anon 컬럼 grant 42개(추가형, 배포 전 적용) · `BLOG_CARD_COLUMNS` +`updated_at`, `BLOG_DETAIL_COLUMNS` +SEO 5컬럼 · 선택 텍스트 `''` 111건/75행 → NULL(`scripts/normalize-empty-strings.mjs`, 3원칙)
- `updated_at` 트리거는 코드리뷰(8각도·확정 10건) 후 v2: 제외 목록 방식(새 컬럼은 기본 편집 컬럼) · 8컬럼 `''`→NULL 정규화를 모든 writer 에 적용 · `updated_at ≥ created_at`(예약발행 안전) · faq_json 원소 형태 CHECK. 실증 DO 블록 6케이스 통과 후 롤백. 규칙 정본은 `docs/DB_SCHEMA.md` §blogs
- 새 가드 `scripts/audit-anon-column-grant.mjs`(source-guard): `BLOG_*_COLUMNS` ⊆ grant 참고본 — "grant 빠뜨린 배포 → 42501 → 공개 페이지 500" 을 PR 에서 차단
- 남긴 것(W4-B 에서): 상세 `modifiedTime`/`dateModified` 를 `updated_at` 으로 교체(현재 created_at), FAQPage 빌더는 storypress 페이지 것을 `lib/seo.ts` 로 올려 공유(`StoryPressFAQ = BlogFaqItem`)

**☑ W4-B · 렌더링** — 노력 M — **2026-09-09 완료** (PR `seo/w4b-detail-render`)
- 메타: `<title>`/OG/Twitter = `seo_title || title`(seo_title 이면 루트 템플릿 `— MHJ` 를 붙이지 않는다) · og:image alt = `og_image_alt || title` · `article:modified_time`·JSON-LD `dateModified`·sitemap `lastmod` = `updated_at`
- 화면: 가시 빵부스러기(상단 Back 알약 대체) · 읽는 시간 · 갱신일(발행일과 **다른 날**일 때만, NZ 시간대) · H2 3개+ 목차 · Key takeaways 박스(본문 관례 감지) · `<section lang="ko">` 한국어 요약 · 항상 펼친 FAQ `<dl>` + FAQPage JSON-LD · 관련글 `related_slugs` 우선
- 새 모듈 `lib/content-html.mjs`(순수 함수 + 테스트 45건, source-guard) · `faqPageNode`·`jsonLdScript` 는 `lib/seo.ts` 공용
- 인포블록 내부 목록/표 타이포는 **인라인 스타일이 없는 것만** 복구(기존 7편의 표는 자기 디자인을 갖고 있다)
- 남은 것: 값이 채워진 글이 생기면 Rich Results Test(FAQPage·Article) — W4-C/W5 에서

**☑ W4-C · BlogForm 확장** — 노력 M — **2026-09-10 완료** (PR `seo/w4c-blogform`)
- 필드: `seo_title`(30~60 카운터·AI 초안) · `summary_ko`(AI 초안 → 편집 → 저장) · FAQ 0~4행 · `og_image_alt` · 관련 글 선택기. `/api/ai-seo` 는 `mode`(description|seo_title|summary_ko) 3모드 + 분당 10회 제한(모드 미지정은 예전 동작 유지)
- 관련 글·내부 링크는 **한 패널**(`RelatedSuggestions.tsx`): 스킬 v1 가중치를 `lib/link-suggest.mjs` 로 옮겨 점수순 후보 8개를 보여주고, 행마다 "관련글 추가"(related_slugs 순서 유지)와 "링크 복사"(본문 붙여넣기용). 본문은 대신 고치지 않는다
- preflight 는 기존 체크리스트를 확장 — 판정은 `lib/blog-preflight.mjs` 한 곳. (감사 쪽은 W4-D 에서 `lib/seo-defects.mjs` 로 따로 갔다 — 잣대가 다르다.) 16행 = 필수 4 + 조건부 1(캡션) + 권장 12. 필수만 저장을 막고 나머지는 경고(D3)
- **커버 캡션은 글이 처음 공개될 때 필수** — "신규 글"(첫 저장) 기준으로 재면 초안으로 저장했다 나중에 발행하는 흐름이 규칙을 그냥 지나친다. 초안 저장은 막지 않는다(저장 버튼이 하나뿐이라 막으면 글을 나눠 쓸 수 없다)
- 임계값은 `scripts/audit-seo-regression.mjs` 와 **일부러 다르다** — 폼은 발행 템플릿 목표치(내부링크 2개·H2 3개·서술형 alt), 감사는 결함 기준선(내부링크 0=ORPHAN 등, `seo-baseline.json` 에 동결). 실측 80편 중 63편이 내부링크 판정이 갈리므로 수치를 인용할 때 어느 쪽인지 밝힐 것
- AI 생성물은 훅을 거치지 않으므로 라우트가 `lib/name-guard.mjs` 로 실명 패턴을 검사해 걸리면 422 로 폐기한다(P0, CLAUDE.md 10)
- 자동 임시저장이 그동안 `coverCaption` 을 빠뜨리고 있었다 — 새 상태 3종과 함께 편입
- 기존 발행 글은 권장 항목이 **7~11개(중앙값 9)** 미충족으로 뜬다(실측 80편: 내부링크 2개+ 7편, takeaways·seo_title·summary_ko·FAQ·관련글은 0편). 그게 W5 정비 큐의 작업 목록이다. 그래서 **저장 시 토스트는 처음 공개되는 글에서만** 띄우고, 이미 공개된 글은 '이번 편집으로 새로 깨진 항목'만 짚는다(매거진 넘침 경고가 벽지가 된 전례)

**☑ W4-D · mhj-desk/seo 감사 페이지** — F4 · 노력 S~M — **2026-09-10 완료** (PR `seo/w4d-audit-page`)
- 판정을 `lib/seo-defects.mjs` 로 통합 — 주간 회귀 감사와 관리자 화면이 **같은 함수**를 쓴다. 예전엔 화면이 자기 규칙을 따로 갖고 있어 수치가 갈렸다. 실측 대조: 기준선 8종(h1_over 0·alt 3·orphan 10·meta 0·thin 36·no_h2 6·no_geo 23·og_fallback 59) 전부 `seo-baseline.json` 과 일치
- 검사 추가(기준선 **밖**, 운영 지표): seo_title 없음 80 · summary_ko 없음 80 · FAQ 없음 80 · 90일 미갱신 67 · 태그 없음 3. 회귀 게이트로 삼지 않는다 — 전 편 미입력이라 게이트가 의미 없고, 채우는 일은 W5 몫
- 화면: `select('*')` 제거(감사에 필요한 17컬럼만 — 비공개 컬럼이 브라우저로 안 온다) · `.range()` 로 끊어 받기 · 항목별 칩으로 거르기 · 25편씩 페이지 · 심각도순 정렬
- 회귀 테스트 `scripts/qa/test-seo-defects.mjs`(source-guard 편입) — 임계값을 바꾸려면 테스트를 먼저 고쳐야 한다
- 합계는 전 코퍼스를 읽어야 나오므로 "끊어 받기"이지 "일부만 보기"가 아니다

**☑ W4-E · 피드·에이전트 인덱스** — F7 · B4 · 노력 S — **2026-09-10 완료** (PR `seo/w4e-feed-llms`)
- `feed.xml`: `content:encoded` 전문 20편 + `xmlns:content` 네임스페이스(CDATA, `]]>` 이스케이프) · `pubDate = publish_at ?? created_at` · `atom:updated = updated_at` · 본문의 상대 링크를 절대 URL 로(리더 안에서 리더 도메인으로 풀려 깨진다)
- `enclosure` 는 HEAD 로 실제 `length`·`type` 을 확인한다. 지금까지 전부 `length="0" type="image/jpeg"` 였는데 실측 80편 중 25편이 jpeg 가 아니다. 못 얻으면 **거짓 값 대신 생략**(전체 예산 3초, 느린 CDN 이 피드를 막지 않게)
- `llms-full.txt`: 이름값대로 **전문 포함** — 조회수 상위 20편을 마크다운(제목·목록·링크 보존)으로, 나머지는 기존 한 줄 요약. 300KB 상한을 넘으면 멈추고 몇 편을 뺐는지 밝힌다. 실측 85KB/20편. `summary_ko` 가 있으면 한국어 요약도 함께 싣는다
- 새 순수 함수 `absolutizeUrls`·`imageMimeOf`·`htmlToMarkdown`(`lib/content-html.mjs`, 테스트 9건 추가)
- Done 의 남은 절반은 사용자 몫: **네이버 RSS 재제출** · Perplexity 로 `/llms-full.txt` fetch 확인

### W5. 콘텐츠 정비·허브·신규 (3주차부터 지속) ⛔ D4 — **도구·목록 준비 완료(2026-09-10)**, 본문 집필은 두 분

**정비 큐 → `docs/W5-refit-queue.md`** (2026-09-10 생성). 실측으로 다시 뽑는다:
`node --env-file=.env.local scripts/report-refit-queue.mjs --write`.
아래 표는 2026-09-03 보고서 기준의 초안이고, 지금 유효한 순서와 처방은 위 문서에 있다
(판정은 `lib/seo-defects.mjs` — 관리자 화면·주간 감사와 같은 함수).

**정비 큐 초안 (조회 × 결함, 처방은 목록까지 — 본문 수정은 두 분)**

| 순 | slug | 조회 | 처방 |
|---|---|---|---|
| 1 | `how-to-read-a-mid-year-report` | 29 | H2 3개 · 내부링크 2(허브+Year 7) · seo_title · takeaways · FAQ 3 |
| 2 | `starting-school-in-new-zealand` | 99 | 클러스터 A **허브로 승격**: 학년별 링크 섹션 · FAQ · takeaways · summary_ko |
| 3 | `a-quiet-week-before-the-break-ends` | 40 | 400단어 확장 · 인포블록 · 링크 |
| 4 | `the-word-cards` | 35 | 확장 · takeaways |
| 5 | `y7-kahu-manu-new-way-of-learning` | 36 | 인포블록 · (2)편과 시리즈 내비 |
| 6 | `setting-personal-routines` | 50 | FAQ · takeaways · summary_ko |
| 7 | `ncea-is-changing-…` ×2 | 30/18 | **통합 1편 + 308**(사용자 승인) |
| 8 | `library-tour-…` ×3 | 27/14/8 | 신규 허브 "North Shore Libraries for Families" + 3편 자식 링크 |
| 9 | `100-days-of-schhol` | 7 | 제목 오타 · H2 · 링크 (slug 유지) |
| 10~16 | 09-03 보고서 worst 목록 나머지 | | ORPHAN → THIN → H2 순 |

**신규 글 후보 (주 1편, 클러스터 빈칸 우선)**: "NZ school years explained for Korean families (Year 0–13)" 허브 · "Year 6→7 전환" · "School zones on the North Shore" · "GP 등록·병원" · "Asian lunchbox 확장". 아카이브 `content-proposal-v2` 14편 중 위 5개만 부활, 나머지 폐기.

**발행 템플릿 → `docs/CONTENT_TEMPLATE.md`** (2026-09-10 신설, D3 반영). 문서의 모든 항목이
코드가 실제로 검사·렌더하는 것과 일치함을 확인했다(takeaways 감지 규칙·체크리스트 항목·캡션 필수 시점).
원안 요약: 답 먼저 문단 40~60단어 → H2 ≥3(1개는 질문형) → Key takeaways 목록 → 본문 → 내부링크 ≥2(허브 1) → 외부 권위 링크 ≥1(정부·학교) → 인포블록 → FAQ 2~3 → cover_caption · alt 는 장면 서술(제목 반복 금지) · seo_title · summary_ko.

**정비 단락마다** `node --env-file=.env.local scripts/audit-seo-regression.mjs --update-baseline`.

**네이버 블로그 배포 (선택, D1 이후)**: 주 1편, `summary_ko` + 원문 링크. 요약 블록이 없으면 시작하지 않는다.

### W6. UX·접근성·전환 (4~6주차, D5)

**☑ W6-A · 대비 토큰 + 규칙서** — F-E-01 · 노력 S · 위험 중간(전 페이지 톤) — 2026-09-10 완료
- `--text-tertiary` 라이트 `#666C77` / 다크 `#8B98A9`, `--accent` 다크 전용값, Footer 알파 상향 · **`docs/DESIGN_RULES.md` §6 동시 개정**(규칙 변경) · 본문 링크·콜아웃 하드코딩 색 → 토큰
  (계획의 `#6B7280` 은 흰 배경만 본 값이다 — `--bg-warm` `#F5F0EB` 위에서 4.27:1 이라 한 단계 더 내렸다)
- Done: `node scripts/qa/audit-contrast.mjs` — 5화면 × 2테마 × 2뷰포트. 스크린샷도 같은 조합으로 전후 비교
  | | 전 | 후 |
  |---|---|---|
  | 합계 | 909 | 126 |
  | CSS 클래스가 칠한 것(=코드) | 75 | **0** |
  | `style=` 속성 | 834 | 126 (매거진 표지 114 + 본문 인라인 12) |

  전·후 모두 **최종 스크립트로 다시 잰 값**이고, 기준선은 라이브(`--base=https://www.mhj.nz`)에서도
  똑같이 909/75 가 나와 교차 확인됐다. 작업 중에 나온 "219"·"498" 은 버린다 —
  각각 테마 키가 틀렸을 때와 뷰포트가 하나였을 때의 수치다.
  마지막에 한 번 더 헛짚었다: `next start` 가 `EADDRINUSE` 로 조용히 죽고 **낡은 서버가 계속
  응답해서**, 고친 것이 안 고쳐진 것처럼 나왔다. 그래서 이제 측정 전에 서빙된 HTML 에 그 커밋의
  문자열이 실제로 있는지 확인하고 시작한다.
- 계획에 없던 것 넷을 실측이 끌어냈다:
  ① 뉴스레터 하단 블록은 배경이 테마와 **반대로** 뒤집히는데 글자·테두리·플레이스홀더는 고정이었다 →
     다크에서 크림 위 크림. `--newsletter-soft/muted/field-bg/field-border` 로 짝을 맞췄다.
  ② `::placeholder` 는 Tailwind preflight 기본값 `#9CA3AF` 로 **흰 배경에서도 2.54:1** — 사이트 전역.
  ③ `::placeholder` 와 같은 이유로, Tailwind 설정(`tailwind.config.ts`)에 옛 팔레트가 그대로 남아
     어드민에서 `text-tertiary` 가 **1.42:1** 로 렌더되고 있었다. 정본(globals.css)과 값을 맞췄다.
  ④ 9px 책등 날짜는 색이 아니라 `opacity: .55` 때문에 2.98:1 이었다 — 잉크가 배경 밝기에 따라
     뒤집히게 돼 있어도 알파가 낮으면 소용없다.
- **측정기가 스스로 틀린 것 네 번**(전부 스크립트에 회귀 방지로 박아 넣었다):
  테마 키를 `theme` 로 심어 라이트를 두 번 잼(실제 키 `mhj-theme`) · gradient 배경 위 글자를
  페이지 배경에 대고 재 오탐 · 사진 위 흰 글자를 흰 배경으로 재 오탐이자 다크에선 누락 ·
  `opacity` 를 합성하지 않아 통과로 오판. 이제 테마·HTTP 상태·서빙 내용을 먼저 확인하고 잰다.
- CI 에 연결했다 — 주간 `site-audit` ⑫. CSS 가 칠한 위반이 하나라도 있으면 실패한다.
  없으면 누가 `color:'#9CA3AF'` 하나 되돌려도 아무도 모른다.
- **남긴 것**: `/magazine` 표지 114건(모바일 뷰포트 기준 57 × 2테마). 편집자가 고르는 `bg_color`/`accent_color` 와
  `CoverPreview` 의 하드코딩 `#8B7D6B` 이 얽혀 있고, 지면은 `docs/MHJ_MAGAZINE_DESIGN_BIBLE.md` 관할이라
  대비 토큰 PR 안에서 조용히 바꾸지 않았다. 별건(W6-E 후보) — `isLightColor` 가 두 파일에 복제돼 있고
  `CoverPreview` 는 그마저 안 쓴다는 것이 뿌리다.
  본문(`info_block_html`)의 인라인 `#9CA3AF` 도 코드가 아니라 데이터 → W5 정비 큐
- **측정 범위 밖에서 새로 드러난 것**: `/storypress` 53건(라이트 29 · 다크 24). 자기 팔레트를 따로 쓰는
  제품 랜딩이라 사이트 토큰을 고쳐도 안 따라온다 — 주황 `#F59E42` 1.91~2.13:1, 흰색 알파 0.2/0.25.
  W6-A 브리프(3화면)에도, 내가 넓힌 5화면에도 없던 화면이라 이 PR 에 끌어들이지 않았다. 별건.
  `/gallery`·`/privacy`·`/blog/tag/[tag]` 는 0건.

**☑ W6-B · 접근성 기본** — F-E-02 · 노력 S — 2026-09-10 완료
- Done: `node scripts/qa/audit-a11y.mjs`(axe-core, 8화면 × 2뷰포트) **8규칙 31건 → 0**.
  주간 `site-audit` ⑬으로 연결. 계획의 Done 기준이던 `button-name`·`label-content-name-mismatch`
  는 착수 시점에 **이미 위반 0** 이었다 — "aria-label 12건"도 실측 근거가 없어 폐기한다.
- **계획서가 틀렸던 것**: 본문 내 `<footer>`(`blog/[slug]/page.tsx:644`)는 `<article>` 안이라
  랜드마크가 아니다. HTML 사양대로 스코프가 잡혀 있어 고칠 것이 없다 — 그대로 뒀다.
- **계획에 없던, 훨씬 큰 것**: `/blog` 의 글 카드 다섯 종류가 전부 `<div onClick={router.push}>`
  였다. 라이브 실측 결과 **글로 가는 `<a href>` 가 0개** — 키보드로 어떤 글도 열 수 없었고,
  검색 엔진 눈에는 블로그 허브가 어느 글로도 링크하지 않는 페이지였다(이 플랜의 목표에
  정면으로 반한다). 다섯 개를 전부 `<Link>` 로 바꿔 **0 → 24개**. 카테고리 필터도
  `<button onClick>` 이라 허브 7개가 색인에서 고립돼 있었다 — 그것도 링크로(**0 → 7개**).
  같은 결함이 `/gallery` 에도 있었다: 감사 대상 화면이면서 "위반 0" 이었는데 사진 334장이
  키보드로 안 열렸다(`<div onClick>` → `<button>`, Enter·Space 로 라이트박스가 열리는 것 확인).
  axe 는 React 의 `onClick` 을 못 보므로, 스크립트가 그 링크 수를 직접 세어 회귀를 막는다.
- 실측으로 잡은 나머지: `<main>` 중첩 3곳(privacy·매거진 기사·호 상세) · `<main>` 안의 `<aside>` ·
  이름 없는 `<nav>` 4개 · FAQ 답변의 `role="region"`(문항 수만큼 랜드마크가 생겼다) ·
  인스타 섹션이 `<main>` 밖이라 어떤 랜드마크에도 안 들어감(전 페이지) · 서가 h1→h3 건너뜀 ·
  키보드로 못 가는 가로 스크롤 영역.
- 스킵 링크 신설(`.skip-link`). `display:none` 으로 숨기면 포커스를 못 받아 죽으므로 화면 밖에
  두었다가 `:focus` 에 끌어온다. 햄버거는 `aria-expanded`·`aria-controls` 를 얻었고,
  라벨이 "Open menu" 로 고정이라 열린 뒤에도 "여세요" 라고 읽던 것을 상태에 따라 바꿨다.
- `docs/DESIGN_RULES.md` §15.5 신설 — `<div onClick>` 금지·랜드마크 규칙·체크리스트 2줄.

**☑ W6-C · 글 페이지 전환 장치** — F-E-04 · F-D-08 · 노력 S~M — 2026-09-11 완료
- 원래 문구: 하단 블록 정리(Next Story + 이전/다음 → 1개) · `InlineSubscribeCTA` 본문 50% 부활 · `StoryPressSection` 을
  Little 15 Mins·Home Learning 글에 · 트래킹 4종 · `subscribers.source='storypress'` · 404 에 검색창+인기글 3.
  Done: GA4 에 새 이벤트 수신 · 3화면
- **사용자 결정(2026-09-11)** ① 하단 = 이전·다음을 사진 카드 2장으로 합침 ② 구독 CTA 는 끝에서 **본문 중간으로 이동**
  (글당 1개 — `cae305f` 의 "CTA 7→2" 원칙 유지) ③ `source='storypress'` → **StoryPress 클릭 추적**으로 대체.
- **선행: 가입 출처가 기록되지 않았다.** `NewsletterCTA` 가 `source` 를 안 보내 구독자 15명 중 12명이 `null` —
  어느 CTA 가 효과 있는지 원천적으로 몰랐다. 이제 `blog_mid` · `blog_detail` · `homepage_bottom` · … 로 남는다.
- **본문 중간 CTA**: `splitForMidInsert`(`lib/content-html.mjs`) 가 **최상위 문단 사이에서만** 자른다(인용·목록·표·
  Key takeaways 안은 안 자름, 제목과 첫 문단 사이도 안 자름). 발행 81편 실측 — **49편 중간(30~70% 구간, 중앙 47%)**,
  32편은 자를 곳이 없어 끝에. 무손실 49/49. 처음엔 구간이 없어 16%(리드를 끊음)·96%(사실상 끝)에 꽂히는 글이 있었다.
  뒤 조각은 `--cont` 로 리드 글꼴·드롭캡을 또 받지 않는다(규칙 6개).
- **추적**: `data-track` 속성 + `OutboundLinkTracker` 전역 위임 한 곳 — 서버 컴포넌트(홈 기둥 셀)에도 붙는다.
  새 이벤트 8종(`instagram_follow_click` · `pillar_click` · `related_click` · `next_read_click` · `ai_insight_click` ·
  `storypress_click` · `not_found_search` · `not_found_popular_click`)이 GA4 와 `page_events(event_type='click')` 에 같은 이름으로.
  외부 링크 판정이 `*.mhj.nz` 를 전부 내부로 봐서 **app.mhj.nz(StoryPress 앱) 클릭이 어디에도 안 남던 것**도 고쳤다.
- **Done 검증 방법**: GA 수집 요청을 **가로채 막고**(실제 속성에 테스트 이벤트를 흘리지 않는다) 두 가지로 확인 —
  `window.dataLayer` 에 각 이벤트가 **정확히 한 번** 들어가는지(결정적), GA 가 실제로 보내려던 요청의 `en=` 값.
  GA 는 몇 초 모아 보내므로 3.5초 대기로는 안 보이고 7초에 전부 보였다. **GA4 가 실제로 받았는지는 배포 후
  실시간/DebugView 에서만** 확인된다(사용자 몫). 구독 제출은 `/api/subscribe` 를 가로채 본문만 봤다(실DB·실메일 방지).
- **404**: 오타 URL 이 가는 **루트 404 에는 분석 도구가 하나도 없었다**(레이아웃 밖) — 어느 URL 이 깨졌는지조차 안 남았다.
  이제 pageview·GA·클릭 추적을 직접 마운트하고, 두 404 모두 검색칸(사이트 오버레이 재사용) + 많이 읽힌 글 3편.
- **Next Story 삭제로 함께 사라진 결함**: 그 쿼리는 service_role 로 **`publish_at` 필터 없이** 돌았다(CLAUDE.md 3 위반 —
  예약 글이 공개 전에 "Next Story" 로 샐 수 있었다).
- **계획서 문구가 틀렸던 것**: 이전/다음의 `id` 순 정렬은 이미 `date` 순으로 고쳐져 있었다 · StoryPress 는 이메일 폼이 없고
  CTA 가 외부 앱이라 `source='storypress'` 는 생길 수 없다 · `InlineSubscribeCTA` 는 하드코딩 색·`<aside>`·단순 `</p>` 분할이라
  되살릴 수 없는 상태 → 삭제하고 `NewsletterCTA` 로 일원화.
- 검증: axe·대비 0(홈·목록·글 2종 × 2테마 × 2뷰포트, 404 두 종) · `test-content-html` 신규 17케이스 · 3화면 × 2테마 스크린샷.
- **사용자 몫**: GA4 맞춤 측정기준에 새 파라미터 등록 · 관리자 설정 `storypress_cta_text` 가 아직 **"Join the Waitlist"**
  (앱은 이미 열려 있다 — 글 안 카드에 그대로 보인다).

**☐ W6-D · 검색 품질** — F-E-03(2,3) · 노력 S → M
- 1차: 제목 매치 우선 2단 쿼리 + tags/meta_description 포함 + 에러/빈결과 구분 · 2차(선택): `to_tsvector` GIN + `pg_trgm`(DDL)
- Done: 쿼리 10개 관련성 판정표

---

## 5. 대화 큐 (1대화 = 1기능, 붙여넣기 프롬프트)

| 순 | 대화 | 시작 프롬프트 | 게이트 |
|---|---|---|---|
| 1 | W1-A | `docs/PLAN-search-visibility-2026-09.md §4 W1-A 착수. Plan Mode 로 파일별 변경안 먼저, 승인 후 구현. 완료 정의 = build+tsc+audit-endpoints+/code-review+/verify` | — |
| 2 | W1-B | `… §4 W1-B 착수. 감사식 세 곳 동시 수정 + 새 감사 ⑪ 양성 대조군 실증 후 기준선 재잠금` | — |
| 3 | W1-C | `… §4 W1-C 착수. 홈 첫 슬라이드가 lazy 인 원인부터 실측(라이브 HTML + 컴포넌트 추적), 원인 확정 후 수정` | — |
| 4 | W1-S | `… §4 W1-S 착수. hasAdminSession 재사용, 무인증 401 실증` | — |
| 5 | W2-A | `… §4 W2-A 착수. D1 = <답변>` | D1 |
| 6 | W2-B | `… §4 W2-B 착수. sameAs URL: <목록>` | D1 |
| 7 | W2-C | `… §4 W2-C 착수. 카테고리 소개문 초안 7개 먼저 제시, 승인 후 site_settings 반영` | D1 |
| 8 | W3-A | `… §4 W3-A 착수. Plan Mode. 매거진 ?page 는 범위 밖` | — |
| 9 | W3-B/C | `… §4 W3-B, W3-C 착수(별도 대화 2개)` | — |
| 10 | W4-A | `… §4 W4-A 착수. Plan Mode. 마이그레이션→grant→constants→배포 순서, og_image_url '' 정리는 dry-run 먼저` | D2 D3 |
| 11 | W4-B | `… §4 W4-B 착수. updated_at 은 편집 변경만 갱신하므로 dateModified·sitemap lastmod 에 바로 사용. seo_title 등은 BLOG_DETAIL_COLUMNS 에 이미 포함` | W4-A ☑ |
| 12 | W4-C | `… §4 W4-C 착수. preflight 는 경고 모드` | W4-A ☑ W4-B ☑ — takeaways 는 본문 `<h2>Key takeaways</h2> + <ul>` 관례(감지 규칙 `lib/content-html.mjs`), 폼 필드는 seo_title·summary_ko·FAQ·related_slugs·og_image_alt |
| 13 | W5 | `… §4 W5 정비 큐 1번부터. 처방 목록만 만들고 본문은 수정하지 않는다` | W4 전체 ☑ |
| 14 | W5 | `… §4 W5 정비 큐 1번부터. 처방 목록만 만들고 본문은 수정하지 않는다` | D4 |
| 15 | W6-A~D | 별도 4대화. W6-A 는 DESIGN_RULES 개정 포함 | D5 |

각 대화 착수 전: `git fetch origin main` · `gh pr list` · `gh run list` (병행 세션 충돌 방지, 핸드오프 §5-8).

---

## 6. 측정 체계

| 시점 | 무엇 | 도구 |
|---|---|---|
| **지금(before)** | G2 표 전부 + U-3·U-5 결과 | 보고서 + 사용자 자료 |
| W1 배포 직후 | robots Allow · og:site_name · noindex · 감사 ⑪ | `audit-endpoints` + 크롤러 재실행 |
| W3 배포 직후 | `no-store` 17→9 · TTFB | `raw/meta-by-url.json` 크롤러 재실행 |
| 2026-09-16~ | 자체 유입 상위 글 | `mhj_top_pages(days=>14)` |
| **+4주 2026-10-06** | 색인 URL(G/B/N) · CWV 필드 · 유기 세션 · 구독 | GSC · Bing · 네이버 · Speed Insights · `page_events` |
| **+8주 2026-11-03** | §0 목표표 전부 + AI 프로브 20문항 재실행 | 같음 + Q7 템플릿 |
| 매주 | 주간 감사 ⑪ 포함 11종 | `site-audit.yml` |

---

## 7. 리스크·지뢰 (이 플랜에서 실제로 걸릴 것)

1. **없는 컬럼 select → 쿼리 전체 null**(W4-A). 마이그레이션·grant·constants·배포 순서를 바꾸면 블로그 전체가 빈다.
2. **anon grant fail-closed**. 새 공개 컬럼마다 grant 를 추가해야 공개 페이지가 읽는다. 주간 감사 ⑨⑩ 이 잡지만 배포 전 프로브로 먼저 확인.
3. **매거진 `?page` 는 살아 있는 뷰어 상태**(W3-A). 목록·카테고리만 손댄다.
4. **URL 변경 (`/blog/page/N`)**. 308 + sitemap + 내부 링크 동시. 색인 이관은 GSC 로 확인.
5. **한국어 요약은 두 분의 목소리**. AI 초안은 승인 없이 게시하지 않는다. 품질이 안 맞으면 블록을 끈다(컬럼은 남는다).
6. **규칙서와 코드의 동시 개정**(W6-A). 코드만 바꾸면 다음 감사에서 되돌려진다.
7. **실명 P0**. 저자 박스·Person 스키마·sameAs 에 사이트 표기만. name-guard 차단은 우회하지 않는다.
8. **병행 세션**. 착수 전 원격 상태 확인. PR 겹침 전례(#36/#37).
9. **감사 위음성은 눈에 안 띈다**. 새 감사 ⑪ 과 F-A-03 수정은 위반 주입으로 exit 1 을 실증한 뒤 편입.

---

## 8. 이 플랜에서 하지 않는 것

- 풀 이중언어 `/ko/` 라우트·hreflang (L, 발행 여력 불일치) — 8주 후 요약 블록 성과로 재판단
- 매거진 뷰어 `?page` 분리 · 뷰어 본체 이미지 최적화 20파일 — W3-A 효과 실측 후
- `next/font` 전면 이전 · Next 16 · Tailwind 4 — 비긴급 판정 유지
- preflight **차단** 훅 — 경고 모드 4주 후
- 제목 21편 직접 편집(나안) — `seo_title` 로 대체. 오타 1건만 승인 후
- INP 최적화 — 랩 기준 문제 없음. 필드(U-4)에서 뒤집히면 재검토
