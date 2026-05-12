---
name: carousel-v3-template-stat
description: T2 Stat — single key metric displayed as a giant number with Korean unit label
             and supporting context in a dark body-box. Use when the NUMBER is the point.
---

# T2 Stat — Generation Rules

## Required fields
- `eyebrow` (string, UPPERCASE, max 20 chars) — e.g. `"BY THE NUMBERS"`. Already uppercase in data; Satori does not support textTransform.
- `number` (string, max 2 digits) — e.g. `"3"`, `"42"`. Longer numbers overflow the 380 px giant size at 4×5.
- `unitLabel` (string, max ~20 KR chars, keep-all) — describes what the number means.
- `unitLabelAccent` (string, optional) — exact substring of `unitLabel` rendered in `accentPrimary` coral. Must be a substring.
- `bodyLabel` (string, UPPERCASE English, max 12 chars) — e.g. `"THE MATH"`, `"IN NUMBERS"`.
- `bodyText` (string, max 60 KR chars) — supporting sentence in the dark body-box.
- `bodyHighlight` (string, optional) — exact substring of `bodyText` highlighted in `accentHighlight` yellow-bold. Must be a substring.
- `pageNumber` (`{ current: number; total: number }`)
- `brandName` (string) — bottom-left handle line, e.g. `"@mhj_nz · Term 2 · Week 1"`

## Forbidden
- `number` longer than 2 digits — overflows at 380 px (4×5) giant size.
- `unitLabelAccent` that is not an exact substring of `unitLabel`.
- `bodyHighlight` that is not an exact substring of `bodyText`.
- Lowercase `eyebrow` or `bodyLabel` — Satori ignores `textTransform: uppercase`; pass pre-uppercased strings.
- Sentence-case `bodyLabel` (e.g. `"The Math"` → must be `"THE MATH"`).

## Tone-aware (CSS values from preset)

| Tone | Body box bg | Highlight / Strong | Eyebrow / Accent |
|---|---|---|---|
| editorial | `#1A2C42` | `#FFE5A0` | `#FF6B6B` |

Session 1 ships `editorial` only. Other tones (warm / original / earth) land in Session 2.

## When to use this template
- One key metric IS the slide (school stats, weekly count, milestone number).
- Number is short (1–2 digits) and dramatic in Playfair Display italic.
- Supporting context fits in ~60 KR chars.

## When NOT to use
- Number has 3+ digits → consider splitting into multiple slides or using T6 outro.
- The slide is primarily a quote or phrase → T3 quote.
- Two speakers → T4 dialogue.
- Photo is the hero → T1 cover or T5 image-feature.

## References
- Visual baseline: `mockups/v3final/T2_stat_4x5.png`, `T2_stat_9x16.png`
- HTML reference: `mockups/v3final/T2_stat.html`
- Test fixture: `tests/fixtures/t2-stat-sample.json`
- Component: `lib/carousel-v3/templates/T2Stat.tsx`
