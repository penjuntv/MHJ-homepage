---
name: verify
description: How to run MHJ locally and drive a change at its real surface (pages in Playwright, the QA CLIs). Recipe learned 2026-09-11 (W6-C); read before /verify or any runtime check.
---

# Verify recipe — MHJ homepage

## Setup (worktree under `.claude/worktrees/*`)
- No `.env.local` in a fresh worktree: `ln -s /Users/penny/MHJ_HOMEPAGE/.env.local .env.local` (gitignored).
- Port 3003 is the user's main-checkout dev server — **don't kill it**. Use 3013/3015 (prod) and 3014 (dev).
  The worktree has its own `.next`, so there is no cache clash with 3003.
- `find .next -mindepth 1 -delete && npm run build` for a clean prod build.

## Launch — one foreground command per session of checks
Background servers started in a separate tool call die between calls. Commands that print nothing for a
few minutes get killed (exit 144). So: start server with `&`, wait, run checks, kill — in ONE command,
with a heartbeat if anything runs >2 min:

```bash
( while sleep 20; do echo "· tick"; done ) & HB=$!
npx next start -p 3013 > /tmp/prod.log 2>&1 &
for i in $(seq 1 60); do curl -s -o /dev/null http://localhost:3013/ && break; sleep 1; done
node <playwright-script>.mjs          # require('playwright') via createRequire(<worktree>/package.json)
kill $HB; lsof -ti:3013 | xargs kill
```

- `next dev` **writes into `.next`** — never run dev while a prod server is serving from the same `.next`.
  Two `next start` on different ports reading one `.next` is fine.

## Flows worth driving
- `/magazine/[id]` splits four ways (page.tsx): `/magazine/2026-03` (IssueDetail, article `<a>` cards) ·
  `?page=1` (SpreadViewer reader) · `/magazine/2026-03/<slug>` (article page) · `/magazine/2026-01` (PDF viewer).
- `MagazineViewer`'s article grid/popup renders only for a non-legacy issue with BOTH `pdf_url` and published
  articles — none exist live. Drive it through a temporary `app/(public)/a11y-fixture-tmp/page.tsx` rendering
  `<MagazineViewer>` with fake props on the dev server; delete it afterwards and check `git status`.
- QA CLIs are surfaces too: `node scripts/qa/audit-a11y.mjs --base=http://localhost:3013 [--pages=… --json]`.
- Accessible names: read Chrome's AX tree over CDP (`Accessibility.getFullAXTree`), not `innerText`
  (innerText ignores `inert`/aria-hidden).

## Don't
- Don't click Like / submit comments on real or fixture pages — they INSERT into live Supabase
  (`article_reactions`) and `/api/track`. Seed `sessionStorage.mag_liked` to fake a liked state.
- Don't dispatch `site-audit.yml` to test a change — it runs against live and opens issues.
