# MHJ 자체진단 지시서 — 검색 노출·콘텐츠·기술·UX 전수 조사 (2026-09-07)

> **대상 실행자**: Claude Opus, 별도 세션, `/Users/penny/MHJ_HOMEPAGE` 에서 실행.
> **성격**: **조사만** 한다. 코드·DB·설정·git 을 바꾸지 않는다. 산출물은 보고서 파일뿐이다.
> **다음 단계**: 이 보고서를 원 세션(Fable)으로 가져가 실행 플랜을 확정한다. 그래서 "처방"은 후보만 적고 실행하지 않는다.

---

## 0. 붙여넣기용 시작 프롬프트

```
docs/self-diagnosis/2026-09-07-instruction.md 를 끝까지 읽고 그 지시서대로 조사만 수행해.
코드·DB·설정·git 변경 금지. 산출물은 docs/self-diagnosis/2026-09-07-report/ 아래에만 쓴다.
지시서 §4 가설 18개는 하나도 빠짐없이 확정/기각/미확인 판정을 달고,
§7 산출물 형식을 정확히 지켜. 추정은 "추정"이라고 표시하고 실측과 섞지 마.
사용자에게 물어봐야 하는 건 진행을 멈추지 말고 07-questions-for-user.md 에 모아 둬.
```

---

## 1. 목적과 범위

**목적**: www.mhj.nz 가 네이버·구글·빙과 ChatGPT·Claude·Perplexity·Gemini 같은 AI 답변 엔진에 **지금보다 훨씬 많이, 정확하게 노출**되기 위해 무엇이 부족한지를 **실측 근거로** 밝힌다. 노출은 "검색결과 등장"만이 아니라 클릭·체류·구독·StoryPress 전환까지 포함한다.

**범위** (7개 영역, §5 에서 상세):

| 영역 | 질문 |
|---|---|
| A. 기술 SEO | 크롤링·색인·정규화·구조화 데이터가 엔진별로 올바르게 동작하나 |
| B. 엔진별 진단 | Google / Naver / Bing·Daum / AI 답변엔진(GEO) 각각에서 무엇이 막혀 있나 |
| C. 성능(CWV) | LCP·INP·CLS·TTFB 가 순위·체류에 손해를 주고 있나 |
| D. 콘텐츠 전략 | 어떤 글이 검색을 타고 어떤 글이 안 타며, 키워드·토픽·제목·구조에서 무엇이 빠졌나 |
| E. UI/UX·접근성 | 읽기 경험·탐색·전환 장치가 검색 유입을 붙잡는가 |
| F. 프론트/백엔드 | 캐싱·데이터 계층·관리자 도구가 위 개선을 뒷받침할 수 있나 |
| G. 측정 체계 | 개선 효과를 무엇으로 증명할 것인가 (기준선 확보) |

**범위 밖**: 실명 노출 P0(완료·주간 감사 가동 중), anon 권한(완료), 매거진 지면 잘림. 이 셋은 재검사하지 않는다.

---

## 2. 절대 규칙

1. **읽기 전용**. `app/ components/ lib/ scripts/ .claude/` 등 소스 수정 금지. 허용되는 쓰기는 `docs/self-diagnosis/2026-09-07-report/**` 와 그 안의 스크린샷·JSON 뿐.
2. **DB 는 SELECT 만**. Supabase MCP 는 `execute_sql` 로 SELECT/EXPLAIN 만. `apply_migration`·UPDATE·INSERT·DELETE·RPC 호출 중 쓰기 성격은 금지. 라이브 revalidate(`/api/revalidate`) 호출도 금지.
3. **git**: `git fetch`·`git log`·`git status`·`git diff` 만. commit·push·branch·stash·worktree 금지. 끝났을 때 `git status` 에 보고서 디렉터리 외 변경이 없어야 한다.
4. **빌드**: `npm run build` 는 **dev 서버가 안 떠 있을 때만** (`lsof -i :3003` 로 확인). 라우트별 정적/동적 판정과 번들 크기 측정 목적에 한해 1회 허용. 빌드 전 `find .next -mindepth 1 -delete`. 빌드 후 `.next` 는 그대로 둔다.
5. **훅 존중**: safety-gate·name-guard 등이 차단하면 우회하지 말고 보고서에 "차단됨"으로 적는다.
6. **실명 금지**: 아이들 실명·보호자 실명은 보고서에도 쓰지 않는다. 필요 시 `[아이1]` 같은 라벨. 사이트 표기(Min/Hyun/Jin, PeNnY, Yussi)는 허용.
7. **추정과 실측 분리**: 모든 수치는 "언제, 무슨 명령/도구로" 를 함께 적는다. 측정 못 한 항목은 "미측정(이유)" 로 남기고 지어내지 않는다.
8. **외부 요청은 절제**: 라이브 사이트 curl 은 URL 당 UA 별 1회, 동시 5개 이하. PageSpeed API 는 URL 당 mobile/desktop 각 1회. 봇 UA 로 관리자 경로(`/mhj-desk`, `/api/*`)를 두드리지 않는다.
9. **콘텐츠 수정 제안은 목록·처방까지만**. 두 분의 글은 사용자 결정 사항이다.
10. 사용자에게 질문이 생겨도 **멈추지 말고** `07-questions-for-user.md` 에 적고 다른 항목을 계속한다.

---

## 3. 착수 전 반드시 읽을 것 (이미 있는 자산 — 다시 만들지 말 것)

