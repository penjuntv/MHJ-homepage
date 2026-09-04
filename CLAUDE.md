# MHJ HOMEPAGE — MY MAIRANGI JOURNAL

뉴질랜드 오클랜드 마이랑이 베이 한국인 가족의 라이프 매거진.
톤: "따뜻하되 세련된, 감성적이되 지적인" 에디토리얼.
운영: PeNnY(조상목, 기자 출신) · Yussi(유희종, 사회복지학 석사) · 세 딸(사이트 표기는 Min/Hyun/Jin).
Live: www.mhj.nz · Repo: penjuntv/MHJ-homepage · Supabase project: vpayqdatpqajsmalpfmq

## 기술 스택 (package.json 과 어긋나기 쉬운 것만)
Next.js 15.5 App Router · React 19 · Tailwind 3.4(v3 문법, `@theme` 아님) · TipTap 3.x.
AI: Gemini 2.5 Flash = **`@google/genai`** (구 `@google/generative-ai` 아님 — AI Insight, carousel/ai-layout) · Claude Haiku 4.5 = `@anthropic-ai/sdk` (ai-seo).
**Resend 는 SDK 없음** — `api.resend.com` 에 fetch 로 직접 호출(`app/api/send-newsletter/route.ts`).
`@supabase/supabase-js` 는 런타임 의존성이다(`lib/supabase.ts` 가 import). devDependencies 로 되돌리면 `--omit=dev` 설치에서 빌드가 깨진다.
dev 는 **Turbopack 고정**(`next dev --turbopack -p 3003`) — webpack dev 의 `eval-source-map` 이 react-pdf/pdfjs `.mjs` 로드 시 `Object.defineProperty called on non-object` 로 죽어 과월호 PDF 뷰어가 안 뜬다. 프로덕션 빌드는 webpack 그대로라 무영향. **--turbopack 제거 금지.**

## 핵심 규칙 (모든 작업에 적용)
1. UI/디자인 → `docs/DESIGN_RULES.md` 먼저. DB → `docs/DB_SCHEMA.md`. 새 페이지/컴포넌트 → `docs/ARCHITECTURE.md`. 색·폰트 토큰 → `docs/DESIGN_SYSTEM.md`. 매거진 지면 → `docs/MHJ_MAGAZINE_DESIGN_BIBLE.md`. 에이전트·순서 → `docs/AGENTS.md`·`docs/WORKFLOW.md`.
2. **캐싱**: 공개 콘텐츠 읽기는 캐시 허용(ISR). `lib/supabase.ts` 의 `supabase`(익명·ISR 호환) 또는 `createPublicAdminClient()`(service_role·ISR 호환)를 쓰고, 발행/수정 시 `app/api/revalidate/route.ts` 로 `revalidateTag`/`revalidatePath` 호출. `no-store`(`supabaseNoCache`·`createAdminClient`)는 예약발행 `publish_at` 체크·admin·유저별 데이터에만. ⚠️ "모든 fetch 에 no-store"는 폐기된 옛 규칙 — 되살리지 말 것(증상·진단은 `docs/ARCHITECTURE.md` §3.3).
3. 예약발행: 모든 공개 쿼리에 `.or('publish_at.is.null,publish_at.lte.now')` 적용.
4. TipTap — `immediatelyRender: false` 필수(SSR 하이드레이션). `@tiptap/*` 버전 단일 정렬.
5. 다크 모드 — `globals.css` CSS 변수만 사용(색상 하드코딩 금지). `--text-primary` 는 **존재하지 않는 변수** — `--text` 를 쓸 것.
6. 호버 — `translateY`/`saturate()` 금지, opacity·미세 scale(1.02~1.03)만.
7. 카드 radius — 12px 이하(블로그 6px). 32px+ 절대 금지.
8. SQL 문자열의 단일 quote `'` → 이중 `''` 로 이스케이프.
9. Admin(`app/mhj-desk/`) 변경 시 → 반드시 대응 public 페이지 연동까지 완료해야 "끝".
10. 아이 실명(유민/유현/유진 등)·"Heejong Jo" 노출은 P0. 메타데이터(OG/alt/title) 포함 여부까지 점검.
11. dev 서버 실행 중에는 `npm run build` 금지(.next 캐시 오염). 완료 정의(Done) = build 통과 + `tsc` 에러 0 + (UI면) 데스크탑/태블릿/모바일 3화면 확인.
12. 1대화 = 1기능. 큰 작업은 Plan Mode → 승인 후 구현. 에러는 전체 로그로 분석(요약 금지), 가정 전에 실제 코드 확인.
13. 끝났다고 선언하기 전에 `/code-review` 와 `/verify` 를 명시적으로 실행할 것 — 더 이상 자동 실행되지 않는다.

## 자주 쓰는 명령
```bash
find .next -mindepth 1 -delete && npm run build          # .next 캐시 오염 시 클린 빌드
curl -X POST https://www.mhj.nz/api/revalidate -H 'Content-Type: application/json' -d '{"secret":"$REVALIDATION_SECRET","paths":["/blog"]}'
npx tsc --noEmit --pretty | head -20                      # 타입 에러 상위 20줄만
```

## Compact instructions
compact 시 유지할 것: 현재 브랜치 · 건드린 파일 · 실패 중인 검사 · 다음 단계.

## Claude Code 운영 메모
- 멀티툴 repo: Claude Code(`.claude/`) · Codex(`.codex/`) · Antigravity(루트 `AGENTS.md`, 읽기전용 QA). 설정은 서로 별개.
- 강제 규칙은 프롬프트가 아니라 hook 로 추가한다: `.claude/hooks/` 의 safety-gate(Bash)·scope-guard/name-guard/mag-unit-guard/select-star-guard(Edit/Write/MultiEdit)·ts-check(PostToolUse)·session-summary(Stop).
- select-star-guard 는 공개 표면(`app/`, mhj-desk 제외)의 `blogs` `select('*')` 를 차단한다(2026-09-04 P0 재발 방지). 짝이 되는 CI 는 `scripts/audit-select-star.mjs`(source-guard.yml + 주간 site-audit ⑧), 훅 자체의 회귀 테스트는 `scripts/qa/test-select-star-guard.sh`. 공개 blogs 쿼리는 `lib/constants.ts` 의 `BLOG_*_COLUMNS` 를 쓸 것.
- 스킬 `.claude/skills/`·`.agents/skills/`(인벤토리 `docs/AGENTS.md`) · 서브에이전트 `.claude/agents/`.
- `.claude/skills/frontend-design`(+`.kiro/skills/frontend-design`)·`.claude/skills/fact-verify` 는 `.agents/skills/` 의 원본을 가리키는 **심볼릭 링크**다. 원본을 지우면 링크가 전부 깨진다.
- MCP: Supabase 는 DDL=apply_migration / 조회·DML=execute_sql. 불필요한 MCP 는 끄기.
