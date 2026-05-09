---
name: carousel-v3-template-quote
description: T3 Quote — short foreign phrase (English) + Korean "when to use" note.
             Use for memorable phrases that ARE the point of the slide.
---

# T3 Quote — Generation Rules

## Required fields
- `label` (string, max 18 KR chars) — coral floating label above the phrase
- `englishLine1` (string, ~8 chars / 2 short words)
- `englishLine2` (string, ~14 chars / 3 short words)
- `highlightWord` (`'line1' | 'line2'`) — which line gets the yellow underline
- `bodyLabel` (UPPERCASE English, max 12 chars) — "When to use", "Say it like", etc.
- `bodyText` (string, max 60 KR chars) — the explanation
- `bodyHighlight` (string) — exact substring of `bodyText` to highlight in yellow strong
- `pageNumber` (`{ current, total }`)
- `brandName` (string) — bottom-left handle line, e.g. `@mhj_nz · Term 2 · Week 1`

## Forbidden
- Italic Korean body text
- Sentence-case English in `bodyLabel` (must be UPPERCASE)
- More than 2 lines of English (use T2 stat instead)
- `englishLine1` or `englishLine2` longer than ~14 chars (overflows at 156px / 4:5)
- `bodyHighlight` that is not an exact substring of `bodyText`

## Tone-aware (CSS values from preset)

| Tone | Label box bg | Body box bg | Highlight |
|---|---|---|---|
| editorial | `#FF6B6B` | `#1A2C42` | `#FFE5A0` |
| warm | `#8A6B4F` | `#2A1F15` | `#E5AE26` |
| original | `#E04A3F` | `#1A1A1A` | `#FFD93D` |
| earth | `#C84A37` | `#2C2620` | `#E5C265` |

Session 1 ships `editorial` only. Other tones land in Session 2.

## When to use this template
- Short memorable foreign phrase (English or other language)
- "This is when you'd say it" Korean explanation
- The quote IS the point of the slide

## When NOT to use
- Long quotes (3+ lines) → T2 stat or T6 outro
- Two characters speaking → T4 dialogue
- Just a metric / number → T2 stat
- Photo + headline cover → T1 cover

## References
- Visual baseline: `mockups/v3final/T3_quote_4x5.png`, `T3_quote_9x16.png`
- HTML reference: `mockups/v3final/T3_quote.html`
- Test fixture: `tests/fixtures/t3-quote-sample.json`
- Component: `lib/carousel-v3/templates/T3Quote.tsx`