| 읽을 것 | 이유 |
|---|---|
| `CLAUDE.md` | 규칙·스택·훅. 규칙 2(캐싱)·11(빌드)·13 은 이번에도 적용 |
| `docs/handoff-2026-09-04.md` §0·§3·§4·§5 | 현재 상태, 도구 인벤토리, 지뢰밭(감사 위음성 3종 포함) |
| `docs/seo-audit-2026-09-03.md` | 콘텐츠 SEO 최신 실측(79편: THIN 36·ORPHAN 10·NO_H2 6·H2=0 11). **재계산하지 말고 인용**. 필요하면 `node --env-file=.env.local scripts/audit-seo-regression.mjs` 1회로 현재치만 확인 |
| `.claude/skills/seo-audit-runner/SKILL.md` | 판정 기준의 정의(대상 컬럼·`\y` 함정). 새 지표를 만들 때 이 기준과 충돌하지 않게 |
| `docs/stack-and-tooling-review-2026-07-11.md` §1 | 이미 내린 결론: "JSON-LD > llms.txt", INP 가 최다 실패 지표, Next 16 업그레이드 비긴급 |
| `docs/nextjs-15-upgrade-plan.md` | 이미 15.5 로 올라와 있다. 남은 항목만 확인 |
| `docs/naver-search-advisor-setup.md` | 네이버 등록 가이드(2026-07-12). **실제 등록됐는지는 미확인** — §6 질문 |
| `docs/traffic-snapshot-2026-07-31.md` | 조회수 기준선. 정보형 > 에세이형 관측 |
| `docs/ARCHITECTURE.md` §3(캐싱·P-27)·§7(SEO) | 데이터 계층 규칙 |
| `docs/DESIGN_RULES.md`·`docs/DESIGN_SYSTEM.md` | UX 판정 기준. 이 문서와 어긋나는 제안은 "규칙 변경 제안"으로 따로 표시 |
| `docs/archive/mhj-seo-patch-2026-05-30/README.md` | 5월 SEO 패치 Phase A1~A6 의 의도. 무엇이 "이미 시도됐는지" |
| `docs/archive/MHJ_ROADMAP.md`·`SUBSCRIBE_GROWTH.md`·`content-proposal-v2-2026-06-21.md` | 과거 전략 문서. 폐기된 것과 살아 있는 것을 구분해 보고서 §D 에 반영 |
| `.github/workflows/site-audit.yml` | 주간 감사 10종. 이번 조사에서 새로 제안하는 검사는 이 목록과 중복되면 안 된다 |

**이미 있는 것 요약(재확인만)**: robots.ts(AI 봇 14종 명시 allow), sitemap.ts(1h ISR, 135 URL), llms.txt·llms-full.txt·feed.xml, 전 공개 페이지 JSON-LD(BlogPosting·BreadcrumbList·Organization·Person·FAQPage 등 26종), Google·Naver·Bing 소유확인 메타, `/api/og` 폴백, `lib/indexnow.ts`, `@vercel/analytics`·`speed-insights`, `page_events` 자체 수집(2026-09-02~), `mhj-desk/seo` 패널 + `ai-seo`(Haiku 로 한국어 meta description 생성).

---

## 4. 사전 가설 18개 — 전부 판정할 것

원 세션이 코드를 훑으며 세운 가설이다. 각 항목에 **확정 / 기각 / 미확인(이유)** 와 **근거(명령·파일:행·수치)** 를 단다. 확정된 것은 §7 finding 으로 승격한다.

