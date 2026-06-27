---
name: fact-verify
description: >
  Verify factual claims and external links in MHJ content BEFORE publishing. Use
  after drafting any blog post, info_block_html, or newsletter section that
  contains external URLs, statistics, prices, dates, or New Zealand–specific
  facts (visa rules, benefits, school zones, local events, opening hours). Catches
  hallucinated links (404s) and unverified claims. This skill does NOT do
  open-ended research — deep research lives in Claude Cowork. It only checks text
  that already exists.
allowed-tools: Read, Grep, Glob, Bash, WebFetch, WebSearch
---

# fact-verify — MHJ 발행 전 검증 게이트

## Purpose / 목적
This is a **verification gate**, not a research tool. It is the answer to
Pitfall **P-20** (Yussi Factory가 허구 링크를 생성 → 발행 후 404). Run it on a
finished draft right before publishing. 리서치를 시작하지 말 것 — 이미 쓰인
텍스트의 사실·링크만 점검한다.

## Role boundary / 역할 경계 (중요)
- **Claude Cowork** = 리서치·소스 수집 (재료 생산).
- **This skill** = 그 재료가 본문에 들어간 뒤, 사실·링크가 진짜인지 점검 (재료 검수).
- Never expand scope into "let me research this topic more." If a claim cannot be
  verified from existing sources in 1–2 lookups, flag it `[UNVERIFIED]` and stop.

## Absolute rules / 절대 규칙
- Names: only **PeNnY, Yussi, Min, Hyun, Jin**. If you see 유민/유현/유진/
  Yumin/Yuhyeon/Yujin/"Heejong Jo" anywhere, FAIL the check immediately.
- Content language is **NZ English**. Do not rewrite content here — only report.
- Identifier for blogs is **`slug`**, never `id`.

## Procedure / 절차

### 1. Link check (가장 중요)
- Extract every URL: `grep -oE 'href="[^"]+"'` on the draft / info_block_html.
- For each external URL, do a `WebFetch` (or `curl -sI -o /dev/null -w "%{http_code}"`).
  - 200/301/302 → PASS. 404/410/000(timeout/DNS) → FAIL.
  - **403/405 from a HEAD request is NOT a dead link** — many live pages
    (Amazon, govt portals) block HEAD. Before declaring FAIL, re-check with a
    GET + browser UA: `curl -sL -A "Mozilla/5.0" -o /dev/null -w "%{http_code}"`.
    Only FAIL if the GET still returns 4xx/5xx/000.
- For internal affiliate links of the form `/go/[slug]`:
  - Confirm the slug exists in the `affiliate_links` table (ask the Supabase step
    in the main project, or note it for manual SQL check). A `/go/` link with no
    matching row is a silent 404.

### 2. Affiliate compliance / 어필리에이트 규정
- Max **3** affiliate links per post.
- Every affiliate link must carry `rel="sponsored"`.
- Allowed programs only: **Amazon AU** (Associate ID `mhjnz-22`), Mighty Ape,
  Fishpond NZ. **Temu / AliExpress are banned** — FAIL if present.

### 3. Claim check / 주장 검증
- Extract statistics, prices, dates, proper nouns, and NZ-specific facts.
- Cross-check against a primary source. For NZ legal/visa/benefit/tax/school-zone
  claims, prefer official `*.govt.nz` sources (immigration.govt.nz,
  ero.govt.nz, ird.govt.nz, education.govt.nz).
- NZ rules change → treat anything older than ~12 months as stale and flag it.
- Prices and opening hours go stale fast; flag any that lack a "checked on" date.

### 4. Report only / 보고만
Output a table. **Do NOT auto-edit the body** — a human fixes flagged items.

| Item | Type | Result | Source / Note |
|------|------|--------|---------------|
| https://... | link | PASS/FAIL | status code |
| "$249 per term" | price | FLAG | no checked-on date |
| "from 2024 the rule…" | NZ law | UNVERIFIED | confirm at immigration.govt.nz |

End with: `PASS (n)  /  FAIL (n)  /  UNVERIFIED (n)`. If any FAIL → do not publish.

## Gotchas
- This is a read-only gate. If asked to "fix it too", refuse and hand the report
  to the human or to a separate edit step.
- Disclaimer: NZ legal/financial facts here are for editorial accuracy only, not
  legal/financial advice.

## Gotchas log (실패할 때마다 한 줄씩 추가)
- 2026-06-27: HEAD 요청이 Amazon AU에서 405, 일부 govt 페이지에서 거짓 404를
  반환 → GET + 브라우저 UA로 재확인 후에만 FAIL 판정. (link-check 절차에 반영)
