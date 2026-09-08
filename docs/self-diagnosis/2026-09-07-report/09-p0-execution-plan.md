# P0 실행 플랜 (2026-09-08 작성)

`00-summary.md` 의 P0 6건을 실행 단위로 쪼갠 것. **아직 아무것도 실행하지 않았다.**

CLAUDE.md 규칙 12(1대화=1기능)를 따라 **작업 하나 = 대화 하나**로 잡았다. 각 작업의 Done 은 규칙 11(build 통과 + `tsc` 에러 0 + UI 면 3화면) + 규칙 13(`/code-review`·`/verify` 명시 실행)을 포함한다.

---

## 0. P0 6건의 성격 구분

| id | 성격 | 조치 |
|---|---|---|
| F-B-01 | **기준선** — "주제 쿼리 SERP 0건, 유기 유입 6일 21건" | 처방 대상이 아니다. 나머지 5건의 **성과 측정 지표**로 쓴다 |
| F-B-02 | 사용자 콘솔 작업 | 코드 변경 0. **Q2 답변 = 작업 그 자체** |
| F-A-01 | 코드 수정 | Q8-① 답변에 따라 방향이 갈림 |
| F-C-01 | 코드 수정 | 게이트 없음. 단 조사 후 **범위가 커졌다**(§3 참조) |
| F-D-01 | 스키마 + 코드 + 운영 | Q8-② 답변 필요 |
| F-D-02 | 운영 규칙 + 훅 | Q8-④ 답변 필요 |

**게이트 없이 지금 시작할 수 있는 것은 F-C-01 하나다.** 나머지 4건은 답변 하나씩에 묶여 있다.

## 게이트 맵

```
Q2  (네이버 등록 여부)   ─→ P0-1 (F-B-02)
Q8-① (1순위 독자)        ─→ P0-2 (F-A-01)  ← 방향 결정
Q8-② (제목 변경 허용)     ─→ P0-4 (F-D-01)  ← 3안 중 택1
Q8-④ (발행 게이트 허용)   ─→ P0-5 (F-D-02)  ← 2안 중 택1
(게이트 없음)            ─→ P0-3 (F-C-01)
```

---

## P0-1 · 네이버 서치어드바이저 등록 (F-B-02)

**코드 변경 없음. 사용자 작업 10분.**

| | |
|---|---|
| 선행 | Q2 답변 |
| 노력 | S (사용자) |
| 위험 | 없음 |

### 단계

1. `searchadvisor.naver.com` → 웹마스터도구 → 사이트 목록에 `https://www.mhj.nz` 가 있는지 확인
2. 없으면 등록 (`https://www.mhj.nz`, https+www, 끝 슬래시 없이)
3. 소유확인 → **HTML 태그** 방식 선택 → 즉시 통과 (`app/(public)/layout.tsx:15` 에 이미 심겨 있음, 값 `5110def7…`)
4. `요청 → 사이트맵 제출` → 경로에 `sitemap.xml` 만 입력
5. `요청 → RSS 제출` → 경로에 `feed.xml` 만 입력
6. `요청 → 웹페이지 수집` → `/`, `/blog`, `/magazine`, `/about` + 대표글 3편
   (`starting-school-in-new-zealand`, `how-to-read-a-mid-year-report`, `ncea-is-changing-no-more-levels-no-more-credits`)
7. `검증 → 사이트 간단 체크` 실행

### Done

- 사이트맵 "가져온 URL 수" ≥ 1 (반영에 며칠 걸린다)
- `검증 → 사이트 간단 체크` 에 오류 0

### 주의

이 작업만으로는 노출이 안 늘 수 있다. 네이버 웹문서 랭킹은 **제목-본문 키워드 일치**에 민감한데 지금 사이트에는 한국어 텍스트가 3편뿐이다(F-B-03). **P0-1 은 "문을 여는 것"이고, 그 문으로 들어갈 콘텐츠는 P0-2·P0-4 가 만든다.** 순서상 P0-1 을 먼저 하는 이유는 색인이 쌓이는 데 시간이 걸려서다.

---

## P0-2 · 언어 신고 정합 (F-A-01)