| # | 가설 | 근거 단서 | 검증 방법 |
|---|---|---|---|
| H1 | **폰트 로딩이 렌더 차단**. `app/globals.css:8` 의 `@import` 로 Google Fonts 3패밀리(Noto Sans KR 4웨이트·Playfair 6·Caveat 2) + `next/font` Inter = 4패밀리. 한글 Noto 는 서브셋 없이 크다 | globals.css:8, layout.tsx:2·107 | PSI/Lighthouse 의 render-blocking·font-display 항목, 네트워크 워터폴(Playwright `page.on('request')`)에서 CSS→font 체인 시각, 폰트 총 전송량 |
| H2 | **제목 언어 불일치**. 글 제목·H1·카테고리는 영어(“Fearless Four”, “Little 15 Mins”), 본문·meta description·`lang="ko"` 는 한국어. 한국어 검색 의도를 담은 키워드가 title/H1 에 없다 → 구글은 title 재작성, 네이버는 관련성 저평가 | seo-audit TITLE_SHORT 다수, layout.tsx:104 | 79편 title 의 한글 포함 비율, title 에 GEO/주제 키워드 포함 비율, 상위 조회 10편의 title 형태 비교. GSC 데이터 오면 노출 쿼리 언어와 대조 |
| H3 | **갱신 신호 부재**. `blogs` 에 `updated_at` 없음 → sitemap `lastModified` 와 BlogPosting `dateModified` 가 모두 `created_at` | DB_SCHEMA blogs, sitemap.ts, blog/[slug]/page.tsx:232-233 | 코드 확인 + 라이브 sitemap 의 lastmod 분포. `date`(text) 와 `created_at` 불일치 건수도 SELECT 로 |
| H4 | **레거시 카테고리 URL 이 2-hop 308**. `?category=` → `/blog/category/x?category=` → 정리 | next.config.mjs 주석 | `curl -sIL` 로 hop 수·상태코드 실측. 이 URL 이 외부/색인에 아직 남아 있는지(WebSearch `site:mhj.nz inurl:category`) |
| H5 | `/blog/tag/` 가 robots disallow + noindex 동시 적용 → noindex 를 크롤러가 볼 수 없어 URL 만 색인되는 "Indexed, though blocked" 가능 | robots.ts, blog/tag/[tag]/page.tsx | 태그 페이지 메타 확인, WebSearch `site:mhj.nz/blog/tag` |
| H6 | `lib/indexnow.ts` 가 발행 경로에 연결돼 있지 않다(있어도 Bing·Yandex 만 수신, 네이버·구글은 IndexNow 미지원) | lib/indexnow.ts 존재, 호출처 미확인 | `grep -rn indexnow app lib` + 발행 핸들러(`mhj-desk/blogs`)·`api/revalidate` 흐름 추적 |
| H7 | **네이버 서치어드바이저 실제 등록·사이트맵·RSS 제출이 안 됐거나 상태 미확인** | 가이드 문서만 존재, 핸드오프에 완료 기록 없음 | 코드로는 확인 불가 → §6 질문. 대신 `curl -A "Yeti/1.1"` 로 Yeti 가 받는 HTML 완전성만 실측 |
| H8 | **Vercel 봇 보호/WAF 가 AI 크롤러를 차단·챌린지**할 가능성 | 확인된 바 없음 | §5-B4 UA 프로브: 상태코드·본문 크기·`x-vercel-*` 헤더·챌린지 HTML 유무 비교 |
| H9 | THIN 46%·ORPHAN 13% 는 글별 결함이 아니라 **글 템플릿의 부재** 문제(답 먼저 문단·H2·FAQ·관련글·인포블록이 규격화되지 않음) | seo-audit 정체 추세, `blog-publish-preflight` 스킬 존재 | 상위 조회 10편과 하위 10편의 구조(첫 100단어 내 답/키워드, H2 수, 링크 수, 인포블록 유무) 비교표 |
| H10 | **영어 쿼리 대응 부재**. 키워드에 "Korean family Auckland" 를 넣었지만 본문은 한국어, hreflang·영문 요약 없음 | layout.tsx:26-30, `inLanguage: 'ko'` | 영문 쿼리 SERP 프로브(§5-D2), 영어 요약/번역 장치 유무 |
| H11 | **GA4·Search Console 데이터가 코드/레포에 없다**. `lib/analytics.ts` 는 `window.gtag` 를 가정하지만 GA 스크립트 로드 여부 불명, `@next/third-parties` 설치만 | analytics.ts, package.json | layout 에서 `GoogleAnalytics` 사용 여부, 라이브 HTML 에 gtag 존재 여부, Vercel Analytics 이벤트 목록, `page_events` 스키마·수집량 |
| H12 | **저자 엔티티가 약하다**. BlogPosting.author 가 `/about` 의 Person `@id` 와 연결되지 않고, 자격(기자 출신·사회복지학 석사)이 글 페이지에 노출되지 않음 → E-E-A-T·AI 인용 신뢰 손실 | page.tsx:235, about/page.tsx | 두 페이지 JSON-LD 의 `@id`·`sameAs`·`jobTitle`·`knowsAbout` 대조, 글 페이지 저자 박스 유무 |
| H13 | `middleware.ts` matcher 가 `/mhj-desk`·`/internal` 로 한정돼 공개 경로 TTFB 에는 영향 없음 (**기각 예상** — 확인만) | middleware.ts:59-61 | 코드 확인 + 공개 URL 응답 헤더에 middleware 흔적 없음 |
| H14 | **홈 LCP 요소가 클라이언트 캐러셀**(`HeroCarousel`, `sizes="100vw"`, 첫 슬라이드만 priority) → 모바일에서 과대 이미지·지연 | HeroCarousel.tsx:105-108 | PSI LCP 요소 식별, 실제 전송된 이미지 폭 vs 뷰포트, 캐러셀이 hydration 전에 그려지는지 |
| H15 | meta description 폴백이 **본문 앞 160자 그대로**라 문장 중간에서 끊기고 키워드가 앞에 없다 | page.tsx:131-132 | `meta_description IS NULL` 건수는 0 이지만(감사) 실제 문장 품질: 79편 description 의 길이 분포·첫 30자 키워드 포함율·중복 건수 |
| H16 | **OG 이미지 68% 가 자동 폴백** → SNS·네이버·카카오 미리보기 CTR 손실, 이미지 검색 노출 0 | seo-audit §1 | `/api/og` 출력 실물 확인(폰트·한글 깨짐·캐시 헤더), 네이버가 og:image 를 어떻게 쓰는지 기준 |
| H17 | **홈 `<title>` "MHJ — my mairangi" 가 검색 의도를 전혀 담지 않음**. 브랜드 인지도 없는 상태에서 홈이 어떤 쿼리로도 못 뜬다 | layout.tsx:22 | 홈 title/description/H1 실측, 브랜드 쿼리("mhj.nz", "my mairangi journal") SERP |
| H18 | **Vercel 리전 vs Supabase 리전 vs 독자 위치(NZ·KR)** 가 어긋나 TTFB 손실 | 미확인 | 응답 헤더 `x-vercel-id` 의 리전 코드, Supabase 프로젝트 리전(`get_project`), 캐시 MISS 시 TTFB 실측 |

---

## 5. 진단 영역별 체크리스트와 명령

각 항목은 **측정 → 판정 → 처방 후보** 순으로 기록한다. 명령은 예시이며, 같은 것을 더 정확히 재는 방법이 있으면 그것을 쓰고 명령을 적는다.

### A. 기술 SEO (크롤링·색인·정규화·구조화 데이터)

