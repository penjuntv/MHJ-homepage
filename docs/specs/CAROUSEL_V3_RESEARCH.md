# Research Summary — V3 Automation Spec

## Sources analyzed (2026-05-09)

### 1. agent-slide-maker-easy (cloned, full inspection)
- URL: https://github.com/Canine89/agent-slide-maker-easy
- It's a HyperFrames composition project (HeyGen's CLI)
- Pattern: SKILL.md per template type locks visual rules in markdown
- 4 card types: photo-cover / video-cover / stat / image-feature
- Per-topic DESIGN.md documents tone-specific rules
- Markdown DSL: `# [stat] By the Numbers` → JSON
- Overview HTML pattern: review BEFORE render
- Edit roundtrip: contenteditable → clipboard patch back to source

### 2. HyperFrames CLI (heygen.com)
- Commands: preview, render, lint, docs, snapshot
- Workflow: overview-first, render-second
- Topics structure: each topic = independent project under topics/
- Linter validates compositions before render

### 3. Satori / @vercel/og
- HTML+JSX → SVG → PNG pipeline
- 500KB bundle limit, flexbox-only, no Grid
- Korean fonts: TTF/OTF via fonts option
- Edge-runtime compatible
- ~1s per image (vs Playwright 5-50s)
- Built into Next.js App Router

### 4. Playwright + @sparticuz/chromium
- Required for: filter: blur, complex CSS, JS execution
- Vercel Pro plan required (maxDuration 300s)
- @sparticuz/chromium-min ~50MB (under Vercel 50MB limit)
- AWS_LAMBDA_JS_RUNTIME env var must be set in Dashboard
- LD_LIBRARY_PATH must be set in code
- DO NOT enable Fluid Compute (breaks Playwright)
- Performance CPU 5-10s vs Basic CPU 50s

### 5. Korean card news typography (8 sources earlier session)
- Body min 24px (target 28-44px)
- Heading min 64px (target 84-130px)
- Mega type 168-280px
- Korean: word-break: keep-all, no italic body
- Max 3 fonts

### 6. MHJ repo state (verified package.json)
- Next.js 14.2.35 (NOT 16 as in preferences)
- html-to-image, html2canvas, jszip already installed
- Playwright NOT installed
- @sparticuz/chromium NOT installed
- @vercel/og NOT installed
- All required docs exist (DESIGN_RULES, DB_SCHEMA, etc.)

## Key insights synthesized

1. **agent-slide-maker uses Puppeteer internally** (not Satori)
   But Satori is faster and Vercel-native — better choice for us
   
2. **SKILL.md is the killer pattern**
   Markdown rules > code comments because both LLM + humans read them

3. **Mode B (Markdown DSL) is critical**
   HyperFrames-style `# [stat] ...` is what makes Yussi Factory v6 simpler
   to write than JSON

4. **Dual-engine renderer is the right call**
   5/6 templates can use Satori (5x faster)
   Only T5 (blur background) needs Playwright

5. **Overview HTML before render**
   agent-slide-maker forces user to review overview before mp4 render
   We can do same: review HTML → confirm → ZIP

## V2's actual failure mode (now understood)

V2 failed not because the idea was wrong but because:
- Used html-to-image (browser-side, font-flaky)
- 27 layouts tried to be a Canva replacement
- No type enforcement
- No SKILL.md to lock rules
- Editor UI was the product, not pipeline

V3 inverts ALL of these.
