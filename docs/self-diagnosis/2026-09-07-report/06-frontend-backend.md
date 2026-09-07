# F. 프론트엔드·백엔드 + G. 측정 체계

## F1. 스택 갭

| 패키지 | 현재 | 상태 | SEO/성능 실익 |
|---|---|---|---|
| next | ^15.5.20 | 최신 15.x | Next 16 의 Cache Components(`"use cache"`)가 F-C-01(P-27)의 근본 해법이 될 수 있다. 다만 `middleware.ts`→`proxy.ts`, Turbopack 기본 전환이 따라오고 `docs/stack-and-tooling-review-2026-07-11.md:26`이 이미 **비긴급**으로 판정 |
| react / react-dom | ^19.2.0 | 최신 | — |
| tailwindcss | ^3.4.1 | v3 유지 | v4 는 SEO 실익 없음. Next 업그레이드와 묶는 것이 이미 결론(:33-35) |
| @tiptap/* | ^3.22.1 전부 정렬 | 건강 | — |
| **@next/third-parties** | **^16.2.1** | ⚠ Next 본체(15.5)와 **메이저 불일치** | GA4 로더. 현재 동작은 확인됨(gtag 로드 성공) |
| @supabase/supabase-js | 런타임 의존성 | 정상 | — |

`docs/nextjs-15-upgrade-plan.md` 잔여:

| 항목 | 상태 |
|---|---|
| `.nvmrc` / `package.json engines` | **없음** (CI 는 `node-version: 22` 고정) |
| §5 사람 눈 시각 QA | 커밋 `538957b` 가 "needs human visual QA before merge" 라고 남겼고 **완료 기록이 docs 어디에도 없다** |
| 문서 자체가 stale | `:6` "실제 업그레이드는 아직 미착수" ↔ 실제로는 2026-07-12 완료 |
| Next 16 | 전부 미착수(비긴급) |

---

## F2. 데이터 계층 · 캐싱

| 라우트 | 클라이언트 | `revalidate` | tags | 동적 유발 |
|---|---|---|---|---|
| `(public)/layout` | — (`getSiteSettings`) | 3600 | `settings` | — |
| `/` | `supabase` + `createPublicAdminClient` | 300 | — | — |
| `/about` | `supabase` | 3600 | — | — |
| **`/blog`** | `supabase` | 300 | `blogs` ✅ | **`searchParams`** |
| `/blog/[slug]` | `supabase` + `createAdminClient`(:110) + `createPublicAdminClient`(:173) | 600 | — | **`draftMode()` :125, :166** |
| **`/blog/category/[slug]`** | `supabase` | 300 | `blogs` ✅ | **`searchParams`** |
| `/blog/tag/[tag]` | `supabase` | 300 | — | — |
| `/magazine` | `supabase` | 3600 | — | — |
| **`/magazine/[id]`** | `supabase` | **없음**(layout 상속) | — | **`searchParams`** |
| `/magazine/[id]/[slug]` | `supabase` | 600 | — | — |
| `/mairangi-notes(/[issue])` | `createPublicAdminClient` | 3600 | — | — |
| `/gallery` · `/media-kit` · `/storypress` | `supabase` / 설정만 | 3600 | — | — |
| `/sitemap.xml` · `/llms.txt` · `/llms-full.txt` | `supabase` | 3600 | — | — |
| **`/feed.xml`** | `supabase` | **없음** | — | Route Handler (`s-maxage=3600` 헤더만) |

**`app/(public)/**` 에서 `createAdminClient()`(no-store) 를 쓰는 곳이 하나 있다** — `blog/[slug]/page.tsx:110` 의 preview 경로. `docs/ARCHITECTURE.md` §3.3 이 "위험 신호"로 지목한 패턴이다. `draftMode().isEnabled` 분기라 예외로 허용되지만, **`draftMode()` 자체를 조건 없이 await 한다**(`:125`, `:166`).

### F-F-01 · `/blog/[slug]` 가 조건 없이 `draftMode()` 를 호출한다

- 심각도: **P2** (현재 실측상 문제 없음 — 예방)
- 판정: **확정(코드)** / 영향은 **기각** — 라이브가 정상이다
- 증거:
  - `draftMode()` 는 Next 15 에서 `cookies()` 계열 동적 API. `generateStaticParams`(:28)와 `revalidate = 600`(:24)이 있어도 이론상 전체 SSR 강등 위험
  - **그러나 실측은 정상이다**: 빌드 출력이 `● /blog/[slug] … 10m 1y` (SSG, 80 경로 프리렌더), 라이브 글 URL 의 `x-vercel-cache` 가 **PRERENDER**, TTFB 100~640 ms, `cache-control: public, max-age=0, must-revalidate`
  - 즉 Next 15.5 가 이 패턴을 처리하고 있다. 업그레이드 시 깨질 수 있는 지점으로 기록만 해 둔다.
- 처방 후보: 지금은 없음. Next 16 검토 시 재확인 항목.
- 노력: — · 위험: —

### F-F-02 · revalidate 커버리지 구멍 — sitemap·feed·llms·카테고리·갤러리·뉴스레터

- 심각도: **P1**
- 영향 엔진: Google·Bing(색인 지연) · Naver
- 판정: **확정**
- 증거:
  - `/api/revalidate` 가 무효화하는 것: paths `['/', '/about', '/blog', '/magazine', '/storypress']`(all 일 때) + tags `['blogs','settings','magazines']` (`app/api/revalidate/route.ts:52,63-65`)
  - `BlogForm` 이 보내는 것: `['/blog/{slug}', '/', '/blog']` (`BlogForm.tsx:359`)
  - **누락**:

    | 라우트 | 결과 |
    |---|---|
    | `/sitemap.xml` | **아무도 안 보낸다.** `app/sitemap.ts:13,19` 주석이 "발행 시 paths 에 포함시켜야 함" 이라 적어 놓고 **구현이 안 됐다.** 새 글이 sitemap 에 뜨기까지 최대 1시간 |
    | `/feed.xml` | `revalidate` export 자체가 없고 CDN `s-maxage=3600` 은 무효화 불가 → 네이버 RSS 수집이 최대 1시간 늦다 |
    | `/llms.txt` · `/llms-full.txt` | 최대 1시간 |
    | `/blog/category/*` | tags 로 Data Cache 는 풀리지만 full route cache 는 남음 |
    | `/gallery` | 3600초 — 본문 이미지에서 갤러리를 만드는데 새 글 사진이 1시간 안 뜬다 |
    | `/mairangi-notes(/[issue])` | **뉴스레터 발송 경로가 revalidate 를 아예 호출하지 않는다** |
    | `/magazine/[id]/[slug]` | 매거진 저장 시 `/magazine/{id}` 만 보내고 기사 상세는 안 보냄 |
  - `revalidateTag('magazines')` 는 **소비처가 없다** — `tags:['magazines']` 를 쓰는 `unstable_cache` 가 코드베이스에 0건. 죽은 코드.
  - IndexNow 는 정상 연결(→ `02-search-engines.md` B3)
- 현재값 → 목표값: 발행 후 sitemap 반영 최대 60분 → 즉시
- 원인: `app/api/revalidate/route.ts:52` · `app/mhj-desk/blogs/_components/BlogForm.tsx:359` · `app/api/send-newsletter/route.ts`
- 처방 후보(실행 안 함):
  1. `ALL_PUBLIC_PATHS` 와 `BlogForm` paths 에 `/sitemap.xml`·`/feed.xml`·`/llms.txt`·`/llms-full.txt`·`/blog/category/{category}` 추가 — 코드 몇 줄. **가장 회수가 확실한 S 급 작업**
  2. 뉴스레터 발송 후 `/mairangi-notes` revalidate 호출 추가
  3. `revalidateTag('magazines')` 를 제거하거나 매거진 쿼리에 태그를 붙인다
- 노력: **S** · 위험: 낮음
- 관련 가설: H3, H6

---

## F3. DB

### 인덱스 (`pg_indexes` 전수)

| 테이블 | 인덱스 |
|---|---|
| blogs | pkey · slug uniq · category · **category+date(published=true)** · featured · publish_at · published · **published+date DESC** · slug · **tags(GIN)** · view_count DESC |
| articles | pkey · magazine+slug uniq · magazine · slug |
| magazines | **pkey only** |
| page_events | pkey · created_at DESC · blog_slug · source · event_type+created_at DESC |
| comments | pkey · approved · blog_id · is_admin · parent_id |
| subscribers | pkey · email uniq |
| newsletters | **pkey only** |

**공개 쿼리에 필요한 인덱스는 충분하다.** 80편 · 44 기사 · 9 매거진 규모에서 인덱스가 병목일 수 없어 `EXPLAIN (ANALYZE, BUFFERS)` 는 돌리지 않았다(§2-8 외부 요청 절제).

**FTS 인덱스 없음** — `to_tsvector` GIN 도 `pg_trgm` 도 없다. `/api/search` 의 `ILIKE '%q%'` 는 매번 순차 스캔이다(F-E-03).

### SEO 운영 컬럼 부재 목록

`blogs` 39개 컬럼에 아래가 **없다**:

| 컬럼 | 없어서 못 하는 것 |
|---|---|
| `updated_at` | 갱신일 신고 — THIN 보강 효과를 검색엔진에 알릴 수 없다 (F-A-04) |
| `seo_title` | 표시 제목과 검색 제목의 분리 (F-D-01 처방 1번) |
| `focus_keyword` | 목표 키워드 추적·감사 |
| `faq_json` | FAQPage 리치결과 — 현재 사이트 전체에 FAQPage 1개(`/storypress`)뿐 |
| `noindex` | 글 단위 색인 제어 |
| `canonical_override` | 카니발 통합 시 정규화 (F-D-05) |
| `related_slugs` | 수동 관련글·클러스터 구성 (F-D-04) |
| `lang` | 글 단위 언어 (F-A-01 처방 2번의 전제) |
| `og_image_alt` | OG 이미지 대체 텍스트 |

### 데이터 품질

| 항목 | 값 |
|---|---|
| `og_image_url` NULL / **빈 문자열** / `/api/og` 리터럴 / Storage | 0 / **55** / 4 / 21 → 감사 위음성 (F-A-03) |
| `cover_caption` 공백 | 72 / 80 |
| `info_block_html` 공백 | 42 / 80 |
| tags 없음 | 3 / 80 |
| `distinct_authors` | **1** |
| 발행/미발행 | 80 / 4 · 예약(publish_at 미래) **0** |
| `date` 포맷 | `YYYY.MM.DD.` 59 · `YYYY.MM.DD` 21 |

Supabase: `ap-southeast-2` · Postgres 17.6.1.044 · ACTIVE_HEALTHY

---

## F4. 관리자 SEO 도구

### `app/mhj-desk/seo/page.tsx` — **AI 없음, 순수 규칙 기반**

| 지금 해 주는 것 | 근거 |
|---|---|
| meta_description 누락 / 160자 초과 | `:19-23` |
| **`og_image_url` 누락** | `:27` — 단 `IS NULL` 판정이라 빈 문자열 55편을 못 잡는다 (F-A-03) |
| 제목 60자 초과 | `:32` |
| slug 한글 잔존 | `:36` |
| 태그 없음 | `:41` |
| Unsplash/Picsum 대표 이미지 | `:45` |

| **못 해 주는 것** |
|---|
| 내부 링크 0개(ORPHAN) — 정비 순서 1번인데 UI 에 없다 |
| H2 구조 · thin content · 본문 alt |
| 제목·description 중복 검사 |
| 매거진·기사·뉴스레터 (blogs 만 감사, `:74`) |
| schema/canonical/robots 검증 |
| **AI 제안 — 이 페이지는 `/api/ai-seo` 를 호출하지 않는다** |
| 페이지네이션 (`select('*')` 로 전 블로그를 브라우저로 로드, `:75`) |

### `app/api/ai-seo/route.ts`

| 항목 | 값 |
|---|---|
| 모델 | `claude-haiku-4-5-20251001` (`:17`), max_tokens 200 |
| 하는 일 | **meta description 생성 하나** — "120~155자, 핵심 키워드 앞부분" |
| 출력 언어 | **한국어** (프롬프트가 한국어 작성 지시) — 그런데 사이트 본문은 영어다(F-A-01). 실제 라이브 description 80편은 전부 영어이므로 **이 기능이 실제로는 안 쓰이거나 결과를 안 쓰는 것으로 보인다**(추정) |
| 입력 | `title` + `content.slice(0,600)` |
| 호출처 | `BlogForm.tsx:218` (SEO 페이지 아님) |

**못 해 주는 것**: 제목 제안 · 키워드 추천 · 내부링크 추천 · OG 이미지 생성 · 네이버용 한국어 요약 · 영문 요약.

### 스킬 자동화 — 전부 수동 전용

`.claude/hooks/` 7종과 `.github/workflows/` 2개를 전수 grep 한 결과 `preflight`/`internal-link`/`llms-txt-generator`/`skills/` 문자열 **0건**.

| 스킬 | 훅 | CI | 결론 |
|---|---|---|---|
| `blog-publish-preflight` | ❌ | ❌ | 수동 |
| `internal-link-suggester` | ❌ | ❌ | 수동 |
| `llms-txt-generator` | ❌ | ❌ | 수동 |

`site-audit.yml` 상단 주석이 "도구가 없어서가 아니라 아무도 안 돌려서 곪았다"고 적어 두었는데, 이 세 스킬이 정확히 그 상태다. ORPHAN 5→10 증가가 그 결과다(F-D-02).

---

## F5. API 노출 · 크롤러 호환성

지시서 §5-F5 대로 **크롤러·미리보기 호환성 관점**으로만 판정한다.

| 항목 | 값 | 판정 |
|---|---|---|
| 보안 헤더 (홈) | `strict-transport-security: max-age=63072000` 만. CSP·X-Frame-Options·X-Content-Type-Options·Referrer-Policy·Permissions-Policy **전부 없음** | 크롤러·미리보기 **차단 요소 없음** ✅ |
| `cache-control` | 정상 페이지 `public, max-age=0, must-revalidate` (ISR) / 17개는 `no-store`(F-C-01) | ⚠ F-C-01 |
| `vary` | `rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch` | 정상 |
| 봇 UA 16종 | 48/48 200, 챌린지 0 | ✅ |
| `/api/og` 캐시 | `public, max-age=31536000, immutable` | ✅ (단 robots 차단 — F-A-02) |
| `/feed.xml` | `public, max-age=3600, s-maxage=3600` | ✅ |
| `/llms.txt`·`/llms-full.txt` | `s-maxage=3600, stale-while-revalidate=86400` | ✅ |
| rate limit | `/api/comments` 만 IP 60초 쿨다운(인메모리). 나머지 **전부 없음** | 크롤러 관점 무관 |

### 범위 밖이지만 발견된 것 (보고만 — 이번 조사 대상 아님)

지시서 §1 범위 밖이나, 조사 중 드러났고 **비용·데이터 노출과 직결**되므로 기록해 둔다. 판단은 사용자·플랜 단계에.

미들웨어 matcher 가 `/mhj-desk/:path*`·`/internal/render/:path*` 뿐이라 **`/api/*` 는 전부 미들웨어 보호 밖**이고, 각 라우트가 자체 검사를 해야 한다.

| 라우트 | 관찰 |
|---|---|
| `/api/ai-seo` | 인증·rate limit 없음. 임의 `title`/`content` 를 그대로 Anthropic 에 넣는다 → 크레딧 소진 가능 |
| `/api/ai-insight` | `blog_id` 경로는 DB 재조회로 방어하지만(`:26-37`), `blog_id` 없이 `title`+`content` 만 보내면 그 방어를 우회해 Gemini 를 자유 호출할 수 있다(`:22-23,55-69`). 캐시도 안 탄다 |
| `/api/carousel*` 8개 | 전부 무인증. `carousel-v3/upload-photo` 는 Storage 쓰기 포함 |
| `/api/carousel/proxy-image` | 임의 URL fetch (`:14`) — SSRF 표면 |
| `/api/search` | `%${q}%` 를 이스케이프 없이 `ilike`. **`articles` 에 발행 가드가 없어 미발행 기사 제목·본문 100자가 노출될 수 있다**(`:46-51`) |
| `/api/view` | 무인증 service_role RPC — 조회수 임의 조작 가능(`:11-13`). `blogs.view_count` 를 기준선으로 쓰는 이 보고서의 D1 표에도 영향 |
| `/api/preview` | slug 만 있으면 `draftMode().enable()` (`:25`) — 미발행 글 열람 가능 |
| `/api/track` | 설계가 가장 견고하다 — UA 봇 필터, 이벤트 화이트리스트, source/device 서버 재산출, meta 2KB 상한, 실패해도 204. rate limit 만 없다 |

---

## F6. 인프라 지리

| 요소 | 값 | 근거 |
|---|---|---|
| Vercel 엣지 | **syd1** (Sydney) | `x-vercel-id` 48회 전부 |
| Vercel 함수 | **iad1** (Washington DC, 미국 동부) | `x-vercel-id` 둘째 세그먼트 |
| Supabase | **ap-southeast-2** (Sydney) | `get_project` |
| 예외 | `/api/og` 만 `syd1::syd1` (edge runtime) | curl |
| Storage 이미지 | `vpayqdatpqajsmalpfmq.supabase.co/storage/v1/object/public/…` → `/_next/image` 경유 | Playwright |

캐시 MISS 요청은 **시드니 엣지 → 미국 동부 함수 → 시드니 Supabase → 미국 동부 → 시드니** 로 태평양을 두 번 건넌다. NZ 독자에게 그대로 노출되고, 한국 독자는 여기에 아시아→미국 구간이 더 붙는다.

→ F-C-01 의 17개 URL 이 이 비용을 매 요청 지불한다. 함수 리전을 `syd1` 로 옮기는 것이 가장 직접적인 해법이나 **플랜 제약을 확인해야 한다**(Q5).

## F7. RSS · 뉴스레터

`app/feed.xml/route.ts`

| 항목 | 값 | 문제 |
|---|---|---|
| item 수 | **20** (`:23`) | 80편 중 20편만 |
| 본문 | `<description>` 만 — meta_description 또는 본문 앞 200자 (`:29-30`) | **요약. `<content:encoded>` 없고 네임스페이스 선언도 없다**(`:48`) → 네이버 RSS 수집이 요약만 가져간다 |
| pubDate | **`created_at`** (`:31-33`) | `date`·`publish_at` 과 다를 수 있다. 예약발행 글은 실제 공개보다 이른 pubDate |
| 이미지 | `<enclosure type="image/jpeg" length="0">` (`:43`) | `length=0` 은 RSS 2.0 위반 — 일부 리더가 첨부 무시. png/webp 도 `image/jpeg` 로 하드코딩 |
| 발행 가드 | published + publish_at ✅ | — |
| revalidate | **없음** (헤더 `s-maxage=3600` 만) | F-F-02 |

`/mairangi-notes` 아카이브 21호는 sitemap 에 있고 200 이지만 **og:image 가 전부 없다**(23개 URL). 색인 가치는 낮지 않다 — 주간 기록이 쌓인 아카이브이고 `revalidate=3600` 으로 정적이다. 다만 발송 후 revalidate 가 없어 최신호가 최대 1시간 안 보인다.

구독 폼 이벤트: `subscribe_click`·`newsletter_subscribe`·`subscribe_complete` 3종 부착됨(`NewsletterCTA.tsx:25,37,41`).

---

# G. 측정 체계

## G1. 현재 인벤토리

| 도구 | 상태 | 근거 |
|---|---|---|
| **GA4** `G-326N3JJFGN` | ✅ 가동 | `app/(public)/layout.tsx:6,64` · Lighthouse network 에서 gtag 로드 확인 |
| Vercel Analytics | ✅ | `app/layout.tsx` |
| Vercel Speed Insights | ✅ | `app/layout.tsx` — **실사용자 CWV 의 유일한 출처**(Q5) |
| `page_events` (자체) | ✅ 300행 / 6일 | pageview 102 · engagement 114 · scroll 82 · read_complete 20 |
| `blogs.view_count` | ✅ 누적 1,333 | 단 `/api/view` 가 무인증이라 조작 가능 |
| RPC `mhj_top_pages(days, lim)` | ✅ 존재 | **표본 부족으로 이번엔 사용 안 함** — 6일 102 pageview |
| Google Search Console | **미확인** | verification 토큰 2개 존재(루트 vs public 레이아웃) → Q1 |
| 네이버 서치어드바이저 | **미확인** | Q2 |
| Bing Webmaster | **미확인** | Q3 |
| GA4 이벤트 미부착 | 인스타 팔로우 2개 · 홈 기둥 셀 · 관련글/Next Story/이전·다음 · AI Insight | F-E-04 |

## G2. KPI 기준선 (2026-09-07/08)

| 지표 | 값 | 출처 |
|---|---|---|
| 발행 글 | **80** | SQL |
| sitemap URL | **137** (전부 200) | 라이브 |
| 색인 URL 수 (G/N/B) | **미측정** — `site:` 연산자로는 산출 불가 | Q1·Q2·Q3 |
| 주간 유기 세션 | **≈ 21 / 6일** (google 7 · bing 7 · ddg 7 · naver 0) | `page_events` |
| 전체 유입 구성 | direct 236 · internal 61 · 검색 21 | 같음 |
| 상위 10 쿼리 · CTR | **미측정** | Q1 |
| CWV (필드) | **없음** — CrUX 미수신 | Q5 |
| CWV (랩, LH-mobile) | 홈 LCP 9.8 s · 목록 CLS 0.19 · TBT ≤14.5 ms | `psi/lh-*.json` |
| 누적 조회 | 1,333 (평균 16.7 / 중앙 13) | `blogs.view_count` |
| 구독자 | **15** | SQL |
| 댓글 | 5 | SQL |
| StoryPress 클릭 | **미측정** — 트래킹 미부착 | F-E-04 |
| AI 인용 관측 | **미측정** | Q7 |
| 발행 리듬 | 최근 8주 7편 = **주 0.88편** | `created_at` |
| THIN / ORPHAN / NO_H2 / H2=0 / NO_GEO | 36 / 10 / 6 / 11 / 22 | SQL |
| OG 폴백 | **59** (감사식은 0으로 보고) | 라이브 + SQL |

## G3. 개선 효과 재측정 방법 (플랜 단계에서 그대로 사용)

| 지표 | 재측정 도구 | 주기 | 비고 |
|---|---|---|---|
| 색인 URL 수 | GSC 페이지 보고서 · 네이버 수집현황 · Bing | 격주 | 등록이 선행(Q1~Q3) |
| 유기 세션·쿼리·CTR | GSC 성과 CSV | 4주 후 | 지금 내보내 둔 것이 before |
| 자체 유입 | `mhj_top_pages(days=>14)` | **2026-09-16 이후** | 핸드오프 §3 계획대로 |
| CWV | Vercel Speed Insights | 4주 후 | CrUX 는 트래픽이 늘어야 생긴다 |
| TTFB / 캐시 | 본 조사의 `raw/meta-by-url.json` 재실행 | 배포 직후 | `no-store` 17개가 0이 되는지 |
| THIN·ORPHAN·H2·GEO | `node --env-file=.env.local scripts/audit-seo-regression.mjs` | 정비 단락마다 | 단락마다 `--update-baseline` |
| OG 폴백 | **감사식 수정 후**(F-A-03) 같은 스크립트 | 같음 | 지금은 0으로 나온다 |
| AI 인용 | 수동 프로브 5문항 | 8주 후 | Q7 의 템플릿을 재사용 |
| 구독·전환 | GA4 `newsletter_subscribe` + `subscribers` 행수 | 월 1회 | 트래킹 미부착분 추가 후 |