A1. **엔드포인트 건강** — `node scripts/audit-endpoints.mjs` 1회. 통과하면 인용만.
A2. **정규화**: `http://mhj.nz`, `http://www.mhj.nz`, `https://mhj.nz`, 대문자 경로, 끝 슬래시, `?utm=` 붙은 URL 이 각각 몇 hop 으로 어디로 가는지 (`curl -sIL -o /dev/null -w '%{url_effective} %{http_code}\n'`). canonical 이 self 인지 라우트 유형별(홈·목록·카테고리·페이지네이션 `?page=2`·글·매거진·태그) 실측.
A3. **페이지네이션**: `/blog?page=2`, `/blog/category/x?page=2` 의 title·canonical·noindex·JSON-LD. 중복 title 여부.
A4. **sitemap 품질**: URL 수, lastmod 분포(H3), 매거진 기사 URL 이 실제 200 인지 표본 10개, 이미지 sitemap 부재 여부, 뉴스레터(`/mairangi-notes/[issue]`)·갤러리 포함 여부 및 그 페이지들의 색인 가치 판단.
A5. **robots 실효성**: 라이브 `/robots.txt` 원문 저장. `/go/`·`/api/`·`/blog/tag/` 차단이 의도와 맞는지. `Disallow: /api/` 가 `/api/og` 이미지 fetch 를 막아 **OG 이미지 크롤이 차단되는지** 확인(구글·네이버·카카오 스크래퍼는 robots 를 따르는 경우가 있다).
A6. **구조화 데이터 유효성**: 라우트 유형별 대표 URL 7개의 JSON-LD 를 추출해 저장하고, 필수 필드 누락(BlogPosting: headline·image·datePublished·dateModified·author.@id·publisher.logo·mainEntityOfPage), `@id` 연결(BlogPosting.author ↔ Person, publisher ↔ Organization), `sameAs` 유무, FAQPage 가 실제 보이는 Q&A 와 일치하는지. 가능하면 Claude Browser 로 Google Rich Results Test 또는 validator.schema.org 결과 스크린샷.
A7. **메타 태그 전수**: 79편 + 정적 페이지의 `<title>`·description·og:*·twitter:*·canonical·`article:published_time` 을 curl+cheerio 로 수집 → `06-measurements.json` 에 저장. 중복 title/description 건수, 길이 분포, 한글 포함 여부(H2·H15·H17).
A8. **JS 없이 보이는 본문 비율**: 대표 글 5편에 대해 `curl -s URL` 의 HTML 에서 `<article>` 텍스트 단어 수 vs Playwright 렌더 후 단어 수. RSC 페이로드에만 있고 HTML 에 없는 부분이 있으면 P1.
A9. **hreflang·언어**: `lang`, `inLanguage`, 영어 콘텐츠의 존재 여부(H10).
A10. **404·410·soft-404**: 삭제 글·잘못된 slug·`/blog/category/없는것` 의 상태코드와 페이지 내용. `not-found.tsx` 가 200 을 돌려주지 않는지.

### B. 검색엔진별 진단

**B1. Google**
- WebSearch 로 `site:mhj.nz` 결과 수(대략), `site:mhj.nz/blog/tag`, `site:mhj.nz inurl:category=`, 브랜드 쿼리 3종.
- §D2 의 쿼리 세트로 SERP 존재 여부(상위 20 안/밖)를 기록. 경쟁 도메인 상위 5개를 쿼리별로 적는다.
- Google Discover 요건: `max-image-preview:large` ✅ 확인, 대표 이미지 폭 ≥1200px 비율(SELECT `image_url` → 실제 픽셀 폭은 표본 15개 HEAD/다운로드로).
- Search Console 은 코드로 못 본다 → §6 에 정확한 내보내기 요청을 적는다.

**B2. Naver**
- 네이버는 등록·제출 없이는 사실상 색인하지 않는다. 등록 상태는 §6. 코드 쪽에서 볼 것:
  - `curl -A "Mozilla/5.0 (compatible; Yeti/1.1; +https://naver.me/spd)"` 로 홈·목록·글 3종의 상태코드·본문 크기·`<title>`·description·og:image 가 정상 HTML 에 있는지(Yeti 는 JS 렌더링을 신뢰하지 않는다).
  - 네이버가 보는 필수 신호: `<meta name="naver-site-verification">` 존재, RSS(`/feed.xml`) 의 item 수·`pubDate`·본문 포함 여부(요약만인지 전문인지), `<html lang="ko">`, 페이지 내 **발행일·저자가 텍스트로 보이는지**, 한글 텍스트 비율.
  - 네이버 웹문서 랭킹은 사이트 신뢰도(등록·꾸준한 갱신·RSS)와 제목-본문 키워드 일치에 민감하다 → H2 판정과 연결.
  - 네이버 자체 플랫폼(블로그·카페·포스트·인플루언서) 우선 노출 구조를 감안한 **채널 전략 질문**(네이버 블로그 요약 배포 + 원문 링크 등)을 처방 후보로 적되, 결정은 플랜 단계.
  - Claude Browser 사용이 허가되면 네이버 검색창에 §D2 한국어 쿼리 10개를 넣어 mhj.nz 노출 여부·상위 노출 유형(블로그/카페/웹문서/인플루언서)을 기록. 불가하면 §6.
- Daum/Kakao: `register.search.daum.net` 등록 여부(§6), 카카오톡 링크 미리보기용 og 태그는 A7 로 커버.

**B3. Bing·기타**
- `BingSiteAuth.xml` 존재 ✅. Bing Webmaster 등록·IndexNow 키 파일(`public/<key>.txt` 로 추정되는 `85c5569b...txt`)이 실제 `INDEXNOW_KEY` 와 일치하는지, 발행 시 호출되는지(H6).
- DuckDuckGo·Brave 는 Bing 색인 기반이라 Bing 이 곧 이들이다 — 보고서에 한 줄로.

**B4. AI 답변 엔진(GEO) — ChatGPT·Claude·Perplexity·Gemini**
- **봇 접근 프로브** (H8): 아래 UA 로 글 1편·목록 1개·홈 을 각 1회. 상태코드·본문 바이트·`<h2>` 개수·`x-vercel-cache`·`x-vercel-id`·`cf-*`/`server` 헤더·챌린지 문구 유무를 표로.
  `Googlebot/2.1`, `bingbot/2.0`, `Yeti/1.1`, `GPTBot/1.0`, `ChatGPT-User/1.0`, `OAI-SearchBot/1.0`, `ClaudeBot/1.0`, `Claude-User/1.0`, `anthropic-ai`, `PerplexityBot/1.0`, `Perplexity-User/1.0`, `Google-Extended`, `CCBot/2.0`, `Applebot-Extended`, `Bytespider`(차단 확인용), 일반 Chrome UA.
