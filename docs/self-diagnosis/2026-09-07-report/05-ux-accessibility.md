# E. UI/UX · 접근성

스크린샷: `screens/{route}-{375|768|1320}-{light|dark}.png` — 7 라우트 × 3폭 × 2테마 = **42장** (Playwright, 2026-09-07)

## E0. 요약

읽기 경험 자체는 좋다 — 타이포는 `docs/DESIGN_RULES.md` 를 거의 그대로 지키고(본문 16px/1.7, 읽기 폭 720px, 한 줄 41자), 모바일 3화면 모두 깨짐이 없다. 문제는 **검색으로 들어온 사람을 붙잡는 장치**와 **접근성**에 있다. 목차·읽는 시간·저자 박스가 없고, 본문 아래에 다음 글 유도가 3중으로 겹치며, 저대비 텍스트가 페이지당 28~82곳이다.

---

## E2. 글 페이지 구성요소 인벤토리

`app/(public)/blog/[slug]/page.tsx`

| 요소 | 유무 | 위치 | 파일:행 |
|---|---|---|---|
| 스크롤 진행바 | ✅ | 최상단 fixed 2px | `:266` → `ReadingProgress.tsx:39-60` |
| Back to Library | ✅ | 본문 위 | `:309-330` |
| 카테고리(dateline) | ✅ | 제목 위 | `:352` |
| H1 제목 | ✅ | | |
| 저자 이름 | ✅ (이름만) | 메타줄 1 | `:382-390` |
| 발행일 | ✅ | 메타줄 2 | `:392-394` |
| 카테고리 링크 | ✅ | 메타줄 3 | `:396-412` |
| AI Insight 버튼 | ✅ | 메타줄 우측 | `:414-416` |
| 커버 이미지 | ✅ | | `:483` |
| 본문 | ✅ (드롭캡) | | `:461-` |
| 인포블록 | ✅ (38/80편) | 본문 직후 | `:496-502` |
| 태그 칩 | ✅ | 인포블록 뒤 | `:508-531` |
| 공유 버튼 | ✅ | footer 우측 | `:571-575` |
| 댓글 | ✅ | | `:584` |
| Next Story | ✅ | | `:588-607` |
| 지난 편지 hint | ✅ | | `:610-617` |
| 뉴스레터 CTA | ✅ 1회 (`inline-thin`) | | `:618-623` |
| 이전/다음 | ✅ | | `:626-701` |
| 관련글 3편 | ✅ | 최하단 | `:706-743` |
| 인스타그램 피드 | ✅ (강제) | `<main>` 밖 | `(public)/layout.tsx:51` |
| **목차(TOC)** | **없음** | — | 레포 전체에 blog 용 TOC 없음 |
| **읽는 시간** | **없음** | — | `readingTime`/`min read` grep 0건 |
| **갱신일** | **없음** | — | JSON-LD 에도 `created_at` 뿐 (F-A-04) |
| **저자 박스(사진·자격)** | **없음** | — | F-D-07 |
| **가시적 빵부스러기** | **없음** | — | JSON-LD 만 (`:207-215`) |
| **반응(좋아요)** | **없음** | — | 매거진에만 존재 |
| **StoryPress CTA** | **없음** | — | `StoryPressSection.tsx` 는 import 0건 데드 컴포넌트 |

## E2-b. 읽기 타이포그래피 실측 vs DESIGN_RULES

