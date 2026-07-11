# MHJ — 스택 & 툴링 최신화 조사 (2026-07-11)

CLAUDE.md/docs 갱신을 위해 수행한 교차검증 조사 결과. 3개 독립 리서치(웹스택 / Claude Code 공식 / CLAUDE.md 작성 표준)를 통합하고, 실제 코드베이스와 대조해 확정한 사실만 기록한다. 각 항목의 근거 URL은 하단 참고.

---

## 0. 실제 코드 대조로 확정한 사실 (진실 = 코드)

| 항목 | 옛 문서 기재 | 실제 코드 | 조치 |
|------|------|------|------|
| AI Insight 모델 | Gemini 2.0 / Claude Haiku(문서마다 다름) | `gemini-2.5-flash` (`app/api/ai-insight`) | ✅ CLAUDE.md 정정 |
| AI SEO 모델 | 미기재 | `claude-haiku-4-5-20251001` (`app/api/ai-seo`) | ✅ CLAUDE.md 추가 |
| Admin 경로 | `app/admin/` (ARCHITECTURE, MEMORY) | 실제 `app/mhj-desk/` | ⚠️ ARCHITECTURE 미정정 |
| 캐싱 전략 | "모든 fetch에 no-store" | `lib/supabase.ts`가 이미 4-way(ISR 기본 + no-store 예약) | ✅ CLAUDE.md·AGENTS.md 정정 |
| 캐싱 무효화 | 없음 | `app/api/revalidate/route.ts` 운영 중 | ✅ 반영 |
| public 라우트 | about/magazine/gallery/blog | +mairangi-notes/media-kit/storypress/privacy/unsubscribe | ✅ CLAUDE.md 반영 |

**핵심**: `lib/supabase.ts`는 이미 `supabase`(익명·ISR 호환), `createPublicAdminClient`(service_role·ISR 호환), `supabaseNoCache`·`createAdminClient`(no-store)로 분리돼 있다. CLAUDE.md의 "모든 fetch no-store" 규칙은 자기 코드와도 모순된 폐기 규칙이었다.

---

## 1. 웹 스택 최신 상태

### Next.js — 현재 stable 16 (14.2.35는 2 메이저 뒤)
- **14→15 핵심**: `fetch` 기본 캐시가 `force-cache`→**미캐시**로 전환. `cookies()`/`headers()`/`params`/`searchParams`가 **async**(await 필요). React 19 필수. (codemod 제공)
- **15→16 핵심**: **Cache Components**(`cacheComponents: true`) + **`"use cache"` 지시어**(← `unstable_cache` 후속). **Turbopack 기본** 번들러. `middleware.ts`→**`proxy.ts`**(Node 런타임 전용). `revalidateTag(tag)`→`revalidateTag(tag, profile)`, 신규 `updateTag()`/`refresh()`. Node **20.9+**, TS 5.1+ 요구. `next lint` 제거. `next/image` 기본값 강화(`remotePatterns` 권장).
- **권고**: 단계적으로 **14→15 먼저**(codemod + await 처리 + 캐시 의도 감사), 안정화 후 16 검토. React 18→19 시 `react-pdf`/`react-pageflip`/`react-image-crop`의 React 19 peer 지원 **먼저 확인**(최대 리스크).

### 캐싱 — 채택할 규칙 (콘텐츠 사이트 = read-heavy)
- 기본: 공개 읽기는 캐시 허용(ISR/`revalidate`). 발행·수정 시 `revalidateTag`/`revalidatePath`.
- `no-store`는 예약발행 체크·admin·유저별 데이터에만. 인증 페이지는 `dynamic = 'force-dynamic'`.

### Tailwind — v4 stable, 비긴급
- Rust 재작성, 3–10× 빌드, CSS-first `@theme`. `npx @tailwindcss/upgrade`로 대부분 자동(1–4h).
- **게이트**: v4는 Safari 16.4+/Chrome 111+/Firefox 128+ 요구. **v3.4는 완전 지원 중 → 지금 급하지 않음.** Next 15/16 업그레이드와 묶어서 처리 권장.

### TipTap 3.20 — 건강. `immediatelyRender: false` 전 인스턴스 확인, `@tiptap/*` 버전 단일 정렬(현재 대부분 3.20.1, youtube만 3.22.1). StarterKit이 link/underline 번들 → 중복 import 경고 점검.

### Supabase `@supabase/ssr` 0.9 — 표준. 공개 읽기를 service_role 서버사이드로 쓰는 현 방식은 (서버 전용·이미 공개 콘텐츠라) 허용 가능. 향후 사용자 인증 추가 시 `createServerClient`(cookie) 채택, `getUser()`로 게이트(절대 `getSession()` 신뢰 금지).