- **인용 적합성**: 대표 글 5편(조회 상위 3 + 정보형 2)에 대해: 첫 문단이 질문에 답하는가, H2 가 질문형/명사형인가, 날짜·지명·숫자·고유명사(학교급·NCEA·Term 등)가 텍스트로 있는가, 저자 자격이 페이지에 있는가, 요약 가능한 목록/표가 있는가. 점수표(0~2 × 6항목).
- **llms.txt 현황**: `/llms.txt`·`/llms-full.txt` 원문 저장, 항목 수·최신 글 반영 여부·크기·글 본문 포함 여부. 스택 리뷰 결론("SEO 기대 말 것")을 존중하되, **에이전트 인덱스로서의 정확성**만 판정.
- **실제 인용 프로브**: WebSearch 로 `"mhj.nz"` 언급 페이지, Perplexity 는 Claude Browser 허가 시 §D2 쿼리 5개를 직접 넣어 인용 출처에 mhj.nz 가 있는지 기록. ChatGPT·Claude·Gemini 는 사용자에게 §6 템플릿으로 요청.
- **엔티티 일관성**: 사이트명 표기("MHJ", "My Mairangi Journal", "my mairangi") 가 title·Organization.name·llms.txt·about·OG 에서 몇 가지 변형으로 쓰이는지 세고, 하나로 통일할 후보를 적는다.

### C. 성능 (Core Web Vitals)

C1. **PageSpeed Insights API** (키 불필요, URL 당 mobile·desktop 각 1회):
```bash
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://www.mhj.nz/&strategy=mobile&category=performance&category=seo&category=accessibility&category=best-practices" > report/psi/home-mobile.json
```
대상: `/`, `/blog`, `/blog/category/home-learning`, `/blog/starting-school-in-new-zealand`, `/magazine`, `/about`. 저장 후 `loadingExperience`(CrUX 필드 데이터 — 트래픽이 적어 없을 수 있다, 없으면 "필드 데이터 없음" 기록)와 `lighthouseResult.audits` 에서 LCP·INP/TBT·CLS·TTFB·render-blocking·unused-js·font-display·image 관련 감사만 뽑아 표로.
C2. **TTFB·캐시 적중**: sitemap 에서 표본 25 URL(유형별 섞어서)을 `curl -s -o /dev/null -w '%{http_code} %{time_starttransfer} %{size_download}\n' -H 'x-nocache: 0'` 로 2회(1회차 MISS 가능, 2회차 HIT 기대). `x-vercel-cache` 값 분포. MISS 시 TTFB 중앙값(H18).
C3. **빌드 산출물**(규칙 4 충족 시): `npm run build` 출력의 라우트 표를 그대로 보고서에 붙이고 ○/ƒ 판정과 First Load JS 를 라우트별로 기록. 공개 라우트 중 ƒ(dynamic) 인 것은 원인(`no-store`·`cookies()`·`searchParams`)을 파일:행으로.
C4. **폰트**(H1): 실제 전송 폰트 파일 수·총 KB·`font-display`, 한글 서브셋 여부. Playwright 로 `document.fonts` 상태와 FOIT/FOUT 관찰.
C5. **이미지**: 홈·목록·글 페이지에서 전송된 이미지 수·총 KB·최대 이미지의 실제 폭 vs 표시 폭, `next/image` 우회(`<img>` 직결) 건수(`lib/image-url.ts` 경유 규칙 위반).
C6. **INP 후보**: 캐러셀·검색 오버레이·테마 토글·매거진 뷰어에서 long task 유무(Playwright tracing 또는 PSI TBT).

### D. 콘텐츠 전략

D1. **현황 인용**: seo-audit 2026-09-03 표를 그대로 쓰고, `mhj_top_pages` RPC(인자 `days`,`lim`) 로 최근 N일 조회 상위 20 을 붙인다. 수집이 2026-09-02 시작이라 N 은 실제 일수로(오늘 기준 5~6일 — 표본 작음을 명시). `blogs.view_count` 누적과 함께 두 열로.
D2. **쿼리 세트와 SERP 프로브** — 아래 시드로 시작하고, Google Suggest(`https://suggestqueries.google.com/complete/search?client=firefox&hl=ko&q=<쿼리>`)로 각 시드의 자동완성 10개를 붙여 확장. 확장 결과는 `06-measurements.json` 의 `keyword_universe` 에.
   - 한국어(정보형): 뉴질랜드 초등학교 입학 / 뉴질랜드 학교 성적표 보는법 / 뉴질랜드 Year 7 / NCEA 개편 / 뉴질랜드 홈스쿨링 / 뉴질랜드 학교 도시락 / 오클랜드 노스쇼어 학교 / 오클랜드 한인 가족 / 뉴질랜드 이민 가족 블로그 / 뉴질랜드 도서관 이용 / 오클랜드 아이와 갈만한 곳 / 뉴질랜드 텀 방학 / 뉴질랜드 초등 리딩 / 마타리키 / 마이랑이 베이
   - 영어: starting school in New Zealand Korean family / Korean family Auckland blog / North Shore Auckland Korean / NCEA changes 2026 explained / Year 7 intermediate NZ what to expect
   - 각 쿼리에 대해: Google 상위 20 내 mhj.nz 유무·순위·URL, 상위 5 도메인, 결과 유형(블로그/커뮤니티/정부/뉴스). 네이버는 B2 참고.
