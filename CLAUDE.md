# MHJ HOMEPAGE — MY MAIRANGI JOURNAL

뉴질랜드 오클랜드 마이랑이 베이 한국인 가족의 라이프 매거진.
톤: "따뜻하되 세련된, 감성적이되 지적인" 에디토리얼.
운영: PeNnY(조상목, 기자 출신) · Yussi(유희종, 사회복지학 석사) · 세 딸(사이트 표기는 Min/Hyun/Jin).
Live: www.mhj.nz · Repo: penjuntv/MHJ-homepage · Supabase project: vpayqdatpqajsmalpfmq

## 기술 스택
Next.js 14.2.35 (App Router) · React 18 · TypeScript 5 · Tailwind CSS 3.4 · Supabase(@supabase/ssr + supabase-js) · TipTap 3.x · Resend · Vercel.
AI: Gemini 2.5 Flash(`@google/generative-ai` — AI Insight, Carousel ai-layout) + Claude Haiku 4.5(`@anthropic-ai/sdk` — AI SEO).
개발 서버: `npm run dev` → localhost:3003 (포트 고정, 3000 아님).

## 명령어
- `npm run dev` — 개발 서버(3003). dev 실행 중에는 `npm run build` 금지(.next 캐시 오염).
- `npm run build` — 커밋 전 통과 필수. TypeScript strict, `tsc` 에러 0.
- `npm run lint` · `npm run seed`.

## 핵심 규칙 (모든 작업에 적용)
1. UI/디자인 변경 시 → 먼저 `docs/DESIGN_RULES.md` 읽기. DB 스키마 변경 시 → `docs/DB_SCHEMA.md`. 새 페이지/컴포넌트 → `docs/ARCHITECTURE.md` 패턴 따르기.
2. **캐싱**: 공개 콘텐츠 읽기는 캐시 허용(ISR). `lib/supabase.ts`의 `supabase`(익명·ISR 호환) 또는 `createPublicAdminClient()`(service_role·ISR 호환)를 쓰고, 발행/수정 시 `app/api/revalidate/route.ts`로 `revalidateTag`/`revalidatePath` 호출. `no-store`(`supabaseNoCache`·`createAdminClient`)는 예약발행 `publish_at` 체크·admin·유저별 데이터에만. ⚠️ "모든 fetch에 no-store"는 폐기된 옛 규칙 — 되살리지 말 것.
3. 예약발행: 모든 공개 쿼리에 `.or('publish_at.is.null,publish_at.lte.now')` 적용.
4. TipTap — `immediatelyRender: false` 필수(SSR 하이드레이션). `@tiptap/*` 버전 단일 정렬.
5. 다크 모드 — `globals.css` CSS 변수만 사용(색상 하드코딩 금지).
6. 호버 — `translateY`/`saturate()` 금지, opacity·미세 scale(1.02~1.03)만.
7. 카드 radius — 12px 이하(블로그 6px). 32px+ 절대 금지.
8. SQL 문자열의 단일 quote `'` → 이중 `''`로 이스케이프.
9. Admin(`app/mhj-desk/`) 변경 시 → 반드시 대응 public 페이지 연동까지 완료해야 "끝".
10. 아이 실명(유민/유현/유진 등)·"Heejong Jo" 노출은 P0. 메타데이터(OG/alt/title) 포함 여부까지 점검.

## 프로젝트 구조 (디렉토리 용도)
- `app/(public)/` — 공개 페이지: about, blog(+category/[slug]/tag), magazine, gallery, mairangi-notes, media-kit, storypress, privacy, unsubscribe.
- `app/mhj-desk/` — Admin UI(구 app/admin 아님). `app/api/` — 라우트 핸들러(ai-insight, ai-seo, carousel, revalidate, send-newsletter, comments 등).
- `components/` · `lib/`(supabase.ts, site-settings.ts, types.ts, utils.ts) · `docs/`(참조 문서) · `seed-data/`.

## 참조 문서 (해당 작업 시에만 읽기)
| 문서 | 언제 |
|------|------|
| `docs/DESIGN_RULES.md` | UI/디자인 작업 |
| `docs/DESIGN_SYSTEM.md` | 색상/폰트/간격 토큰 |
| `docs/MHJ_MAGAZINE_DESIGN_BIBLE.md` | 매거진 PNG/레이아웃 |
| `docs/ARCHITECTURE.md` | 새 페이지/컴포넌트 |
| `docs/DB_SCHEMA.md` | DB 작업 |
| `docs/AGENTS.md` · `docs/WORKFLOW.md` | 에이전트 역할·작업 순서 |

## 작업 규칙
- 1대화 = 1기능. 큰 작업은 Plan Mode로 계획 → 승인 후 구현.
- 에러는 전체 로그를 보고 분석(요약 금지). "이것 때문일 것" 가정 전에 실제 코드 확인.
- MCP: Supabase는 DDL=apply_migration / 조회·DML=execute_sql. 불필요한 MCP는 끄기.
- 완료 정의(Done) = build 통과 + tsc 에러 0 + (UI면) 데스크탑/태블릿/모바일 3화면 확인.

## Claude Code 운영 메모
- 이 repo는 멀티툴: Claude Code(`.claude/`), OpenAI Codex(`.codex/`), Antigravity(루트 `AGENTS.md` — 읽기전용 QA). 각 도구 설정은 서로 별개다.
- 강제 규칙은 이미 hook로 구현됨: `.claude/hooks/`의 safety-gate(Bash)·scope-guard(Edit/Write)·ts-check(PostToolUse)·session-summary(Stop). 새 "항상 실행" 규칙은 이 프롬프트가 아니라 hook로 추가.
- 스킬은 `.claude/skills/`·`.agents/skills/`에 등록(인벤토리는 `docs/AGENTS.md`). 서브에이전트는 `.claude/agents/`.