**Q8-① 답변에 따라 A안 / B안으로 갈린다.** 답변 전에는 착수하지 않는다.

### 조사 후 정정된 사실

보고서 작성 시점보다 상황이 낫다. 실제 `inLanguage` 분포를 다시 세었다:

| 값 | 파일 |
|---|---|
| `'en'` | `blog/page.tsx:209` · `blog/category/[slug]/page.tsx:212` · `about/page.tsx:97` · `magazine/[id]/page.tsx:164` · `media-kit/page.tsx:93` |
| `['en','ko']` | `page.tsx:278`(홈) · `storypress/page.tsx:51` |
| **`'ko'`** | **`blog/[slug]/page.tsx:252` — 단 1곳** |

즉 **사이트는 이미 대부분 `en` 이라고 말하고 있고**, 어긋나는 것은 3곳뿐이다:

1. `app/layout.tsx:104` — `<html lang="ko">`
2. `app/layout.tsx:36` — `openGraph.locale: 'ko_KR'`
3. `app/(public)/blog/[slug]/page.tsx:252` — `inLanguage: 'ko'`

`00-summary.md` 는 이걸 "3종 불일치"라고만 적었는데, **어느 쪽이 소수인지**가 플랜에서 중요하다. 소수는 `ko` 다.

### A안 — 영어로 통일 (Q8-① 이 C 또는 A/B 이되 "본문은 영어 유지"일 때)

| | |
|---|---|
| 노력 | **S** — 3줄 |
| 위험 | 낮음 |

**변경**

| 파일:행 | 현재 | 변경 |
|---|---|---|
| `app/layout.tsx:104` | `<html lang="ko">` | `<html lang="en-NZ">` |
| `app/layout.tsx:36` | `locale: 'ko_KR'` | `locale: 'en_NZ'` |
| `app/(public)/blog/[slug]/page.tsx:252` | `inLanguage: 'ko'` | `inLanguage: 'en-NZ'` |

**곁들여 볼 것 (같은 커밋에 넣을지는 선택)**
- `app/layout.tsx:26-30` 의 한국어 `description` 과 한국어 `keywords` 18개 — 이건 라이브에 안 나온다(하위 페이지가 덮어씀). 지금은 죽은 코드다. 영어로 바꾸거나 지우는 편이 낫다.
- 홈·storypress 의 `['en','ko']` 를 `'en-NZ'` 로 좁힐지 — 한국어 콘텐츠가 실제로 없으므로 좁히는 게 정직하다.
- `og:locale`·`og:site_name` 이 **라이브 137 페이지에서 전부 사라지는 문제**(하위 openGraph 가 루트를 덮어씀)는 별건이다. F-B-05 와 묶어서 처리.

**Done**
- 라이브 재크롤에서 `<html lang>` 137/137 = `en-NZ`
- `blog/[slug]` JSON-LD `inLanguage` = `en-NZ`
- `og:locale` 이 페이지에 나타나는지 확인 (안 나오면 F-B-05 로 이관)
- `npm run build` 통과 + `tsc --noEmit` 0
- `/code-review` · `/verify`

**롤백**: 3줄 되돌리기. 부작용 없음.

### B안 — 이중 언어 (Q8-① 이 A 또는 B 이고 "한국어 독자가 1순위"일 때)

| | |
|---|---|
| 노력 | **L** — feature 급 |
| 위험 | 중간~높음 |

A안을 **먼저** 한다(잘못된 신고를 고치는 것은 어느 쪽이든 옳다). 그 위에:

1. `blogs.lang` 컬럼 추가 또는 `/ko/` 서브패스 라우트 신설
2. hreflang 상호 링크 (`en-NZ` ↔ `ko`)
3. 한국어 본문 공급원 결정 — **두 가지뿐이다** (2026-09-08 확인):
   - 사람이 한국어 요약을 따로 쓴다 → 품질은 최고, 80편 부담
   - 네이버 블로그에 요약본만 배포하고 사이트는 영어 유지 → Q8-③

