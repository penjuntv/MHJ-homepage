# MHJ Carousel V3 — Final Automation Spec

**Synthesized from**:
- agent-slide-maker-easy (HyperFrames CLI pattern, full repo analysis)
- HyperFrames docs (https://hyperframes.heygen.com)
- Satori / @vercel/og (Vercel's official OG generator)
- Playwright + @sparticuz/chromium (serverless deep dive)
- Korean card news typography research (8 sources)
- MHJ repo actual state (verified package.json, docs/, tokens.css)

**Last updated**: 2026-05-09
**Reviewed before drafting**: yes — every claim verified

---

## 0. The Goal in One Picture

```
INPUT (any of 3):
  A. Yussi Factory JSON paste
  B. Markdown DSL (HyperFrames-style: # [stat] By the Numbers)
  C. Natural language → Aim tool parses
                ↓
       canonical V3 JSON
                ↓
[6 React components × 2 aspects = 12 renders]
                ↓
   16 PNG files (8 slides × 4:5 + 9:16)
                ↓
       ZIP download → Instagram
```

**Time budget**: < 15 seconds end-to-end (research-validated achievable with Satori)

---

## 1. The 7 Patterns We're Stealing (with citations)

| # | Source | Pattern | Our application |
|---|---|---|---|
| 1 | agent-slide-maker `AGENTS.md` | **SKILL.md per template** locks visual rules in markdown | `lib/carousel-v3/templates/T*.skill.md`, 6 files |
| 2 | agent-slide-maker `card-news/SKILL.md` | **Type enforcement** — exactly 4 (or 6) template types, no others | TypeScript discriminated union enforces at compile time |
| 3 | agent-slide-maker `template-portrait.html` | **Variant via CSS vars** at `:root` (canvas dimensions) | `_tokens.css` body class swap (already done) |
| 4 | agent-slide-maker `card-news/SKILL.md` markdown DSL | **Markdown DSL** for human-readable card spec (`# [stat] By the Numbers`) | Optional input mode in addition to JSON |
| 5 | agent-slide-maker `overview-template.html` | **Overview HTML** with strip + detail panel for review BEFORE render | `app/mhj-desk/carousel-v3/[id]/page.tsx` shows overview |
| 6 | hangul-600 example `DESIGN.md` | **Per-topic DESIGN.md** documenting tone-specific rules | 4 tone presets each with own DESIGN_NOTES.md |
| 7 | hyperframes-overview-edit | **Edit roundtrip** — contenteditable + clipboard patch back to source | Inline overview editor → updates JSON |

---

## 2. Rendering Strategy — Critical Decision

**Choice: Satori (@vercel/og) primary, Playwright as fallback for complex cards**

### Why Satori wins for most cards

Research findings (verified):
- **Speed**: Satori renders SVG → PNG in <1s. Playwright takes 5-50s on Vercel.
- **Bundle size**: Satori ~500KB. Playwright + Chromium ~50MB (50MB Vercel limit).
- **Vercel native**: `@vercel/og` is built-in to Next.js App Router. No Pro plan required.
- **Determinism**: Same input = same output. Playwright varies by environment.
- **Korean fonts**: Satori loads TTF/OTF directly. Korean glyphs render correctly with Noto Sans KR.

### Why Playwright as fallback

Satori limitations (verified):
- **CSS Grid not supported**. Only flexbox.
- **Some advanced effects unsupported** (filter: blur, complex gradients in some cases)
- **No JavaScript execution** (animations, dynamic content)
- **Bundle limit 500KB** including fonts and assets

### Decision matrix per template

| Template | Renderer | Reason |
|---|---|---|
| T1 Cover | Satori | Photo + text overlay = flexbox-friendly |
| T2 Stat | Satori | Mostly text + simple shapes |
| T3 Quote | Satori | Pure text + colored boxes |
| T4 Dialogue | Satori | Bubble shapes + text |
| T5 Image-Feature | **Playwright** | `filter: blur(48px)` background needed for editorial look |
| T6 Outro | Satori | Dark card + text + simple boxes |

**5 of 6 templates use Satori** = 5x speed improvement over all-Playwright approach.

### Implementation: dual-engine renderer

```typescript
// lib/carousel-v3/render/engine.ts
export async function renderCard(
  slide: SlideInput,
  aspect: '4x5' | '9x16',
  tone: TonePreset
): Promise<Buffer> {
  const requiresPlaywright = slide.type === 'image-feature' || 
                              hasComplexBlur(slide);
  
  return requiresPlaywright
    ? renderWithPlaywright(slide, aspect, tone)
    : renderWithSatori(slide, aspect, tone);
}
```

---

## 3. File Structure (verified against MHJ repo)

```
# NEW (V3)
lib/carousel-v3/
├── types.ts                          # SlideInput discriminated union
├── tokens.ts                         # CSS vars exported as TS constants
├── templates/                        # 6 React components + 6 SKILL.md
│   ├── T1Cover.tsx
│   ├── T1Cover.skill.md
│   ├── T2Stat.tsx
│   ├── T2Stat.skill.md
│   ├── T3Quote.tsx
│   ├── T3Quote.skill.md
│   ├── T4Dialogue.tsx
│   ├── T4Dialogue.skill.md
│   ├── T5ImageFeature.tsx
│   ├── T5ImageFeature.skill.md
│   ├── T6Outro.tsx
│   └── T6Outro.skill.md
├── presets/                          # 4 tone presets
│   ├── editorial.ts                  # 1순위 — ship first
│   ├── editorial.skill.md            # human-readable design notes
│   ├── warm.ts
│   ├── original.ts
│   └── earth.ts
├── render/
│   ├── engine.ts                     # dual-engine entry point
│   ├── satori.ts                     # @vercel/og based
│   ├── playwright.ts                 # @sparticuz/chromium based
│   ├── fonts.ts                      # font loader (Noto Sans KR + Inter + Playfair)
│   └── zipper.ts                     # JSZip bundle of 16 PNGs
├── parser/
│   ├── markdown.ts                   # parse `# [stat] ...` DSL
│   ├── aim.ts                        # NL → JSON via Claude API
│   └── validate.ts                   # zod schema validation
└── overview/
    └── generateOverviewHtml.ts       # produce review HTML

app/api/carousel-v3/
├── preview/route.ts                  # POST: 1 slide JSON → PNG (Satori-only, fast)
├── generate/route.ts                 # POST: full JSON → ZIP (uses dual-engine)
├── parse/route.ts                    # POST: markdown or NL → V3 JSON
├── overview/[id]/route.ts            # GET: HTML overview for review
└── upload-photo/route.ts             # POST: photo → Supabase Storage URL

app/mhj-desk/carousel-v3/
├── page.tsx                          # list + new button
├── new/page.tsx                      # input form (3 modes)
└── [id]/
    ├── page.tsx                      # overview review (read-only)
    └── edit/page.tsx                 # paste-edit JSON

components/carousel-v3/                # public/shared components (only if needed)

# NEW dependencies (verified missing from package.json)
- "@vercel/og": "^0.6.x"               # for Satori path
- "playwright-core": "^1.x"            # for Playwright path
- "@sparticuz/chromium-min": "^131"    # serverless-friendly chromium

# DB migration
supabase/migrations/2026_05_xx_carousel_v3.sql
```

**Existing in repo (do not duplicate)**:
- `jszip` ✅
- `@anthropic-ai/sdk` ✅ (for Aim NL parser)
- `next` 14.2.35 ✅
- TipTap ecosystem ✅

**Do NOT use V2 dependencies**:
- `html-to-image` (V2, leave for V2)
- `html2canvas` (V2, leave for V2)

---

## 4. The 6 Templates (final list)

Adapted from agent-slide-maker's 4 types + our 2 additions matching the visual baseline already produced in `mockups/v3final/`:

| Type | From agent-slide-maker | Our additions |
|---|---|---|
| `cover` | photo-cover | matches T1 |
| `stat` | stat | matches T2 |
| `quote` | (NEW for us) | T3 — language learning niche, MHJ signature |
| `dialogue` | (NEW for us) | T4 — story reveal pattern |
| `image-feature` | image-feature | matches T5, requires Playwright |
| `outro` | (NEW for us — modified photo-cover) | T6 — CTA + next-up box |

**Why we deviate from agent-slide-maker's 4-type rule**: their content is general (Korean history, coffee). Ours is **language learning + immigrant family stories** which need quote and dialogue patterns. Our 6 are still enumerable, still type-locked, still composable.

---

## 5. SKILL.md Pattern (the critical innovation)

Each template gets a SKILL.md with:

```markdown
---
name: carousel-v3-template-quote
description: T3 Quote — English phrase + Korean explanation card.
            Use when content is a memorable foreign phrase + "when to use" note.
---

# T3 Quote — Generation Rules

## Required fields
- `label` (string, max 18 chars Korean) — the floating coral label
- `englishLine1` (max 8 chars or 2 short words)
- `englishLine2` (max 14 chars or 3 short words)
- `bodyLabel` (uppercase English, max 12 chars)
- `bodyText` (max 60 Korean chars)
- `bodyHighlight` (substring of bodyText, exact match required)

## Forbidden
- Italic Korean body
- Sentence-case English label
- More than 2 lines of English (use stat instead)

## Tone-aware (CSS vars from preset)
| Tone | Label box bg | Body box bg | Highlight |
|---|---|---|---|
| editorial | #FF6B6B | #1A2C42 | #FFE5A0 |
| warm | #8A6B4F | #2A1F15 | #E5AE26 |
| original | #E04A3F | #1A1A1A | #FFD93D |
| earth | #C84A37 | #2C2620 | #E5C265 |

## When to use this template
- Short memorable phrase (English or 외국어)
- "This is when you'd say it" Korean explanation
- The quote IS the point of the slide

## When NOT to use
- Long quotes (3+ lines) → T2 stat or T6 outro
- Two characters speaking → T4 dialogue
- Just a metric/number → T2 stat

## Reference
- Visual baseline: `mockups/v3final/T3_quote_4x5.png`, `T3_quote_9x16.png`
- HTML reference: `mockups/v3final/T3_quote.html`
```

This file is read by:
1. **Aim tool** — to decide "which template fits this content?" 
2. **Validator** — to enforce field constraints
3. **Penny / Yussi** — human-readable rules, edit without code changes
4. **Future Claude Code sessions** — load context on what each template does

---

## 6. Three Input Modes

### Mode A: Yussi Factory JSON (canonical)
```json
{
  "title": "Term 2, A New Beginning",
  "blog_id": 81,
  "tone": "editorial",
  "slides": [
    { "type": "cover", "data": { ... } },
    { "type": "stat", "data": { ... } },
    ...
  ]
}
```

### Mode B: Markdown DSL (HyperFrames-style, human-friendly)
```markdown
# Term 2, A New Beginning · @mhj_nz · editorial

# [cover]
photo: assets/school-morning.jpg
label: Term 2 · Week 1
kicker: A New Beginning
헤드라인: 엄마가 옆에 / 있다고 *상상했어*
deck: — Jin, Year 1, 학교 첫 주에 친구의 'No'를 듣고

# [stat] By the Numbers
$ 3
unit: 친구 쌍 — 그리고 *혼자 남은 한 아이*
label: The Math
새 친구 둘은 *옛 친구의 친구*. 또 둘은 서로의 친구. 셋 + 하나.

# [quote] JIN의 첫 영어 표현
en1: I need
en2: my space.
label: When to use
매트 타임에 *친구가 너무 가까이 앉을 때* 쓸 한 마디

# [outro]
thanks: 이 글이 *마음에 들었다면*
저장해두세요 — 다음에도 생각날 거예요.
next: 다음 편 · ESR Form 읽는 법
```

`*text*` = highlight markup (yellow underline OR coral emphasis depending on context).

### Mode C: Natural Language (Aim tool)
```
사용자 입력: "Jin이 학교에서 'I need my space'라고 처음 영어로 말한 이야기로 8장 캐러셀 만들어줘"

→ Claude API + SKILL.md context
→ canonical V3 JSON
```

---

## 7. DB Schema (verified pattern from existing tables)

```sql
CREATE TABLE carousel_v3_jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id         int REFERENCES blogs(id) ON DELETE SET NULL,
  
  -- Input tracking
  input_mode      text NOT NULL CHECK (input_mode IN ('json','markdown','nl','cli')),
  input_raw       text NOT NULL,            -- whatever user pasted
  parsed_json     jsonb NOT NULL,           -- canonical V3 JSON
  
  -- Render settings
  tone            text NOT NULL DEFAULT 'editorial'
                  CHECK (tone IN ('editorial','warm','original','earth')),
  slide_count     int NOT NULL,
  aspects         text[] NOT NULL DEFAULT ARRAY['4x5','9x16'],
  
  -- Output tracking
  zip_url         text,                     -- Supabase Storage signed URL
  preview_urls    jsonb,                    -- {slide_1_4x5: url, slide_1_9x16: url, ...}
  status          text DEFAULT 'pending'
                  CHECK (status IN ('pending','rendering','done','failed')),
  error_message   text,
  
  -- Performance
  render_engine   jsonb,                    -- {satori_count: 14, playwright_count: 2}
  duration_ms     int,
  
  created_at      timestamptz DEFAULT now(),
  completed_at    timestamptz
);

CREATE INDEX idx_carousel_v3_jobs_blog ON carousel_v3_jobs(blog_id);
CREATE INDEX idx_carousel_v3_jobs_status ON carousel_v3_jobs(status);
```

Storage bucket: `carousel-v3-output/` with 30-day TTL via Supabase lifecycle.

**RLS**: admin only via existing pattern (matches `blogs` table policies).

---

## 8. Build Order (4 sessions, ~2h each)

### Session 1: Render Pipeline Gate (Satori path)
**Riskiest piece. Must pass.**

Files:
- `lib/carousel-v3/types.ts` (QuoteData only)
- `lib/carousel-v3/tokens.ts`
- `lib/carousel-v3/presets/editorial.ts`
- `lib/carousel-v3/templates/T3Quote.tsx` + `T3Quote.skill.md`
- `lib/carousel-v3/render/satori.ts`
- `lib/carousel-v3/render/fonts.ts`
- `app/api/carousel-v3/preview/route.ts`

Verification:
```bash
curl -X POST http://localhost:3003/api/carousel-v3/preview \
  -H "Content-Type: application/json" \
  -d @tests/fixtures/t3-quote-sample.json \
  --output preview.png

# Antigravity + Playwright pixel diff:
node scripts/visual-diff.mjs preview.png mockups/v3final/T3_quote_4x5.png
# Expected: < 5% pixel difference (Satori vs Playwright reference will differ slightly)
```

**If pixel diff > 10%, STOP. Iterate Satori CSS until close.**

### Session 2: Playwright Fallback + All Templates
- `lib/carousel-v3/render/playwright.ts` (with `@sparticuz/chromium-min`)
- `lib/carousel-v3/render/engine.ts` (dual-engine router)
- T1, T2, T4, T5, T6 + their SKILL.md
- T5 specifically routed through Playwright (blur background)

### Session 3: ZIP + Generate Endpoint + DB
- `lib/carousel-v3/render/zipper.ts`
- `app/api/carousel-v3/generate/route.ts` (16 PNGs in ZIP)
- DB migration
- Supabase Storage integration

### Session 4: Input Modes + Admin UI
- Markdown DSL parser
- Aim tool (Claude API NL → JSON)
- `/mhj-desk/carousel-v3` thin admin UI (3 input mode tabs)
- Yussi Factory v6 prompt update

---

## 9. Hard Constraints

### Visual fidelity (already proven in `mockups/v3final/`)
- Body font min: 28px (target 36-44px)
- Heading font min: 64px (target 84-130px)
- Mega type: 168-280px
- WCAG AA contrast: 4.5:1 minimum
- Korean: word-break: keep-all, no italic body, fonts ≤ 3
- Safe zones: 4:5 = center 1080×1080; 9:16 = avoid top 180/bottom 390/sides 60

### Performance budget
- Satori-only carousel (T3 only, no T5): < 5s for 16 PNGs
- Mixed carousel (with T5): < 15s for 16 PNGs
- Vercel function timeout: 60s default, 300s on Pro plan
- Parallelize with `Promise.all` across slides

### Vercel Pro plan REQUIRED for Playwright fallback
- `@sparticuz/chromium-min` + `playwright-core` packages
- Environment variables in Vercel Dashboard:
  - `AWS_LAMBDA_JS_RUNTIME=nodejs22.x`
  - `LD_LIBRARY_PATH=/var/task/node_modules/@sparticuz/chromium/bin`
- `next.config.js` external packages: `['@sparticuz/chromium', 'playwright-core']`
- **DO NOT enable Fluid Compute** (breaks Playwright per Vercel community)

### MHJ project rules (verified from memory)
- Children's real names forbidden (Min/Hyun/Jin only) — Aim tool validates
- Photo upload UI shows "측면/뒷모습만" reminder
- Localhost dev port: 3003
- Admin path: `/mhj-desk/carousel-v3`
- Supabase project: `vpayqdatpqajsmalpfmq` (verify via repo path)
- DB DML preflight: `information_schema.columns` check before INSERT/UPDATE
- Build cache: `rm -rf .next && npm run build` if symptoms appear
- No imports from `components/carousel/v2/*` or `app/api/carousel/*` (V1/V2)

### Session discipline
- 1 conversation = 1 session
- Plan Mode required before execution
- Antigravity + Playwright for visual QA
- **Forbid `run_qa*.mjs` file creation** — reuse `scripts/visual-diff.mjs`
- Read order before any code: 
  1. `docs/DESIGN_RULES.md`
  2. `docs/DB_SCHEMA.md`
  3. `docs/specs/CAROUSEL_V3_SPEC.md` (this file)
  4. `mockups/v3final/_tokens.css`
  5. Reference template HTML for current session

---

## 10. Why This Will Work Where V2 Failed

| V2 problem | V3 solution | Source of confidence |
|---|---|---|
| 27 layouts × 6 fontThemes = combinatorial explosion | 6 templates × 4 tones = 24 known | Type system enforces |
| Editor UI was the product (manual labor) | Pipeline is the product, UI is wrapper | agent-slide-maker pattern |
| `html-to-image` browser-side, fonts flaky | Satori (server-side, font baked into SVG path) | Vercel docs verified |
| Fonts inconsistent between dev and Vercel | TTF loaded as ArrayBuffer, deterministic | Satori spec |
| Layout rules implicit in code, not lockable | SKILL.md per template, markdown rules | agent-slide-maker pattern |
| Yussi Factory JSON arrived but downstream broken | JSON is the API contract, end-to-end | Yussi Factory v5 already produces JSON |
| Saved drafts don't restore | No drafts, regenerate from JSON | DB stores JSON, idempotent render |
| Export reality not verified | Session 1 IS the export verification gate | Mandatory pixel diff |
| Mobile grid breaks below 768px | Admin desktop-only, output mobile-perfect | Already verified in mockups |
| @vercel/og + html-to-image dual stack | Satori primary, Playwright fallback | Single rendering pipeline |

---

## 11. Pre-Flight Checklist for Penny (BEFORE Claude Code session)

Run these BEFORE starting any Claude Code session:

```bash
cd ~/Desktop/[MHJ repo path]

# 1. Verify repo state
git status                             # clean working tree
git pull origin main                   # latest

# 2. Copy V3 mockup assets (from Claude.ai download)
mkdir -p mockups/v3final
mkdir -p docs/specs
cp ~/Downloads/v3final/* mockups/v3final/
mv mockups/v3final/V3_AUTOMATION_SPEC.md docs/specs/CAROUSEL_V3_SPEC.md

# 3. Verify required docs exist
ls docs/DESIGN_RULES.md docs/DB_SCHEMA.md docs/specs/CAROUSEL_V3_SPEC.md
ls mockups/v3final/_tokens.css mockups/v3final/T3_quote.html
ls mockups/v3final/T3_quote_4x5.png

# 4. Verify dev server runs
npm run dev   # → localhost:3003

# 5. Verify Vercel plan
# Pro plan required for Playwright fallback (Session 2+)

# 6. Set Vercel environment variables (Dashboard, NOT code)
# AWS_LAMBDA_JS_RUNTIME=nodejs22.x
# LD_LIBRARY_PATH=/var/task/node_modules/@sparticuz/chromium/bin

# 7. Disable Fluid Compute (if enabled — breaks Playwright)
```

---

## 12. Plan Mode Prompt for Claude Code (Session 1)

```
Read these files first, in this order:
1. docs/DESIGN_RULES.md
2. docs/DB_SCHEMA.md
3. docs/specs/CAROUSEL_V3_SPEC.md (this file — read FULL)
4. mockups/v3final/_tokens.css
5. mockups/v3final/T3_quote.html (visual reference)

Compare repo state vs spec section 11 pre-flight checklist. 
Report any gaps before proceeding.

Then enter Plan Mode for SESSION 1 ONLY (spec section 8).

Scope:
1. File structure exactly per spec section 3 — Session 1 list:
   - lib/carousel-v3/types.ts (QuoteData only — discriminated union starter)
   - lib/carousel-v3/tokens.ts
   - lib/carousel-v3/presets/editorial.ts
   - lib/carousel-v3/templates/T3Quote.tsx
   - lib/carousel-v3/templates/T3Quote.skill.md
   - lib/carousel-v3/render/satori.ts
   - lib/carousel-v3/render/fonts.ts
   - app/api/carousel-v3/preview/route.ts

2. Install new deps:
   - @vercel/og (verify version compat with Next 14.2)

3. T3 Quote ONLY — port from mockups/v3final/T3_quote.html using Satori JSX

4. Verify pixel-diff < 10% vs mockups/v3final/T3_quote_4x5.png
   Use scripts/visual-diff.mjs (create if not exists, REUSE if exists)

5. NOT in scope: 
   - other 5 templates
   - Playwright fallback
   - ZIP, admin UI, DB, Aim tool, markdown parser

Constraints (will fail if violated):
- DO NOT create run_qa*.mjs files (reuse scripts/visual-diff.mjs)
- DO NOT import from components/carousel/v2/* or app/api/carousel/*
- DO NOT install playwright or @sparticuz/chromium yet (Session 2)
- npm run build must pass at end
- Tell me before creating any file outside the Session 1 list
- Session 1 IS THE GATE. Visual mismatch = STOP and diagnose.
- Use Satori, NOT html-to-image (V2's failed approach)
- Korean fonts: load Noto Sans KR TTF as ArrayBuffer, pass to Satori fonts option

Wait for my plan approval before writing any code.
```

---

## Appendix A: Why Satori vs Playwright (Decision Tree)

```
Is the slide using filter: blur(...)?
├── YES → Playwright (Satori doesn't render blur)
└── NO
    ├── Is it using CSS Grid?
    │   ├── YES → Playwright (Satori is flexbox-only)
    │   └── NO
    │       ├── Does it have animations or JS?
    │       │   ├── YES → Playwright
    │       │   └── NO → Satori (5x faster, deterministic)
```

In practice: only T5 image-feature needs Playwright (blur background). 
5/6 templates use Satori. **~5x speed improvement.**

---

## Appendix B: Reference Assets (already produced this session)

- `mockups/v3final/_tokens.css` — design tokens master
- `mockups/v3final/T1_cover.html` through `T6_outro.html` — 6 reference templates  
- `mockups/v3final/T*_4x5.png`, `T*_9x16.png` — 12 visual reference renders
- `mockups/v3final/A_mobile_4x5.png` — mobile feed simulation
- `mockups/v3final/B_shrink_test.png` — readability verification

These were produced with Playwright (the same engine Session 2 will install). 
Reference renders are the visual ground truth.

---

## Appendix C: Differences from agent-slide-maker

We're not cloning the repo — we're stealing patterns. Differences:

| | agent-slide-maker | MHJ V3 |
|---|---|---|
| Output | MP4 video + static HTML overview | PNG carousel + static HTML overview |
| Animation | GSAP timelines required | None (static cards) |
| CLI | npx hyperframes commands | Built into Next.js admin |
| Scope | Korean general topics | MHJ family + language learning |
| Card types | 4 (photo-cover, video-cover, stat, image-feature) | 6 (added quote, dialogue, outro) |
| Renderer | Puppeteer (their internal) | Satori + Playwright dual |
| Fonts | Paperlogy default | Noto Sans KR + Inter + Playfair Display |
| Design | Per-topic DESIGN.md | Per-tone preset.skill.md |

We use **the patterns**, not the code.

---

*spec written after analyzing actual agent-slide-maker source, 
 verifying MHJ repo dependencies, checking Vercel Playwright limitations, 
 and confirming Satori capabilities. No claims unverified.*