### Vercel/성능 — CWV 2026: LCP<2.5s, **INP<200ms(최다 실패 지표)**, CLS<0.1. 이미지가 LCP 실패 1위 → `next/image`+명시적 `sizes`+hero priority. `@vercel/speed-insights`/`analytics` 이미 설치됨.

### SEO/GEO — **구조화 데이터(JSON-LD) > llms.txt.** llms.txt는 채택 급증했으나 ~97%가 AI봇 요청 0, 인용/트래픽 상관 근거 없음 → **"에이전트 인덱스"로 유지하되 SEO 기대 말 것.** 투자처: Article/BlogPosting/Breadcrumb/Person JSON-LD, H2/H3·리스트·Q&A 구조, 엔티티 일관성, GPTBot/PerplexityBot/ClaudeBot robots 허용.

---

## 2. Claude Code 운영 (공식 2026)

- **CLAUDE.md**: <200줄(실무 <100 지향), 명령형. "이 줄을 지우면 실수하나?" 통과 못하면 삭제. **자주 바뀌는 상태 스냅샷·파일별 설명 금지**(공식 exclude 목록). `@path` import는 조직화용이며 컨텍스트 절약 아님(전체 로드). 진짜 지연로딩은 **`.claude/rules/`(paths 프론트매터) + 스킬**.
- **강제 규칙은 프롬프트가 아니라 hook**: 이 repo는 이미 `.claude/hooks/`(safety-gate/scope-guard/ts-check/session-summary) 보유. "항상 실행"은 여기에 추가.
- **AGENTS.md**: 크로스툴 오픈 표준(Codex/Cursor 등 28+ 도구). **단, Claude Code는 AGENTS.md를 읽지 않는다(공식 확인)** — "fallback으로 읽는다"는 블로그 주장은 오류. 이 repo 루트 `AGENTS.md`는 Antigravity 전용이라 그대로 둔다.
- **스킬 vs 서브에이전트 vs hook**: 스킬=지식(how), 서브에이전트=작업 격리(context 보호), hook=규칙 강제(deterministic). 스킬 `description`은 "Use when …" 형태로 구체적일수록 자동 트리거 잘 됨.
- **2026 신규**: Plan Mode, Goal Mode(`/goal`), Dynamic Workflows(`ultracode`/`/deep-research`), Checkpoints(`/rewind`), `.claude/rules/` 경로 스코프, `/init` 인터랙티브(`CLAUDE_CODE_NEW_INIT=1`).

---

## 3. 실행 권고 (우선순위)

| P | 액션 | 성격 | 상태 |
|---|------|------|------|
| **P0** | CLAUDE.md 캐싱 규칙·AI 스택·중복규칙·stale 스냅샷 정정 | 문서 | ✅ 완료 |
| **P0** | `@google/generative-ai`(0.24, **2025-11-30 deprecated**) → `@google/genai`(`GoogleGenerativeAI`→`GoogleGenAI`) | 코드 | ⏳ 미착수 |
| P1 | ARCHITECTURE.md 전면 갱신(admin 경로·AI 모델·라우트·캐싱 섹션 stale) | 문서 | ⏳ 미착수 |
| P1 | Next 14→15 업그레이드 계획(codemod·await·React19 peer 감사) | 코드 | ⏳ 계획 |
| P2 | `@tiptap/*` 버전 단일 정렬 | 코드 | ⏳ |
| P2 | Next 15→16(Cache Components·proxy.ts·Turbopack) | 코드 | 검토 |
| P2 | Tailwind v4(Next 업그레이드와 묶어서) | 코드 | 검토 |
| P3 | JSON-LD 구조화 데이터 확충 / AI봇 robots 허용 점검 | 코드 | 지속 |
| P3 | llms.txt-generator 스킬 문서를 "에이전트 인덱스"로 재정의 | 문서 | ⏳ |

---

## 참고 (근거)
- Next.js: nextjs.org/blog/next-16, docs/app/guides/upgrading/version-15, config/cacheComponents, file-conventions/proxy
- React 19: react.dev/blog/2024/12/05/react-19
- Tailwind v4: tailwindcss.com/docs/upgrade-guide
- Supabase SSR: supabase.com/docs/guides/auth/server-side
- TipTap Next: tiptap.dev/docs/editor/getting-started/install/nextjs
- Google GenAI 마이그레이션: ai.google.dev/gemini-api/docs/migrate (구 SDK deprecated)
- Claude Code: code.claude.com/docs/en (best-practices, memory, skills, sub-agents, hooks, workflows, goal)
- AGENTS.md: agents.md, code.claude.com/docs/en/memory (Claude는 AGENTS.md 미독)
- CLAUDE.md 작성: humanlayer.dev/blog/writing-a-good-claude-md, alexop.dev(progressive disclosure)
- CWV/GEO: digitalapplied.com(core-web-vitals-2026, geo-guide), llms.txt: ppc.land / seranking.com/blog/llms-txt