D3. **제목·H1·첫 문단 분석**(H2·H9): 79편에 대해 SELECT 로 title, 첫 100단어(HTML 제거), H2 목록을 뽑아 → 한글 title 비율, title 에 D2 키워드 계열 포함 비율, 첫 100단어에 GEO 키워드 포함 비율, H2 가 질문형인 비율. 상위 조회 10 vs 하위 10 비교표.
D4. **유형 분류**: 79편을 정보형(가이드·해설·리스트) / 기록형(일기·에세이) / 이벤트형 으로 휴리스틱 분류(제목·H2·숫자·목록 유무), 유형별 평균 조회·평균 단어수·ORPHAN 율. 정보형이 검색을 탄다는 7/31 관측을 재확인.
D5. **토픽 지도**: `lib/pillars.ts` 4기둥 + Local Guide 별 글 수, 각 기둥의 허브(카테고리 페이지)가 "허브다운지"(소개문·큐레이션·내부링크 수). 클러스터 후보(예: "뉴질랜드 초등 입학 → 성적표 → Year 7 → NCEA" 학년 축, "정착 → 안전 → 도서관 → 장보기" 정착 축)를 **기존 글 slug 로만** 구성해 빈 칸(없는 글)을 표시. 새 글 주제는 후보 목록으로만.
D6. **날짜·갱신**(H3): `date`(text) 포맷 종류와 `created_at` 과의 차이(일 단위) 분포. 발행 리듬(주당 편수, 최근 8주).
D7. **중복·카니발**: 매거진 기사(`/magazine/[id]/[slug]`)·뉴스레터 아카이브·블로그 간 같은 내용이 여러 URL 로 있는지 표본 확인. 같은 주제 글 2편 이상(카니발 후보) 목록.
D8. **이미지·캡션**: alt 존재는 감사에 있음 → **alt 품질**(파일명·"image"·빈 의미) 표본 30개 판정, `cover_caption` 71편 공백의 영향(네이버 이미지·구글 이미지 노출) 서술.
D9. **E-E-A-T 자산 목록**: 저자 소개 페이지·자격 표기·미디어킷·외부 언급(WebSearch)·인스타그램 연동·댓글/반응 — 있는 것/없는 것 표.
D10. **과거 전략 문서 대조**: archive 의 ROADMAP·SUBSCRIBE_GROWTH·content-proposal 에서 "하기로 했는데 안 한 것" 을 뽑아 재평가(유효/폐기 권고).

### E. UI/UX·접근성

E1. **스크린샷 세트**: Playwright 로 `/`, `/blog`, `/blog/category/home-learning`, 글 1편(긴 것), `/magazine`, `/about`, `/mairangi-notes` 를 375·768·1320 × light·dark 로 촬영해 `report/screens/` 에 저장(파일명 `route-width-theme.png`). 기존 `scripts/visual-diff.mjs`·`playwright_script.mjs` 가 있으면 참고만 하고 새 스크립트는 report 디렉터리 안에 둔다.
E2. **읽기 경험(글 페이지)**: 본문 폰트 크기·줄 높이·한 줄 글자 수(DESIGN_RULES §5.4 기준)·문단 간격·이미지 폭·인포블록 가독성·다크 대비비(WCAG AA) 실측값. 목차(TOC)·읽는 시간·발행일/갱신일·저자 박스·관련글·다음 글·공유·댓글·반응·구독 CTA 의 **유무와 위치**를 표로.
E3. **탐색 구조(IA)**: 내비게이션 항목 vs 4기둥 vs 7카테고리(영어명) 의 불일치, 카테고리 라벨 한글 병기 여부, 검색 진입점, 푸터 링크, 빵부스러기 가시성, 404 페이지 품질, 빈 결과 상태.
E4. **검색 품질**: `/api/search` 구현(ILIKE? FTS? 한글 토크나이징?) 코드 확인 + 쿼리 10개("성적표", "도시락", "NCEA", "도서관", 오타 1개 등) 결과 관련성 판정.
E5. **접근성**: PSI accessibility 점수 + 가능하면 `npx --yes @axe-core/cli https://www.mhj.nz/blog/<slug>` 위반 목록(심각도별 건수). 포커스 링·스킵 링크·이미지 alt·랜드마크·터치 타깃.
E6. **전환 장치**: 뉴스레터 CTA·StoryPress 배너·인스타 피드가 **어느 위치·몇 번** 노출되는지, 스크롤 깊이 대비 과도한지. 전환 이벤트가 측정되는지(G 와 연결).
E7. **DESIGN_RULES 대조**: `.claude/skills/design-rules-audit` 가 읽기 전용으로 실행 가능하면 1회 실행해 위반 목록만 인용. 규칙 자체를 바꿔야 개선되는 항목(예: 카드 정보량, 제목 상한)은 "규칙 변경 제안"으로 분리.
E8. **벤치마크(선택)**: 에디토리얼 가족/이민 블로그 3곳(예: 뉴질랜드 한인 커뮤니티 매체 1, 영어권 패밀리 매거진 1, 국내 육아 정보 매체 1)의 글 페이지 구조를 같은 표(E2)로 채워 비교. 이름·URL 을 적고 스크린샷은 저장하지 않는다(저작권).

### F. 프론트엔드·백엔드

