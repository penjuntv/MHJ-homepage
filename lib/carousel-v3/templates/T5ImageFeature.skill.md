---
name: carousel-v3-template-image-feature
description: T5 Image Feature — full-bleed photo with text overlay. Requires Playwright (filter:blur background). Session 2b.
---

# T5 Image Feature — STUB (Session 2b)

This template is NOT implemented in Session 2a. It requires the Playwright fallback
renderer because it uses `filter: blur(48px)` for the background effect, which Satori
cannot render.

## Planned fields (Session 2b)
- `photoUrl` (string, required) — full-bleed background image URL
- `kicker` (string)
- `title` (string, Korean headline)
- `titleAccent` (optional substring of title)
- `bodyText` (string, Korean body)
- `bodyHighlight` (optional substring)
- `pageNumber`, `brandName`

## Why Playwright
The background effect uses `filter: blur(48px)` on a duplicate of the photo,
which creates an editorial blurred-background look. Satori does not support
CSS `filter` property.

## Session 2b implementation plan
- Use `renderWithPlaywright()` from `lib/carousel-v3/render/playwright.ts`
- engine.ts already intercepts `type === 'image-feature'` and routes to Playwright
- Reference: `mockups/v3final/T5_image_feature.html`, `T5_image_feature_4x5.png`