| 항목 | 실측 | 파일:행 | 기준 | 판정 |
|---|---|---|---|---|
| 본문 크기 | 16px | `globals.css:784` | §5.2 16px | ✅ |
| 줄 높이 | 1.7 | `:787` | §5.2 1.7 | ✅ |
| 읽기 폭 | 720px (편지 640px) | `page.tsx:461` | §5.4 | ✅ |
| 실제 텍스트 폭 | 656~680px (패딩 제외) | `page.tsx:463` | — | — |
| 한 줄 글자 수 | 한글 ≈ **41자** / 영문 ≈ 75~78 | 계산 | §5.4 35~45자 | ✅ |
| 문단 간격 | 24px | `:789` | §7 8px 그리드 | ✅ |
| H2 | clamp(24,3vw,36), margin 48/16 | `:863-869` | §5.2 | ✅ |
| 첫 문단 | 19px / 1.65 (≤640px 18px) | `:790-796` | 미규정 | — |
| 드롭캡 | 64px Playfair 900 | `:797-806` | 미규정 | — |
| 본문 이미지 | max-width 100%, radius 8, `data-width` 25/50/75/100%, ≤640px float 해제 | `:891-898, 991-994` | §4.3 | ✅ |
| **`--text-max: 680px`** | 정의만 하고 미사용 (720 하드코딩) | `:64` vs `page.tsx:461` | — | ⚠ 불일치 |
| **본문 링크 색** | **하드코딩 `#4F46E5`** | `:890` | §6.2 하드코딩 금지 · §6.3 인디고는 AI Insight 전용 | ❌ **위반 2건** |
| **콜아웃 배경** | 하드코딩 `#EEF2FF`/`#4F46E5` | `:975` | §6.2 | ❌ 위반 |
| Footer 배경 | `#111111` | `Footer.tsx:93` | §13.2 `#000` | ⚠ 경미 |

`.prose`(Tailwind typography) 미사용 — 전부 `.blog-content` 커스텀이다.

---

### F-E-01 · 저대비 텍스트가 페이지당 28~82곳 · `--text-tertiary` 가 두 테마 모두 WCAG 미달

- 심각도: **P1**
- 영향 엔진: Google(접근성은 순위 요소가 아니지만 UX 지표에 간접 영향) · 실제 독자
- 판정: **확정**
- 증거:
  - Lighthouse `color-contrast` 위반 건수 — magazine 82 · home 66 · blog 57 · category 54 · post 36 · about 28 (12개 리포트 전부 실패)
  - Lighthouse a11y 점수 90~96
  - 토큰 대비비 계산 (상대휘도):

    | 토큰 | 라이트 값 | on `--bg` | on `--bg-surface` | 판정 |
    |---|---|---|---|---|
    | `--text-secondary` `#64748B` | | 4.76 | **4.49** | surface 위에서 실패 |
    | **`--text-tertiary` `#9CA3AF`** | | **2.54** | **2.40** | **실패** (대형텍스트 3:1 도 미달) |

    | 토큰 | 다크 값 | on `#0A0A0A` | on `#161412` | 판정 |
    |---|---|---|---|---|
    | `--text-tertiary` `#64748B` | | **4.16** | **3.86** | **실패** |
    | `--accent` `#4F46E5` | | **3.15** | **2.92** | **실패** — 라이트와 같은 값을 다크에 그대로 둠(`globals.css:100`) |
  - Footer 실측: 링크 `rgba(255,255,255,0.4)` on `#111` = **3.29** · 라벨 0.3 = **2.23** · 카피라이트 0.2 = **1.61**
  - 글 페이지에서 `--text-tertiary` 가 실제 노출되는 곳: `page.tsx:337`(스폰서 10px) · `:391/395`(메타 구분점) · `:645/676`("← Previous"/"Next →" 10px) · `:716`("Continue Reading") · `globals.css:921`(figcaption)
  - `globals.css:29` 주석은 `#CBD5E1`(1.4:1)에서 교정했다고 적었으나, **교정 후 값도 2.54 로 여전히 미달**이다.
- 현재값 → 목표값: 위반 28~82/페이지 → 0
- 원인: `app/globals.css:29, 100` · `components/Footer.tsx:135,153,175,192,199,205,252,259`
- 처방 후보(실행 안 함):
  1. `--text-tertiary` 를 라이트 `#6B7280`(≈4.83:1), 다크 `#8B98A9`(≈6.6:1) 로 올린다. `--accent` 는 다크 전용 값(`#8B87F0` 등)을 따로 준다. Footer 는 알파 0.4→0.62, 0.3→0.55, 0.2→0.5.
  2. **`docs/DESIGN_RULES.md` §6.1 이 `--text-tertiary: #9CA3AF` 를 명시하고 있으므로, 이건 "규칙 변경 제안"이다** — 코드만 고치면 다음 감사에서 되돌려질 수 있다. 규칙서와 함께 바꿔야 한다.