F1. **스택 갭**: `package.json` 실측 버전 vs 현재 stable(Next·React·Tailwind·TipTap·Supabase SSR). `docs/nextjs-15-upgrade-plan.md` 잔여 항목. 업그레이드가 SEO/성능에 주는 실익을 항목별로(예: Next 16 의 캐시 컴포넌트, 이미지 최적화 변경).
F2. **데이터 계층·캐싱**: 공개 라우트별 사용 클라이언트(`supabase` / `createPublicAdminClient` / `supabaseNoCache`)와 `revalidate`·태그 사용 현황 표. 발행 핸들러가 revalidate 하는 경로 목록에 `/sitemap.xml`·`/feed.xml`·`/llms.txt`·카테고리·홈이 모두 있는지. C3 의 ƒ 라우트와 대조.
F3. **DB**: `execute_sql` 로 `pg_indexes`(blogs·articles·magazines·page_events), 공개 쿼리의 `EXPLAIN (ANALYZE, BUFFERS)` 3종(목록·글·검색), 테이블 행수·크기, FTS 인덱스 유무. `updated_at`·`seo_title`·`focus_keyword`·`faq_json`·`noindex`·`canonical_override`·`related_slugs` 같은 **SEO 운영 컬럼의 부재 목록**.
F4. **관리자 SEO 도구**: `app/mhj-desk/seo/page.tsx`·`api/ai-seo` 가 지금 해 주는 것(한국어 meta description 만)과 못 해 주는 것(제목 제안·키워드·내부링크 추천·OG 이미지 생성·네이버용 요약·영문 요약). `blog-publish-preflight`·`internal-link-suggester`·`llms-txt-generator` 스킬이 실제 워크플로에 붙어 있는지.
F5. **API 노출·안전**: `/api/search`·`/api/view`·`/api/track`·`/api/og`·`/api/ai-insight` 의 rate limit·캐시 헤더·비용. `/api/og` 응답의 `cache-control`. 보안 헤더(`curl -I`: HSTS·CSP·X-Frame·Referrer-Policy) — 보안 자체가 아니라 **크롤러·미리보기 호환성** 관점으로만 판정.
F6. **인프라 지리**(H18): Vercel 리전, Supabase 리전, Storage 이미지 CDN 경로. NZ·KR 독자 관점 TTFB 추정.
F7. **RSS·뉴스레터**: `feed.xml` 전문/요약 여부, `mairangi-notes` 아카이브의 색인 가치, 구독 폼의 이벤트 측정.

### G. 측정 체계

G1. **현재 측정 도구 인벤토리**: Vercel Analytics(이벤트 목록), Speed Insights(활성?), `page_events`(스키마·일 수집량·RPC), `view_count`, GA4(H11), Search Console·네이버 서치어드바이저·Bing Webmaster(§6).
G2. **KPI 기준선 표** (값을 넣을 수 있는 것은 넣고, 없는 것은 "미측정·출처" 로): 색인 URL 수(G/N/B), 주간 오가닉 세션, 상위 10 쿼리·CTR, CWV 3지표, 구독자 수·주간 증가, StoryPress 클릭, AI 인용 관측 건수(수동).
G3. **개선 후 비교 방법 제안**: 어떤 지표를 몇 주 후 어떤 도구로 다시 재는지 — 플랜 단계에서 그대로 쓸 수 있게.

---

## 6. 사용자에게 요청할 것 (`07-questions-for-user.md` 에 아래 형식으로)

Opus 가 얻을 수 없는 자료다. **정확한 내보내기 절차**까지 적어 사용자가 5분 안에 줄 수 있게 한다.

1. **Google Search Console** (속성 `https://www.mhj.nz/`): 성과 보고서 16개월 → 쿼리·페이지·국가·기기 4탭 CSV 내보내기; 페이지 색인 생성 보고서(색인됨/제외 사유 표) 스크린샷; Core Web Vitals 보고서; 사이트맵 상태; 수동 조치·보안 문제 화면.
2. **네이버 서치어드바이저**: 사이트 등록 여부, 소유확인 상태, 사이트맵·RSS 제출 상태와 "가져온 URL 수", **수집 현황·색인 현황·검색 노출(클릭) 통계** 화면, "사이트 간단 체크" 결과.
3. **Bing Webmaster Tools**: 등록 여부, 색인 URL 수, IndexNow 수신 기록.
4. **Daum 검색등록** 여부.
5. **Vercel 대시보드**: Firewall/Bot Protection/Attack Challenge 설정 화면, Analytics 최근 30일 상위 페이지·유입원, Speed Insights 실사용자 CWV.
6. **GA4** 존재 여부와 접근권.
7. **AI 엔진 수동 프로브**: ChatGPT·Claude·Gemini·Perplexity 각각에 아래 5개 질문을 넣고 답변에 mhj.nz 인용이 있는지 캡처 —
   "뉴질랜드 초등학교 입학 준비 한국 가족 경험담", "뉴질랜드 학교 성적표 읽는 법", "NCEA 개편 내용 한국어로", "오클랜드 노스쇼어 한국인 가족 생활", "Korean family blog about life in Mairangi Bay Auckland".
8. **전략 결정(플랜 단계에서 필요)**: ① 1순위 독자(뉴질랜드 거주 한인 / 한국 거주 예비 이민·유학 가족 / 영어권) ② 글 제목을 한글 키워드형으로 바꾸거나 병기하는 것을 허용하는가 ③ 네이버 블로그 등 외부 채널 배포 의향 ④ 주당 발행 가능 편수와 기존 글 보강에 쓸 수 있는 시간 ⑤ "노출"의 최종 목표(구독·StoryPress·광고/제휴·기록 자체).
9. §2-2 의 미회신 항목(E-1 SEO 정비 대상, E-4 cover_caption 방침)은 이번 결정과 묶어 다시 묻는다.

---

## 7. 산출물 형식 (정확히 지킬 것)

디렉터리: `docs/self-diagnosis/2026-09-07-report/`

```
00-summary.md              ← 경영 요약 + Top 12 + 핸드백 블록(아래)
01-technical-seo.md        ← §5-A
02-search-engines.md       ← §5-B (Google / Naver / Bing / AI 4절)
03-performance.md          ← §5-C
04-content.md              ← §5-D
05-ux-accessibility.md     ← §5-E
06-frontend-backend.md     ← §5-F + §5-G
06-measurements.json       ← 모든 수치의 기계가독 사본
07-questions-for-user.md   ← §6
08-hypotheses.md           ← §4 18개 판정표
psi/*.json  screens/*.png  raw/*.html|txt|json  ← 원자료
```