> **정정 (2026-09-08)**: 이 자리에 "`blogs.insight_kr` 을 SSR 로 노출하면 가장 싸다" 고 적었으나 **틀렸다.**
> - `insight_kr` 은 발행 80편 **전부 비어 있다** (`has_insight_kr = 0`, `insight_cached_at = 0`). 컬럼만 있고 데이터가 없다.
> - `components/AiInsight.tsx` 는 `'use client'` + `useState<string>('')` — **클릭해야** `POST /api/ai-insight` 를 호출한다. 서버에서 받는 prop 은 `title`·`content`·`blogId` 뿐이고 `insight_kr` 은 아예 안 넘어간다.
> - `insight_kr` 은 `BLOG_DETAIL_COLUMNS`(`lib/constants.ts:41-42`)에서 **의도적으로 제외**돼 있다 — `:34` 주석: "content_backup·insight_kr 등 비공개 컬럼이 RSC 페이로드로 HTML 에 직렬화되는 것을 막는다".
> - 라이브 실증: `raw/bot/googlebot_blog_starting-school-in-new-zealand.html` 에서 `AI Insight`(버튼) 1건 / **`AI Reflection`(본문 라벨) 0건** / `insight_kr` 0건.
>
> **한국어 본문의 공짜 공급원은 없다.** B안은 사람이 쓰거나 외부 채널로 미루는 것 중 하나이고, 어느 쪽이든 지속적 운영 부담이 붙는다. Q8-① 에서 A/B 를 고를 때 이 비용을 알고 골라야 한다.

**B안은 이 플랜에서 착수하지 않는다.** Q8-① 이 A/B 로 오면 별도 Plan Mode 로 설계한다.

---

## P0-3 · P-27 재발 해소 (F-C-01) — **지금 시작 가능**

| | |
|---|---|
| 선행 | 없음 |
| 노력 | **M** (아래 3분할 중 첫 둘만 하면 S~M) |
| 위험 | **중간** — URL 구조 변경이 섞여 있다 |

### 조사 후 드러난 것 — 17개를 한 덩어리로 다루면 안 된다

`no-store` 17개는 원인이 같지만(`searchParams`) **성격이 다르다.**

| 그룹 | URL | `?page` 의 정체 | 처리 |
|---|---|---|---|
| **A. 목록** | `/blog` (1) | 페이지네이션 | 경로 세그먼트로 이전 가능 |
| **B. 카테고리** | `/blog/category/*` (7) | 페이지네이션 | 같음 |
| **C. 매거진** | `/magazine/*` (9) | **리딩 뷰어의 현재 페이지** | ⚠ **이전 불가** — 아래 참조 |

**C 를 조심해야 한다.** 조사 중 확인한 것:

- `components/magazine/MagazineIssueDetail.tsx:284,310,330,353,380` 이 `?page=1`, `?page=2`, `?page=N` 링크를 **현재 생성한다**
- `MagazineSpreadViewer.tsx:209,269` 와 `MagazineFlipViewer.tsx:415-431` 이 `?page` 를 읽고 **클라이언트에서 갱신한다**
- `docs/handoff-2026-09-04.md` §5-4 가 "리딩 뷰어 검증 URL 에 `?page=1` **필수**" 라고 못박아 두었다

즉 `/magazine/[id]` 의 `?page` 는 레거시가 아니라 **살아 있는 뷰어 상태**다. `00-summary.md` 는 17개를 한 줄로 묶었는데, 실제로는 **A+B(8개)와 C(9개)를 나눠서 다뤄야 한다.**

### 3-1. A+B — `/blog` + 카테고리 8개 (권장, 먼저)

**목표**: `no-store` 8개 → 0, TTFB 1,438ms 대 → 200ms 대

**변경 범위 (실측)**

| 파일:행 | 역할 |
|---|---|
| `app/(public)/blog/page.tsx:18,22-24,165-166` | `searchParams` 수신 |
| `app/(public)/blog/page.tsx:38,230,236` | canonical·이전/다음 링크 |
| `app/(public)/blog/category/[slug]/page.tsx:18,26,31,161` | `searchParams` 수신 |
| `app/(public)/blog/category/[slug]/page.tsx:40,163,166,233,242` | canonical·정규화 redirect·이전/다음 |
| `components/BlogLibrary.tsx:53` | `navigateTo()` 가 `?page=N` 생성 |
| `app/sitemap.ts` | 페이지 URL 포함 여부 확인 |
| `next.config.mjs` | `?category=` 리다이렉트 맵이 `?page` 를 carry-over 함 — 재검토 |