- 노력: **S**(값 교체) · 위험: **중간** — 전 페이지 톤이 미묘하게 바뀐다. 3화면 × 2테마 재확인 필요(완료 정의 CLAUDE.md 11)
- 관련 가설: —

---

### F-E-02 · 스킵 링크 없음 · 공개 아이콘 버튼 12개에 접근명 없음 · 홈 heading-order 위반

- 심각도: **P2**
- 판정: **확정**
- 증거:
  - `skip to content`/`skip-to`/`sr-only` grep **0건**
  - `aria-label`·`title`·텍스트가 모두 없는 아이콘 버튼 — **공개 12건**: `BlogLibrary.tsx:844,891` · `DetailModal.tsx:239` · `MagazineViewer.tsx:271,351,367` · `MagazineFlipViewer.tsx:559,566,625,642,715,755` (어드민 4건 별도)
  - Lighthouse `button-name` 실패: `/blog` (mobile·desktop)
  - Lighthouse `heading-order` 실패: **home**(mobile·desktop), magazine-mobile — 홈 H1 이 캐러셀 글 제목이라 H1 이후 계층이 어긋난다(F-A/H17 과 같은 뿌리)
  - Lighthouse `label-content-name-mismatch` 실패: **12개 페이지 전부**
  - 잘 돼 있는 것: `:focus-visible` 정의됨(`globals.css:141-154`), `<main>`/`<nav>`/`<footer>` 랜드마크 존재, SearchOverlay 는 `role="dialog"`+`aria-modal`+focus trap+ESC 로 모범적
  - 문제: 글 본문 안에 `<footer>` 가 하나 더 있어(`page.tsx:542`) 스크린리더에 footer 랜드마크가 2개
  - 모바일 햄버거: `aria-label="Open menu"` 가 **열린 상태에서도 그대로**, `aria-expanded` 없음 (`Navigation.tsx:192-196`)
- 현재값 → 목표값: 접근명 없는 공개 버튼 12 → 0 / 스킵 링크 0 → 1
- 원인: 위 파일들
- 처방 후보(실행 안 함):
  1. `aria-label` 12건 추가 + 스킵 링크 1개 — 기계적, 반나절
  2. 홈 H1 을 사이트 정체성 문장으로 고정하고 캐러셀 제목을 H2 로 — F-A/H17 처방과 묶어서
  3. 본문 `<footer>` 를 `<div>` 로 (`page.tsx:542`)
- 노력: **S** · 위험: 낮음
- 관련 가설: H17

---

### F-E-03 · 검색이 ILIKE 부분일치뿐이고 QuickLinks 5개가 죽은 링크다