**finding 하나의 형식** (모든 영역 파일에서 동일):

```
### F-A-03 · OG 이미지 경로가 robots 로 차단됨
- 심각도: P1        (P0 색인·노출 자체를 막음 / P1 순위·CTR 손실 / P2 개선 여지 / P3 위생)
- 영향 엔진: Google·Naver·Kakao 미리보기
- 판정: 확정 | 추정 | 미확인(이유)
- 증거: `curl -s https://www.mhj.nz/robots.txt` → `Disallow: /api/` ; og:image = /api/og?... (raw/og-blog-xxx.txt)
- 현재값 → 목표값: 폴백 OG 54편 크롤 차단 → 0편
- 원인: app/robots.ts:41
- 처방 후보(실행 안 함): ① `/api/og` 만 Allow 예외 ② OG 를 정적 파일로 사전 생성 — 장단 한 줄씩
- 노력: S | M | L        위험: 낮음/중간/높음 (무엇이 깨질 수 있나)
- 관련 가설: H16
```

**`00-summary.md` 의 핸드백 블록** — 원 세션이 플랜을 짤 때 그대로 읽는다. 형식:

```yaml
handback:
  audited_at: 2026-09-XX
  live_sha: <git log -1 --format=%h origin/main>
  published_posts: 79
  baselines: { thin: 36, orphan: 10, no_h2: 6, h2_zero: 11, no_geo: 22, sitemap_urls: 135 }
  cwv_mobile_home: { lcp_s: , inp_ms: , cls: , ttfb_ms: , source: psi-lab|crux }
  bot_access: { googlebot: 200, yeti: 200, gptbot: , claudebot: , perplexitybot: , blocked_or_challenged: [] }
  hypotheses: { confirmed: [H1,H3,...], rejected: [H13,...], unverified: [H7,...] }
  findings_by_severity: { P0: n, P1: n, P2: n, P3: n }
  top12:            # 영향/노력 순. id · 한 줄 · 심각도 · 노력 · 엔진
    - { id: F-B-01, title: "...", sev: P0, effort: S, engines: [naver] }
  blocked_on_user: [Q1, Q2, Q7, Q8]
  suggested_tracks: [기술SEO 즉시패치, 콘텐츠 템플릿·정비, 네이버 등록·채널, GEO/엔티티, 성능·폰트, UX 글페이지, 측정체계]
```

`06-measurements.json` 최소 키: `meta_by_url[]`, `bot_probe[]`, `psi{}`, `ttfb_samples[]`, `build_routes[]`, `keyword_universe[]`, `serp_probe[]`, `title_language_stats{}`, `post_types[]`, `date_gap_stats{}`, `fonts{}`, `images{}`, `db_indexes[]`, `revalidate_paths[]`, `analytics_inventory{}`.

---

## 8. 실행 순서와 시간 배분 (총 3~4시간 상정, 병렬 허용)

1. **준비(15분)**: §3 읽기 → `git fetch origin && git log -1 origin/main` → `lsof -i :3003` → report 디렉터리 생성 → `08-hypotheses.md` 에 18개 행을 먼저 만들어 둔다(빈 판정으로).
2. **라이브 원자료 수집(45분, 병렬 가능)**: A7 메타 전수, B4 봇 프로브, C1 PSI 6 URL, C2 TTFB 25 URL, A5·A6 원문 저장. 전부 `raw/` 에 떨어뜨린 뒤 분석한다(재요청 금지).
3. **DB·코드 실측(45분)**: D3·D4·D6·F2·F3·F4. SELECT 는 한 번에 넓게 뽑아 로컬에서 가공.
4. **빌드(20분, 조건부)**: 규칙 4 충족 시 C3.
5. **SERP·키워드(30분)**: D2 + B1 + B2(브라우저 허가 시).
6. **UX(40분)**: E1 스크린샷 → E2~E6 표.
7. **판정·집필(45분)**: 가설 18개 판정 → 영역별 finding → Top 12 → 핸드백 블록 → 질문 목록.
8. **마감 점검(10분)**: `git status` 로 report 외 변경 0 확인, JSON 유효성(`node -e "JSON.parse(require('fs').readFileSync(...))"`), 모든 finding 에 증거·판정·노력 필드 존재 확인(빠진 것 grep).

Explore/general-purpose 서브에이전트를 써도 되지만 **쓰기는 리더만** 한다. 서브에이전트에게는 "읽어야 할 파일·돌릴 명령·돌려줄 표 형식" 을 명시한다.

---

## 9. 완료 조건

- [ ] `08-hypotheses.md` 에 H1~H18 전부 판정 + 근거
- [ ] 영역 파일 6개 모두 존재, finding 형식 준수, 각 finding 에 증거·판정·노력·위험
- [ ] `00-summary.md` 핸드백 블록이 유효한 YAML 이고 top12 가 12개
- [ ] `06-measurements.json` 이 파싱되고 §7 최소 키를 포함
- [ ] `07-questions-for-user.md` 에 §6 항목이 내보내기 절차와 함께 정리
- [ ] `git status` 상 변경은 `docs/self-diagnosis/2026-09-07-report/**` 뿐, DB 쓰기 0, revalidate 호출 0
- [ ] 실명 0건 (`node --env-file=.env.local scripts/audit-name-exposure.mjs` 는 라이브 대상이라 보고서 검사엔 부적합 — 보고서 파일은 `grep -rn` 으로 라벨 규칙 준수만 눈으로 확인)

끝나면 마지막 메시지에 **Top 12 와 blocked_on_user 목록만** 요약한다. 그 다음은 원 세션이 이어받는다.