**두 가지 안**

| | ① 경로 세그먼트 이전 | ② 1페이지만 분리 |
|---|---|---|
| 방식 | `/blog/page/2`, `/blog/category/x/page/2` 신설 + `?page=` 는 308 | `/blog` = 정적, `?page=n` 만 동적으로 남김 |
| `no-store` 해소 | **전부** | **`/blog`·카테고리 1페이지 8개** (실사용의 대부분) |
| URL 변경 | **있음** — 색인 이관 필요 | 없음 |
| 노력 | M | S~M |
| 위험 | 중간 (sitemap·내부링크·리다이렉트를 동시에 맞춰야) | 낮음 |

**②를 권장한다.** 이유: `/blog?page=2` 이후 페이지의 글은 개별 URL 로 이미 전부 색인 대상이고(sitemap 137), 트래픽도 1페이지에 몰린다. URL 이동 리스크를 지불할 만한 회수가 없다. ①은 F-A-07(페이지네이션 색인)까지 같이 정리하고 싶을 때의 선택지로 남긴다.

**②의 구현 스케치** (착수 시 Plan Mode 에서 확정)
- `/blog` 를 `searchParams` 없는 정적 세그먼트로 두고, 페이지네이션을 `/blog/page/[n]` 동적 라우트로 분리
- 또는 `generateStaticParams` + `dynamicParams` 조합으로 1페이지만 프리렌더
- 어느 쪽이든 `BlogLibrary.tsx:53` 의 링크 생성이 함께 바뀐다

**Done**
- `raw/meta-by-url.json` 재수집 → `cache_control` 에 `no-store` 인 URL 이 8개 감소
- `/blog`·카테고리 7개의 `x-vercel-cache` 가 `PRERENDER` 또는 `HIT`
- TTFB 재측정 중앙값 < 400ms
- `npm run build` 라우트표에서 해당 라우트가 `ƒ` → `○`/`●`
- 3화면 확인 (목록·카테고리는 카드 그리드라 CLS 0.19 문제와 같은 화면이다 — F-C-03 확인 겸)
- `/code-review` · `/verify`

**롤백**: 라우트 신설분 되돌리기. `?page=` 링크가 살아 있는 동안은 양쪽이 공존한다.

### 3-2. C — 매거진 9개

**두 가지 안**

| | ① 그대로 둔다 | ② 뷰어를 별도 경로로 분리 |
|---|---|---|
| 방식 | `/magazine/[id]` 는 동적 유지 | `/magazine/[id]` = 정적(이슈 상세), `/magazine/[id]/read?page=N` = 동적(뷰어) |
| `no-store` 해소 | 0 | **9개** |
| 노력 | 0 | M |
| 위험 | — | **중간** — 뷰어 URL 이 바뀐다. 매거진은 620×812 고정 캔버스 체제라 지면 렌더 회귀 QA 필수 (mag-unit-guard 훅 + 주간 감사 ③) |

**①을 권장한다, 지금은.** 매거진 9개는 이슈 상세 진입점이고 트래픽이 목록·글에 비해 작다. A+B 8개를 고쳐 효과를 실측한 뒤, 그때도 값이 있으면 ②를 별도 작업으로 잡는다.

### 3-3. 함수 리전 (선행: Q5-2)

`x-vercel-id` 가 `syd1::iad1::` — 엣지는 시드니, **함수는 미국 동부**다. Supabase 는 시드니. 캐시 미스마다 태평양 왕복 2회.

- Vercel `Settings → Functions → Function Region` 을 `syd1` 로 바꿀 수 있는 플랜인지 확인 필요 (**Q5-2**)
- 가능하다면 **코드 변경 0으로 P0-3 의 효과를 배가**한다. 3-1 보다 먼저 해도 된다.
- 주의: 리전 변경은 재배포가 필요하고, 다른 리전의 콜드스타트 특성이 달라진다. 배포 후 TTFB 재측정 필수.

