---
name: carousel-v3-template-cover
description: T1 Cover — hero photo + headline with accent underline. Always the first slide.
---

# T1 Cover — Generation Rules

## Required fields
- `label` (string, max 15 chars) — floating coral label on photo, e.g. "Term 2 · Week 1"
- `photoUrl` (optional string) — Supabase Storage URL; omit for gradient placeholder
- `kicker` (string, English phrase, max 20 chars) — eyebrow above headline
- `headline` (string, may contain \n for line break) — main heading in Korean
- `headlineAccent` (exact substring of `headline`) — gets #FFE5A0 brush-stroke underline
- `deck` (string, attribution/subtitle) — Playfair italic, English + Korean mix OK
- `pageNumber`, `brandName`

## Forbidden
- `headlineAccent` that is not an exact substring of `headline`
- More than 2 headline lines (\n)
- Italic Korean body text (deck is an exception — it is a title/subtitle element)

## When to use
- Always as the FIRST slide in the carousel
- Establishes topic/theme with hero image

## References
- mockups/v3final/T1_cover_4x5.png, T1_cover_9x16.png
- mockups/v3final/T1_cover.html