- 심각도: **P2**
- 판정: **확정**
- 증거 (`app/api/search/route.ts`, `components/SearchOverlay.tsx`):

  | 항목 | 실측 |
  |---|---|
  | 방식 | `ILIKE '%q%'` — FTS·pg_trgm 없음 (`:32,42,49,57`) |
  | DB 인덱스 | `to_tsvector` GIN 도 `pg_trgm` 도 **없음** (`pg_indexes` 전수) → 매 검색이 순차 스캔 |
  | 대상 컬럼 | blogs `title,content` / articles `title,content` / magazines `title` — **tags·meta_description·category 제외** |
  | 결과 수 | blogs 6 + articles 4 + magazines 3 = 최대 13, 페이지네이션 없음 |
  | 정렬 | `created_at DESC` — **관련도 점수 없음**. 제목 매치와 본문 매치가 동급 |
  | 한글 | 형태소 분석 없음. "아이들이"로 검색 시 "아이들"에 매칭 안 됨 |
  | 스니펫 | 매치 위치 무시하고 본문 앞 100자 고정 (`:68,81`) |
  | 예약발행 가드 | blogs 만. **articles 는 미발행 기사가 검색될 수 있다** (`:46-51`) |
  | 에러 처리 | `catch { setResults([]) }` — 에러와 "결과 없음"이 구분 불가, 사용자에겐 아무 일도 안 일어난 것처럼 보임 (`SearchOverlay.tsx:82-84`) |
  | **QuickLinks** | 8개 중 **5개가 폐기된 카테고리** (`Education`/`Girls`/`Locals`/`Life`/`Travel`) → `/blog?category=…` → `VALID_CATEGORIES` 탈락 → 조용히 전체 목록 폴백 (`SearchOverlay.tsx:23-32`, `blog/page.tsx:25`) |
  | 잘 된 것 | 디바운스 300ms, 최소 2자, `role="dialog"`+focus trap+ESC, `trackEvent('search')` |
- 현재값 → 목표값: 죽은 QuickLink 5 → 0 / 검색 관련도 없음 → 제목 가중치
- 원인: 위 파일들
- 처방 후보(실행 안 함):
  1. QuickLinks 를 현행 7카테고리로 교체 — **버그 수정, 1분**
  2. 제목 매치를 상위로 올리는 2단 쿼리(제목 ILIKE 결과 먼저, 본문 결과 뒤) — 인덱스 없이도 체감이 크게 는다
  3. `blogs` 에 `to_tsvector('simple', title||' '||content)` GIN 인덱스 + `websearch_to_tsquery` — 정공법. 한국어 형태소는 `simple` 로도 부분 해결되지 않으므로 pg_trgm 병행 검토
  4. `articles` 검색에 발행 가드 추가 — **미발행 콘텐츠 노출이라 P1 성격**
- 노력: **1=S / 2=S / 3=M / 4=S** · 위험: 3번은 DDL
- 관련 가설: —

---

### F-E-04 · 본문 아래 다음 글 유도가 3중으로 겹친다 · 전환 장치는 4곳뿐

- 심각도: **P2**
- 판정: **확정**
- 증거:
  - 글 페이지 본문 아래 순서: 인포블록 → 태그 → footer(공유) → 댓글 → **Next Story**(`:588-607`) → 지난 편지 hint → 뉴스레터 CTA → **이전/다음**(`:626-701`) → **관련글 3편**(`:706-743`) → 인스타그램 피드
  - 같은 목적(다음 글로 보내기)의 블록이 3개 + 인스타 피드까지 4개가 연달아 붙는다
  - 이전/다음의 정렬 기준이 **`id`**(DB 입력 순서)다 — 날짜가 아니다 (`getAdjacentBlogs`, `:36-63`)
  - NewsletterCTA 렌더 지점 **총 4곳**: 홈 하단 · 글 상세 1회 · `/mairangi-notes` 하단 · 개별호 끝. `/blog` 목록·`/about`·`/storypress`·`/magazine`·`/gallery`·404 에는 **0회**
  - `InlineSubscribeCTA`(본문 중간 CTA) — **import 0건, 데드 컴포넌트**
  - `StoryPressSection` — **import 0건, 데드 컴포넌트**
  - `InstagramFeed` 는 `instagramUrl` 이 비어도 무조건 렌더 + `/api/instagram` fetch (`:36-44`)
  - 트래킹 미부착: 인스타 팔로우 버튼 2개, 홈 기둥 셀, 관련글·Next Story·이전/다음 링크, AI Insight 버튼