---

## P0-4 · 제목 검색 의도 (F-D-01)

**Q8-② 답변이 3안 중 하나를 고른다.** 답변 전 착수 금지 — 두 분의 글 제목은 사용자 결정 사항이다(지시서 §2-9).

### (가) `seo_title` 컬럼 신설 — 제목을 안 건드리는 안

| | |
|---|---|
| 노력 | **M** |
| 위험 | 중간 — 마이그레이션 + 컬럼 목록 동기화 |

**단계**

1. `blogs.seo_title text` 추가 (Supabase MCP `apply_migration`)
2. `lib/constants.ts:37-42` — `BLOG_CARD_COLUMNS` 또는 `BLOG_DETAIL_COLUMNS` 에 `seo_title` 추가
   > ⚠ 핸드오프 §5-3: **없는 컬럼을 select 하면 쿼리 전체가 조용히 null 을 돌려준다.** 마이그레이션 → 컬럼 상수 → 배포 순서를 지켜야 한다. 순서가 뒤바뀌면 블로그 전체가 빈다.
3. `app/(public)/blog/[slug]/page.tsx:139` — `title: blog.seo_title || blog.title`
   (`<h1>` 과 지면 표기는 `blog.title` 그대로 — 감성 제목 보존)
4. `app/mhj-desk/blogs/_components/BlogForm.tsx` 에 입력 필드 + 30~60자 카운터
5. `app/mhj-desk/seo/page.tsx` 에 "seo_title 없음" 검사 추가
6. 운영: 조회 상위 10편부터 채운다 (한 번에 80편 하지 않는다)

**Done**: 마이그레이션 후 라이브 글 5편의 `<title>` 이 새 값 · `<h1>` 은 그대로 · 나머지 75편이 안 깨짐 · build + tsc + `/code-review`·`/verify`

### (나) 대괄호 접두를 접미로 (21편 편집)

`[Y1] 100 Days of Schhol` → `100 Days of School — Year 1 in New Zealand`
코드 변경 0, DB 편집 21건. 앞 30자에 키워드가 온다. **두 분의 문장을 바꾸는 것이라 사용자가 직접 하거나 명시적 승인이 필요하다.**
덤: `schhol` 오타도 이때 고친다(slug 는 그대로 둘 것 — 이미 색인돼 있다).

### (다) 손대지 않음

브랜드 쿼리 외 노출을 포기하는 선택. 이 경우 P0-4 를 닫고 P0-5 에 집중한다.

---

## P0-5 · 발행 템플릿 (F-D-02)

**Q8-④ 답변이 2안 중 하나를 고른다.**

### (가) 인포블록만 규격화 — **권장**

두 분의 본문에 손대지 않는다. 목록·표를 정형 삽입물(`info_block_html`)에만 넣는다.

| | |
|---|---|
| 노력 | **M** |
| 위험 | 낮음 — 다만 인포블록은 본문 타이포를 상속하지 않는다(`globals.css:772-775`). 목록·표 스타일을 새로 정의해야 한다 |

**단계**

1. 인포블록 템플릿 정의 — "핵심 3줄 요약(`<ul>`)" + 필요 시 비교표(`<table>`)
2. `globals.css` 에 인포블록 내부 `ul/ol/table` 스타일 추가 (기존 `.blog-content` 규칙과 격리돼 있어 별도 필요)
3. `.claude/skills/yussi-factory` 의 인포블록 생성 규칙에 목록 필수화
4. 적용 순서: **인포블록이 이미 있는 38편 중 조회 상위**부터 → 없는 42편
5. `app/mhj-desk/seo/page.tsx` 에 "인포블록에 목록 없음" 검사 추가

**Done**: 상위 10편의 인포블록에 `<ul>` 1개 이상 · 3화면 확인(인포블록 가독성) · `audit-seo-regression.mjs` 악화 없음

### (나) preflight 훅 강제

`blog-publish-preflight` 를 훅에 연결해 **답 먼저 문단 / H2 3개 / 목록·표 1개 / 내부링크 2개**를 못 채우면 저장 차단.

