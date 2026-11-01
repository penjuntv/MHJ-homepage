# 홈페이지·블로그 기술 총조사 (2026-10-31)

조사 범위: 사이트 구축 기술, 검색 최적화(SEO·AI 검색), UI/UX, 구독자·회원 관리, 콘텐츠 생성, 깃허브 스킬·MCP, Anthropic·OpenAI·Google 모델 현황.
방법: 분야별 조사원 4명이 웹에서 공식 문서를 우선으로 확인했고, 핵심 주장과 조사원끼리 엇갈린 것은 직접 다시 확인했다. 우리 코드와 관련된 주장은 저장소에서 직접 대조했다.
표기: 공식 = 공식 문서·블로그, [2차] = 기사·업체 블로그. "확인 못함"은 추측하지 않았다는 뜻이다.

---

## 처리 현황 (2026-10-31 같은 날 갱신)

| # | 항목 | 상태 | 근거 |
|---|---|---|---|
| 1 | Next.js 보안 패치 | ✅ 완료 — next 15.5.28 · sharp 0.35.5 · 라이브 배포 | PR #162 |
| 2 | 뉴스레터 구독취소 | ✅ 완료 — 구독자별 토큰 + `List-Unsubscribe` 원클릭 헤더, 옛 `?email=` 링크는 확인 메일로 전환, `/unsubscribe` 에서 GA 끔 | PR #163 · DB `docs/sql/subscribers_unsubscribe_token_2026-10-31.sql` · 라이브 회귀 검사 6/6 · Gmail 실메일에 헤더 도착·DKIM/SPF/DMARC pass |
| 3 | SEO 초안(ai-seo) 모델 | ✅ **Gemini 2.5 Flash 로 전환**(11-01). Haiku 5.5 교체(#164) 뒤 관리자 화면 실확인에서 500 — 운영 Vercel 에 `ANTHROPIC_API_KEY` 가 없었다. 사용자 결정으로 이미 키가 있는 Gemini 로 옮김, `@anthropic-ai/sdk` 제거. 관리자 화면에서 세 버튼 모두 200·초안 정상 | PR #164 → #167 |
| 4 | Supabase 새 키 체계 | ⏳ YuStudy 분리 Phase 4 체크리스트에 명시(12월 첫 주, 연말 폐기 전) | PR #166 |
| 6 | 라이브 감사 후속(11-01) | ✅ 주소 끝 마침표 글 404(공유 링크) 수정 + slug 형식 DB 제약(#169) · 미사용 코드 −2,450줄(#170) · SEO 작은 정비: 영어 화면 문구·404 canonical·SearchAction 제거·스키마 필드·RSS dc:creator·사이트맵 lastmod(#171). 라이브 126화면 결함 0. AVIF 는 11/21 Vercel 과금 전환 때문에 보류 | PR #169~#171 |
| 5 | Next 15.x 다음 보안 릴리스(11-03 예정) | ⏳ 11-04 10:00 NZDT 예약 작업이 확인·PR 생성(머지는 사용자 확인 후) | 예약 `mhj-next-security-patch-2026-11-04` |

## 0. 결론 한 장

**급한 것 (이번 주)**
1. **Next.js 보안 패치가 넉 달 밀려 있다.** lockfile 기준 `next 15.5.20`(2026-07-01)이고, 최신 15.x 는 `15.5.28`이다. 10-14 긴급 패치에 Critical(최고 위험) 2건이 들어 있었다. 11-03 에도 정기 보안 릴리스가 예정돼 있다.
   - 우리 코드에는 `use cache`·Server Actions 가 없어서 그 2건은 직접 해당하지 않는다(코드 확인). 이미지 최적화 SVG 취약점은 glibc 리눅스에서 우리 `sharp`(0.34.5)를 쓸 때의 문제다. Vercel 이 직접 처리하는 이미지 최적화에는 해당하지 않을 가능성이 크지만, 확인은 못했다.
   - 그래도 놓친 보안 릴리스가 5번이라 올리는 것이 맞다. Next 15 보안 지원은 **2027-01-31까지**다.
2. **뉴스레터에 `List-Unsubscribe` 헤더가 없다.** Gmail 받은편지함 위쪽에 "구독취소" 버튼을 띄우는 표시인데, `app/api/send-newsletter/route.ts:247` 에서 메일을 만들 때 넣지 않는다. 지금 규모(16명)에서는 의무가 아니다. 하지만 Gmail 이 2025-11 부터 단속을 강화했고, 넣는 비용은 작다.

**이득이 큰 것 (11월)**
3. **SEO 제목 생성 모델을 `claude-haiku-4-5` 에서 `claude-haiku-5-5` 로 바꾼다.** 입력/출력 100만 토큰당 $1/$5 → $0.10/$0.50 이다. 같은 글이 토큰으로 약 30% 더 잡혀도 비용은 약 1/7 이 된다.
   - 단, Haiku 5.5 는 생각(adaptive thinking)이 기본으로 켜져 있다. 그래서 `app/api/ai-seo/route.ts:104` 처럼 첫 블록(`content[0]`)을 답으로 읽는 코드는 깨질 수 있다. `type === 'text'` 블록을 골라 읽도록 같이 고쳐야 한다.
4. **Supabase 옛 키(`anon`·`service_role`)는 2026년 말까지 폐기된다.** 11월 YuStudy 분리 때 새 publishable·secret 키로 같이 바꾼다.

**하지 말 것**
- llms.txt 추가 작업. Google 이 공식 문서에 "쓰지 않는다"고 적었고, 대규모 분석에서도 효과가 없었다. 이미 만든 것은 그대로 두면 된다.
- AI 로 페이지 대량 생산. 올해 스팸 업데이트가 4번 있었다.
- 지금 Tailwind v4 로 옮기기.
- React Compiler 켜기.
- Search Console 의 "생성형 AI 기능에서 제외" 스위치 켜기.

---

## 1. 우리 저장소에서 직접 확인한 사실

| 항목 | 지금 | 최신 | 의미 |
|---|---|---|---|
| `next` (lockfile) | 15.5.20 | 15.5.28 / 16.4.3 | 보안 릴리스 5번을 놓침 |
| `react` | 19.2.7 | 19.3.1 | `<ViewTransition>` 이 안정판이 됨(급하지 않음) |
| `sharp` | 0.34.5 | 0.35.5 이상 권장 | SVG 원격 코드 실행 대응 |
| `@anthropic-ai/sdk` | 0.39.0 | 1.3.0 | 메이저 1판 뒤처짐 |
| `@google/genai` | 1.52.0 | 2.32.0 | 메이저 1판 뒤처짐 |
| SEO 제목 모델 | `claude-haiku-4-5-20251001` | `claude-haiku-5-5` | 비용 약 1/7 |
| AI Insight·레이아웃 모델 | `gemini-2.5-flash` | 종료 날짜 없음 | 급하지 않음 |
| 이미지 포맷 | `formats: ['image/webp']` | AVIF 추가 가능 | 약 20% 작아짐. Vercel 변환량은 늘어남 |
| 뉴스레터 헤더 | `List-Unsubscribe` 없음 | RFC 8058 원클릭 구독취소 | Gmail·Yahoo 권장(대량 발신자는 의무) |
| 구독취소 API | 이메일 주소만 알면 남도 해지시킬 수 있음 | 서명 토큰 방식 | 원클릭 헤더를 넣을 때 같이 고치면 좋음 |
| Server Actions / `use cache` | 사용 안 함 | — | 10-14 Critical 2건 중 1건, High 1건은 해당 없음 |

---

## 2. AI 모델 현황

### Anthropic
- **출시 순서** (공식 release notes): Opus 4.8(05-28) → Fable 5(06-09) → Sonnet 5(06-30) → Opus 5(07-24) → Fable 5.1(09-01) → Opus 5.5(09-22) → Sonnet 5.5(09-28) → **Haiku 5.5(10-07)**.
- **가격** (100만 토큰당 입력/출력, 공식): Fable 5.1 $10/$50 · Opus 5.5 $4/$20 · Sonnet 5.5 $2/$10 · Haiku 5.5 $0.10/$0.50(입력 10만 토큰까지). 넷 다 컨텍스트 100만 토큰, 출력 12.8만 토큰.
- **Haiku 5.5 주의점** (공식 모델 페이지, 직접 확인):
  - 생각 기능이 기본으로 켜져 있고, 생각 깊이는 `effort` 로 조절한다(기본 medium).
  - `temperature`·`top_p`·`top_k` 는 빼야 한다.
  - 토큰이 4.5 보다 약 30% 더 잡힌다.
  - 은퇴(사용 불가)는 빨라도 2027-10-07 이후다.
- **종료 일정** (공식 deprecations):
  - Haiku 4.5: 지원 중단 공지 없음. 은퇴하더라도 최소 60일 전에 이메일로 알려 준다.
  - Sonnet 4.5: 2026-11-30 은퇴. 우리 코드에는 없다.
  - Sonnet 4.6: 2027-02-17 이후 은퇴. `scripts/insert-h2-headings.mjs` 가 쓴다.
- **API 신기능** (공식):
  - Agent Skills·Files API 정식 출시(08-19)
  - 코드 실행·웹검색·웹페치 새 버전(06-11)
  - Managed Agents(Anthropic 이 대신 돌려 주는 에이전트) 예약 실행(06-09)
  - 캐시 진단(09-23), 요청 최대 128MB(10-28)
  - 새 API 버전 `2026-10-21` 과 SDK 1.0
- **Agent Skills 표준을 Linux Foundation 산하 재단에 기증했다** (Anthropic 뉴스 10-22). 스킬이 회사와 상관없는 공통 규격이 됐다는 뜻이다.
- **Claude Code** (공식 changelog, 10월분): Mods(확장 방식), hooks 동시 실행 상한(세션당 24개), Routines(클라우드 예약 실행)에서 effort 선택, 데스크톱 서브에이전트 백그라운드 실행. 5~9월분 전체 목록은 확인 못함.
- **Claude 앱**: 메모리가 항목별 저장 방식으로 바뀜(07-10) · 모든 플랜에 Artifacts 와 Design·Slides·Docs(09-16) · 플러그인 개발자 포털(09-25).

### OpenAI
- **모델** (공식 changelog): GPT-5.6(07-09) → GPT-6 Astra(09-03) → GPT-6 Sol·Luna(09-22) → GPT-6.1 Sol(09-29) → GPT-6.1 Terra(10-26).
- **가격** (100만 토큰당 입력/출력): Astra $10/$50 · 6.1 Sol $2/$10 · 6.1 Terra $1/$5 · Luna $0.10/$0.50.
- **개발자 기능**:
  - Agents API 베타(09-10)에 computer use(화면 조작) 추가(09-29)
  - Assistants API 종료(08-26)
  - Agent Builder 지원 중단 예고(06-03)
- **Codex**: 클라우드 환경·CLI 개편(DevDay 09-29) [2차]. CLI 기본 모델은 GPT-6.1 Sol [2차].
- **크롤러** (공식 bots 문서):
  - ChatGPT 검색 노출은 **OAI-SearchBot** 이 정한다. robots.txt 변경은 약 24시간 뒤 반영된다.
  - GPTBot 은 학습용이다.
  - ChatGPT-User 는 사용자가 시킨 방문이라 robots.txt 가 적용되지 않을 수 있다.
  - 광고 랜딩 페이지를 보는 **OAI-AdsBot** 이 새로 생겼다.
- **ChatGPT 광고**: 2026-02 미국 무료·Go 사용자부터 시작 [2차].
- **이미지·영상**: GPT Image 2.5(09-08). 이미지에 C2PA·SynthID 워터마크가 들어간다(공식 help). **Sora 는 2026-03-24 종료가 발표됐다.** 앱은 04-26, API 는 09-24 종료 [2차, 여러 매체 일치].

### Google Gemini
- **`gemini-2.5-flash` 는 "종료 날짜 없음"**이다(공식 deprecations, 10-22 갱신). "10월 종료"라는 2차 요약은 틀렸다.
- **가격** (100만 토큰당, 공식, 직접 확인): 2.5 Flash $0.30/$2.50 · 3.5 Flash-Lite 같은 가격 · 3.8 Flash $0.75/$3.75. 3.8 Flash 는 **2027-01-01 부터 두 배**다.
- **이미지** (공식, 1K 해상도 1장당, 직접 확인):
  - Nano Banana 2.1 / Nano Banana 2 Lite $0.034
  - Nano Banana 2 $0.067
  - Nano Banana Pro $0.134
  - 옛 Nano Banana(`gemini-2.5-flash-image`)는 2027-03-15 종료
  - (조사원 둘의 가격이 엇갈렸는데, 둘 다 맞고 서로 다른 모델이었다.)

---

## 3. 검색 최적화 (Google · AI 검색 · 네이버)

### Google
- **2026년 업데이트** (공식 상태판):
  - 코어 2번: 03-27~04-08, 05-21~06-01
  - 스팸 4번: 03월, 06월, 08월, 09-24~10-07(13일, 올해 가장 김)
  - Discover 전용 코어(02월, 미국 영어만): 현지 콘텐츠 우대, 낚시성 글 축소
- **공식 "생성형 AI 기능 최적화" 문서** (05-15 공개, 07-10 수정). 핵심은 이렇다.
  - AI 검색 최적화도 결국 SEO 다.
  - llms.txt 같은 AI 전용 파일은 Google 검색이 쓰지 않는다.
  - 구조화 데이터는 AI 노출의 필수가 아니다.
  - 글을 AI 용으로 잘게 쪼갤 필요가 없다.
  - **남과 겹치지 않는 1인칭 경험·전문가 관점**이 가장 중요하다.
  - 대량 생산은 scaled content abuse(대량 생산 콘텐츠 남용) 위반이다.
- **FAQ 리치결과는 2026-05-07 부터 검색에 안 나온다** (공식). FAQPage JSON-LD 는 오류는 아니지만 검색 결과에 보이는 효과는 0이다. AI 가 답을 꺼내기 쉬워지는 효과는 남을 수 있지만, 그건 증명되지 않았다.
- **Search Console 신기능**:
  - 생성형 AI 노출 리포트(06월). AI 개요·AI Mode·Discover 의 노출수가 나온다. 클릭·검색어는 없다는 보도가 있다 [2차].
  - "생성형 AI 기능에서 제외" 스위치(08-31 전 세계 배포).
- **AI Mode**: 뉴질랜드는 2025-08 영어로 시작했고, 한국어는 2025-09 에 추가됐다(공식).
- **AI 개요와 클릭률(CTR, 노출 대비 클릭 비율)**: 연구 결과가 엇갈린다.
  - Ahrefs: 1위 페이지 CTR 이 58% 낮아짐(2026-02)
  - Seer: 2025-12 1.3% → 2026-02 2.4% 로 반등(2026-04)
- **Core Web Vitals** 기준은 그대로다: LCP 2.5초 · INP 200ms · CLS 0.1. "2026 기준 강화"라는 블로그 주장은 공식 근거가 없다.
- **Next.js 주의점**: 동적으로 렌더링하는 페이지는 메타 태그를 늦게 흘려보낸다. 기본 목록(`htmlLimitedBots`)에 든 Bingbot·네이버 Yeti 만 완성된 `<head>` 를 받고, GPTBot·OAI-SearchBot·ClaudeBot 은 그 목록에 없다. 우리 공개 글은 ISR(정적)이라 해당 없을 가능성이 크지만, 한 번 확인할 가치가 있다.

### AI 검색 (ChatGPT · Perplexity · Copilot · Claude)
- **무엇이 인용되나**: 사이트 밖 웹에서 브랜드가 언급되는 정도와 AI 개요 노출의 상관이 0.664 다. 백링크는 0.218 이다(Ahrefs, 7.5만 브랜드, 상관관계).
- **AI 추천은 매번 다르다**: 같은 질문에서도 추천 목록이 99% 넘게 달랐다(SparkToro 2026-01). 한 번 물어본 결과로 판단하면 안 되고, 여러 번 물어서 빈도로 봐야 한다.
- **출처 구성은 몇 주 만에 바뀐다**: ChatGPT 의 Reddit 인용이 3.8% → 0.5% 로 떨어졌다(Semrush 08-26).
- **llms.txt 효과는 없었다**: 약 30만 도메인 분석(SE Ranking)과 2,400 도메인 비교(업체)에서 차이가 없었다.
- **Anthropic 크롤러**: ClaudeBot(학습) · Claude-User(실시간 읽기) · **Claude-SearchBot(검색 색인, 막으면 노출이 줄어듦)** (공식 04-07).
- **Bing AI Performance 리포트**(02월 미리보기)로 Copilot 인용 수를 볼 수 있다. 클릭 데이터는 없다 [2차].

### 네이버
- **AI탭**: 04-27 베타, **06-26 전체 출시**. 모바일 검색 홈이 AI 중심으로 바뀌었다.
- **AI 브리핑 출처의 46.5% 가 네이버 블로그**다. Google AI 개요에서는 7.7%, ChatGPT·Gemini 에서는 0%였다(약 2만 건 분석, 2026-08~09).
- 건강·공공 분야 AI 브리핑은 공신력 있는 출처만 쓴다.
- 해외 사이트가 인용되는 공식 조건은 확인 못함.

---

## 4. 웹 개발 · UI/UX

### 프레임워크
- **Next.js**: 최신 16.4.3. 16.4 는 Cache Components 를 "모든 앱에 권장"으로 올렸고, Next 17 에서 기본값이 된다.
- **16 으로 옮길 때 걸리는 것** (공식):
  - `middleware.ts` → `proxy.ts`
  - `revalidateTag(tag)` → `revalidateTag(tag, 'max')`. 우리 `app/api/revalidate` 가 직접 영향받는다.
  - `next lint` 삭제
  - `next/image` 기본값 변경, `priority` → `preload`
  - Node 20.9 이상 필요
  - Turbopack 이 기본이지만 `--webpack` 으로 계속 webpack 을 쓸 수 있다.
- **React 19.3**(09-09): `<ViewTransition>`·Fragment Refs 안정판.
- **Tailwind 4.3.3**: Safari 16.4 이상만 지원하고, 구형 브라우저가 필요하면 v3.4 에 머물라고 안내한다(공식).

### 지금 써도 되는 CSS
- **Baseline 통과** (주요 브라우저 전부 지원, webstatus.dev): `text-wrap: balance` · `light-dark()` · `@starting-style` · `popover` · 같은 페이지 안 View Transitions · 컨테이너 쿼리.
- **장식으로만 쓸 것** (Firefox 미지원, 없어도 화면이 깨지지 않게): 페이지 간 View Transitions · `text-wrap: pretty` · 스크롤 연동 애니메이션 · anchor positioning.

### 접근성·규제
- **WCAG 3** 는 아직 초안이고 완성까지 몇 년 더 걸린다(W3C 09-25). 실무 기준은 **WCAG 2.2 AA** 다.
- **유럽 접근성법(EAA)** 은 2025-06 부터 시행 중이고, 유럽 기술 표준이 WCAG 2.2 로 올라갔다. mhj.nz 는 EU 사업자가 아니다.

### 최상위 디자인 엔지니어 노하우 (2025~2026 공개분)
- **Vercel Web Interface Guidelines** (GitHub, 10-05 갱신)
  - 둥근 따옴표와 진짜 말줄임표(…)를 쓰고, 문단 끝 한 단어 줄을 막는다.
  - 모든 애니메이션에 움직임 줄이기(reduced-motion) 대응을 둔다. `transform`/`opacity` 만 움직이고 `transition: all` 은 금지한다.
  - 키보드 포커스를 보이게 하고(`:focus-visible`), 본문 바로가기 링크를 둔다.
  - 이미지 크기를 명시해 화면 밀림을 막는다.
  - 다크 모드에 `color-scheme` 을 지정한다.
- **Emil Kowalski** (sonner 작성자)
  - 목적 없는 애니메이션은 넣지 않는다. UI 애니메이션은 300ms 미만으로 한다.
  - 자주 쓰는 동작과 키보드로 한 동작에는 애니메이션을 넣지 않는다.
  - 자기 판단 기준을 에이전트 스킬로 공개했다.
  - vaul 은 관리가 중단됐다.
- **Linear 디자인 개편** (2026-03): 할 일에 핵심인 것만 강조하고 내비게이션은 뒤로 물린다. 장식 배경을 줄이고, 구조는 "보이기보다 느껴지게" 낮은 대비로 처리한다.
- **Josh W. Comeau** 「The Future of CSS」(10-20): 다음 세대 CSS 후보로 `@function`, `corner-shape`, `reading-flow` 등을 꼽았다.
- **anthropics/skills `frontend-design`** (09-03 갱신)의 "AI 티" 금지 목록:
  - 크림 배경에 테라코타 포인트
  - 머리카락처럼 가는 선을 쓴 신문형 레이아웃
  - 대문자 자간 라벨
  - 가운뎃점(·)으로 잇는 메타 줄
  - 섹션마다 페이드업
  - **우리 "따뜻하되 세련된" 톤과 겹치기 쉬워서, 한 번 점검할 가치가 있다.**
- **확인 못함**: 매거진 계열 2026 수상작, Rauno Freiberg·Paco Coursey 의 신규 글.

### 많이 쓰는 UI 자원 (GitHub, 2026-10-31 조회)
- shadcn/ui ★12.7만(07월부터 Base UI 를 기본으로 채택) · Base UI ★1.1만 · Radix ★1.9만 · Motion ★3.5만 · TipTap ★3.9만(최신 3.32.2, 우리는 3.22).

---

## 5. 구독자 · 회원 관리

### 뉴스레터
- **Resend**:
  - Audiences 가 Segments 로 바뀌었다(2025-11, Audiences API 는 폐기 예정).
  - 연락처마다 **Topics**(주제별 구독)를 달 수 있다.
  - 마케팅 메일은 연락처 1,000명까지 무료다.
  - 공식 MCP 서버(`resend/resend-mcp`)와 공식 스킬이 있다.
- **경쟁 서비스** (공식 가격표): beehiiv 무료 2,500명(추천 프로그램은 월 $49부터) · Kit 무료 1만 명(자동화 없음) · Ghost 월 $18부터 · Buttondown 100명까지 무료.
  - **16명 규모에서는 Resend 를 그대로 쓰는 것이 맞다.**
- **발신자 규정**:
  - Gmail 대량 발신자(하루 5,000통 이상)는 SPF·DKIM·DMARC 정렬, RFC 8058 원클릭 구독취소, 스팸 신고율 0.1% 미만이 필요하다. 2025-11 부터 단속을 강화했다(공식).
  - Outlook 도 2025-05 부터 같은 요구를 한다.
  - **뉴질랜드 원치 않는 전자메시지 법(UEMA)**: 구독취소는 근무일 5일 안에 처리해야 한다(DIA).
- **오픈율은 믿기 어렵다**: Apple Mail 이 추적 픽셀을 미리 불러와서 열림이 부풀려진다. 성과는 클릭과 구독 경로로 본다.
- **구독자 성장**: 추천 프로그램·웰컴 시퀀스 효과는 업체 자체 수치뿐이고, 2026년 독립 데이터는 확인 못함.

### 회원·인증
- **Supabase**:
  - 옛 `anon`·`service_role` 키는 **2026년 말까지 폐기**된다. 새 키와 동시에 쓸 수 있다.
  - **함정**: 새 secret 키는 JWT 가 아니다. 그래서 pg_net·DB 웹훅에서 `Authorization: Bearer` 로 보내던 곳은 `apikey` 헤더로 바꿔야 한다(공식 이전 가이드).
  - 새 프로젝트는 비대칭 JWT 가 기본이다(2025-10).
  - 패스키는 베타(2026-05). 익명 로그인은 CAPTCHA 가 사실상 필수다.
- **다른 인증 서비스**: Auth.js 는 Better Auth 로 넘어갔고(2025-09), Better Auth 는 Vercel 에 합류했다(2026-07). Clerk 는 무료 5만 명까지지만 패스키·MFA 는 무료에 없다.
- **뉴질랜드 개인정보법**:
  - 구독 폼처럼 이메일을 직접 받으면 기존 **IPP3** 원칙을 따른다. 받는 곳에서 수집 목적(막연한 "업무 목적"은 안 됨), 받는 사람, 열람·정정 권리를 안내해야 한다.
  - 제3자에게서 받은 정보에 대한 **IPP3A** 는 2026-05-01 부터 시행 중이다(추천으로 받은 이메일이 해당).
- **독자 회원제는 지금 서두를 이유가 없다.**

---

## 6. 콘텐츠 생성

- **이미지 생성**: Google Nano Banana 계열이 가성비가 가장 좋다(2장 참고). OpenAI GPT Image 2.5. Midjourney V8.2 [2차]. FLUX.2 [klein] 은 상업 이용이 가능하다(Apache 2.0).
- **영상·음성**: Sora 는 종료됐다. Veo 3.1 은 초당 $0.05~0.40 [2차]. ElevenLabs 는 무료 요금제에서 상업 이용이 안 된다.
- **Google 정책**: 문제는 "AI 로 쓴 글"이 아니라 **가치 없이 대량으로 만든 페이지**다(스팸 정책 08-28 갱신). AI 사용을 밝히는 것은 신뢰를 쌓는 방법으로 권장된다.
- **EU AI Act 제50조**(AI 생성물 표시)는 2026-08-02 부터 적용된다.
- **언론사 관행**: USA TODAY·Chicago Public Media 는 사람이 검수하고 AI 사용 사실을 밝힌다.
- **MHJ 기준**: "AI 보조 · 사람 검수" 표기를 일관되게 붙이고, 유씨 본문의 목소리는 사람 것을 유지한다.

---

## 7. 깃허브 스킬 · MCP

### 생태계
- **Agent Skills** 는 `SKILL.md` 폴더 형식의 공개 표준이다(agentskills.io). Claude·Codex 등 여러 에이전트가 같이 쓴다.
- **보안 사고**:
  - 공개 스킬 3,984개 중 13.4% 에 심각한 문제가 있었고, 악성 스킬이 76개였다(Snyk 2026-02).
  - 이름을 흉내 낸 악성 스킬 1,184개가 퍼졌다(OWASP 사례 2026-01).
  - **들이기 전에 반드시 검사한다.** 우리 `skill-inspector` 가 쓰는 NVIDIA SkillSpector 는 ★2.4만이고 계속 관리되고 있다.

### 우리에게 쓸 만한 것 (★ · 최근 갱신, 10-31 조회)

| 저장소 | ★ | 용도 | 판단 |
|---|---|---|---|
| anthropics/skills | 18.5만 · 10-28 | 공식 스킬(frontend-design 등) | 이미 일부 사용. 갱신분 비교 가치 있음 |
| vercel-labs/agent-skills | 3.3만 · 10-28 | web-design-guidelines(100+ 규칙)·react-best-practices·writing-guidelines | **1순위 후보**(출처 확실) |
| supabase/agent-skills | 3천 · 10-02 | Postgres·RLS 모범 사례 | YuStudy 분리 때 유용 |
| resend/resend-mcp · resend-skills | 578 / 208 · 10-30 | Resend 공식 | 뉴스레터 작업 때 |
| ChromeDevTools/chrome-devtools-mcp | 5.5만 · 10-30 | 성능 측정·디버깅 | 검증용 |
| microsoft/playwright-mcp | 3.9만 · 10-30 | 브라우저 자동 점검 | 이미 연결돼 있음 |
| upstash/context7 | 6.4만 · 10-30 | 라이브러리 최신 문서 | 이미 연결돼 있음 |
| AminForou/mcp-gsc | 2천 · 09-15 | Search Console 데이터 | 주간 SEO 루프에 유용, 검사 후 |
| coreyhaines31/marketingskills | 5.8만 · 10-30 | 카피·전환율·SEO | 우리 copywriting 스킬과 겹침. 참고만 |
| AgriciDaniel/claude-seo | 2.4만 · 10-22 | 기술 SEO·GEO | 우리 seo-audit-runner·ai-seo 와 겹침. 참고만 |
| blader/humanizer | 6.3만 · 10-28 | AI 문체 제거 | 영어 전용 |
| 큐레이션: VoltAgent/awesome-agent-skills · hesreallyhim/awesome-claude-code | 3.7만 / 5.7만 | 목록 | 찾을 때만 |

---

## 8. 실행 순서

| 시기 | 할 일 | 규모 |
|---|---|---|
| 이번 주 | `next@15.5.28` 이상으로 패치(11-03 릴리스 나오면 그것까지), `sharp` 0.35.5 이상 확인 | 작음 · PR 1개 |
| 이번 주 | 뉴스레터 `List-Unsubscribe` + `List-Unsubscribe-Post` 헤더 추가, 구독취소 링크를 서명 토큰 방식으로 | 작음~중간 |
| 11월 | SEO 제목 모델 → `claude-haiku-5-5` + SDK 1.x + text 블록 골라 읽기 | 작음 |
| 11월 (YuStudy 분리와 같이) | Supabase 새 키로 교체, pg_net·웹훅 헤더 점검 | 중간 |
| 11월 | 사이트 밖 언급 늘리기(뉴질랜드 한인 매체·커뮤니티), 네이버 블로그에 요약 + 원문 링크 | 운영 |
| 월 1회 | Search Console 생성형 AI 리포트 + Bing AI Performance 확인, AI 프로브는 여러 번 돌려 빈도로 기록 | 운영 |
| 12월~2027-01 | Next 16 이전 계획(마지노선 2027-01-31). 빌드는 `--webpack` 유지, Cache Components 는 별도 작업 | 큼 · Plan Mode |
| 여유 있을 때 | 제목에 `text-wrap: balance`, AVIF 시험, frontend-design 의 "AI 티" 목록으로 점검 | 작음 |
| 보류 | Tailwind v4 · React Compiler · 독자 회원제 · llms.txt 추가 작업 · 다른 뉴스레터 서비스로 이전 | — |

---

## 9. 확인 못한 것

- Vercel 에서 운영하는 사이트가 이미지 최적화 SVG 취약점에 해당하는지
- Search Console AI 리포트가 AI 개요와 AI Mode 를 나눠 보여 주는지
- 뉴질랜드에서 한국어 AI Mode 가 되는지
- 네이버가 해외 사이트를 인용하는 조건
- Claude Code 5~9월 변경 목록 전체
- OpenAI 쇼핑·Atlas 의 2026 변경
- Veo 공식 가격
- 웰컴 시퀀스·추천 프로그램의 2026 독립 데이터
- GDPR 세부
- 매거진 계열 2026 디자인 수상작

## 주요 출처
- Next.js 보안: https://nextjs.org/blog/nextjs-security-update-october-14-2026 · https://nextjs.org/support-policy · https://nextjs.org/blog/upcoming-nextjs-security-release-november-2026
- Next 16·16.4: https://nextjs.org/blog/next-16 · https://nextjs.org/blog/next-16-4
- Claude 모델: https://platform.claude.com/docs/en/models/haiku-5-5/overview · https://platform.claude.com/docs/en/about-claude/model-deprecations · https://platform.claude.com/docs/en/release-notes/overview
- OpenAI: https://developers.openai.com/api/docs/changelog · https://developers.openai.com/api/docs/bots
- Gemini: https://ai.google.dev/gemini-api/docs/pricing · https://ai.google.dev/gemini-api/docs/deprecations
- Google 검색: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide · https://developers.google.com/search/docs/appearance/structured-data/faqpage · https://status.search.google.com/summary · https://developers.google.com/search/docs/essentials/spam-policies
- AI 인용 연구: https://ahrefs.com/blog/ai-overview-brand-correlation/ · https://www.searchenginejournal.com/ai-recommendations-change-with-nearly-every-query-sparktoro/566242 · https://www.semrush.com/blog/reddits-citations-in-chatgpt-fall/
- 네이버: https://www.navercorp.com/en/media/pressReleasesDetail?seq=34984 · https://ditoday.com/?p=154900
- 크롤러: https://support.claude.com/en/articles/8896518
- 발신자 규정: https://support.google.com/a/answer/14229414 · https://www.dia.govt.nz/Information-about-unsubscribing
- Supabase 키: https://supabase.com/docs/guides/api/api-keys · https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys
- 뉴질랜드 개인정보: https://www.privacy.org.nz/resources-and-learning/a-z-topics/ipp3a/
- 웹 플랫폼: https://web.dev/blog/interop-2026 · https://web.dev/articles/vitals · https://www.w3.org/WAI/standards-guidelines/wcag/wcag3-intro/
- 디자인: https://github.com/vercel-labs/web-interface-guidelines · https://linear.app/now/behind-the-latest-design-refresh · https://www.joshwcomeau.com/css/interop-2027/
- 스킬 보안: https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/ · https://agentskills.io
- Sora 종료 [2차]: https://the-decoder.com/openai-sets-two-stage-sora-shutdown-with-app-closing-april-2026-and-api-following-in-september/ · https://engadget.com/ai/openai-is-shutting-down-its-sora-video-generation-app-211023358.html