- 현재값 → 목표값: 하단 유도 블록 3~4 → 1~2개로 정리, 본문 중간 CTA 1개 부활
- 원인: 위 파일들
- 처방 후보(실행 안 함):
  1. Next Story 와 이전/다음을 하나로 합치고, 관련글은 유지 — 스크롤 깊이 대비 밀도가 정상화된다
  2. 이전/다음 정렬을 `date` 기준으로 (`:36-63`) — 버그 성격
  3. `InlineSubscribeCTA` 를 본문 50% 지점에 부활 — `SUBSCRIBE_GROWTH.md:163-175` 의 계획이 그대로 남아 있다. 구독 15명이면 시도 가치가 있다(Q8-⑤)
  4. 미부착 트래킹 4종 추가 — 개선 효과를 재려면 필요(§G)
- 노력: **S~M** · 위험: 낮음
- 관련 가설: —

---

### F-E-05 · IA 3중 불일치 — Nav 4메뉴 / 4기둥 / 7카테고리가 서로 다른 축

- 심각도: **P2**
- 판정: **확정**
- 증거: → `04-content.md` F-D-04 에 전체 표. 요약:
  - Nav: About · Journal · Magazine · StoryPress (`Navigation.tsx:10-15`) — Gallery 는 Footer 에만
  - 기둥: StoryPress · Aotearoa · Home Learning · Whānau (`lib/pillars.ts:4-29`) — "Aotearoa" 는 어느 목록에도 없는 제3 라벨
  - 카테고리 7종 — **Local Guide 는 기둥 없음**(`lib/pillars.ts:2` 주석이 명시적 제외)
  - 홈 기둥 셀 링크가 카테고리가 아니라 **최신 글 1편**으로 간다 (`app/(public)/page.tsx:406`)
  - 카테고리 라벨 한글 병기 **없음**
  - 모바일 메뉴가 `NAV_LINKS` 하드코딩을 써서 DB `navigationItems` 를 무시 → 데스크탑과 달라질 수 있다 (`Navigation.tsx:211` vs `:145`)
  - `not-found.tsx` 2종 존재하나 **둘 다 검색창·인기글·카테고리 링크 없음** — 회복 경로가 홈 버튼 하나
- 처방 후보(실행 안 함): F-D-04 처방 2·3번과 동일 작업 + 404 에 인기글 3편·검색 진입점 추가
- 노력: **S~M** · 위험: 낮음
- 관련 가설: H9

---

## E5. 접근성 도구 실행 결과

| 도구 | 결과 |
|---|---|
| Lighthouse accessibility (axe-core 기반) | 12개 리포트, 점수 90~96. 실패 감사: `color-contrast`(12/12) · `label-content-name-mismatch`(12/12) · `button-name`(blog 2) · `heading-order`(home 2, magazine 1) |
| `npx @axe-core/cli` | **실행 실패** — chromedriver 세션 생성 오류. Lighthouse 의 axe 결과로 대체했다. |

## E7. DESIGN_RULES 대조

`design-rules-audit` 스킬은 실행하지 않았다(코드 수정 없이 읽기만 하는지 확인되지 않아 §2-1 을 지켰다). 대신 코드 직접 대조로 아래 위반을 확인했다:

| 규칙 | 위반 | 위치 |
|---|---|---|
| §6.2 색상 하드코딩 금지 | 본문 링크 `#4F46E5`, 콜아웃 `#EEF2FF` | `globals.css:890, 975` |
| §6.3 인디고는 AI Insight·인터랙티브 전용 | 본문 링크에 인디고 사용 | `globals.css:890` |
| §13.2 Footer 배경 `#000` | `#111111` | `Footer.tsx:93` |

**규칙 변경 제안(코드가 아니라 규칙서를 바꿔야 하는 것):**

| 규칙 | 문제 | 제안 |
|---|---|---|
| §6.1 `--text-tertiary: #9CA3AF` | 흰 배경 대비 **2.54:1** — WCAG AA(4.5) 미달, 대형텍스트 기준(3:1)도 미달 | 값을 `#6B7280` 급으로 상향. 지금은 규칙서를 지킬수록 접근성이 나빠진다 |
| §5.4 읽기 폭 | `--text-max: 680px` 를 정의해 두고 글 페이지는 720 하드코딩 | 하나로 통일 |