| | |
|---|---|
| 노력 | **M** |
| 위험 | **중간** — 편집 자유도를 제약한다. 두 분이 글 쓰는 리듬에 직접 영향 |

이건 (가)가 자리잡은 뒤에 하는 편이 낫다. 규칙을 먼저 만들고, 지켜지는 걸 확인한 다음 강제한다.

### 공통 — 자동화 연결 (양쪽 안 모두 필요)

스킬 3종이 훅·CI 어디에도 안 붙어 있다(`.claude/hooks/`·`.github/workflows/` grep 0건). ORPHAN 이 5→10편으로 **늘어난** 게 그 결과다.

- `internal-link-suggester` 를 발행 워크플로에 연결 → ORPHAN 재발 차단
- `llms-txt-generator` 는 F-F-02(revalidate 누락)와 함께 처리

---

## 실행 순서 제안

| 순서 | 작업 | 선행 | 노력 | 왜 이 순서인가 |
|---|---|---|---|---|
| **1** | **P0-1** 네이버 등록 | Q2 | S | 색인이 쌓이는 데 시간이 걸린다. 가장 먼저 문을 연다. 코드 변경 0 이라 다른 작업과 병렬 |
| **2** | **P0-3-3** 함수 리전 확인·변경 | Q5-2 | S | 코드 변경 0 으로 전체 TTFB 개선. 가능 여부만 확인하면 된다 |
| **3** | **P0-3-1** `/blog`+카테고리 8개 캐싱 | 없음 | S~M | 게이트가 없는 유일한 작업. 지금 시작할 수 있다 |
| **4** | **P0-2 A안** 언어 3줄 정정 | Q8-① | S | 답변만 오면 30분. B안이면 별도 Plan Mode |
| **5** | **P0-5 (가)** 인포블록 규격화 | Q8-④ | M | P0-4 보다 먼저 — 본문을 안 건드려 마찰이 적고, AI 인용 요건을 바로 채운다 |
| **6** | **P0-4** 제목 | Q8-② | M | 스키마 변경이 섞여 리스크가 가장 크다. 마지막 |

**곁들이기 좋은 것**: 3번 작업 중에 F-A-02(OG robots 차단, 1줄)·F-F-02(revalidate 누락, 몇 줄)·F-C-02(홈 LCP lazy)를 같이 넣으면 배포 1회로 P1 3건이 해소된다. 다만 CLAUDE.md 규칙 12(1대화=1기능)를 어기게 되므로, **"기술SEO 즉시패치" 라는 하나의 기능으로 묶어** 별도 대화에서 처리하는 편이 낫다.

## 측정 (F-B-01 이 기준선)

| 지표 | now | 재측정 |
|---|---|---|
| `no-store` 공개 URL | 17 | P0-3 배포 직후 |
| TTFB 중앙값 (`no-store` 그룹) | 1,438 ms | 같음 |
| `<html lang>` = `ko` | 137 | P0-2 배포 직후 |
| 목록·표 보유 글 | 0 / 80 | P0-5 단락마다 |
| 네이버 "가져온 URL 수" | 미확인 | P0-1 후 1주 |
| 유기 세션 (6일) | 21 (naver 0) | 4주 후 |
| 주제 쿼리 SERP 존재 | 0 / 3 | 8주 후 |

재측정 명령은 `06-frontend-backend.md` G3 표에 정리돼 있다. `raw/meta-by-url.json` 을 만든 크롤러를 그대로 다시 돌리면 첫 두 줄은 즉시 확인된다.

## 이 플랜에서 하지 않는 것

- **P0-2 B안(이중 언어)** — Q8-① 이 A/B 로 오면 별도 Plan Mode
- **P0-3-2 매거진 뷰어 분리** — A+B 효과 실측 후 재판단
- **P0-4 (나) 제목 21편 편집** — 두 분의 문장. 사용자가 직접 하거나 명시 승인 후
- **P0-5 (나) preflight 훅 강제** — (가) 정착 후
- **F-B-01** — 기준선이라 처방 대상 아님
