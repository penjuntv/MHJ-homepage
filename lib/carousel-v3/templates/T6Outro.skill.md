---
name: carousel-v3-template-outro
description: T6 Outro — dark card CTA + next-up box. Use as the final slide.
---

# T6 Outro — Generation Rules

## Required fields
- `eyebrow` (string, short English, e.g. "— Thank you for reading")
- `thanks` (string, 2 lines separated by \n, Playfair italic display heading)
- `thanksHighlight` (exact substring of `thanks`) — highlighted in #FFE5A0
- `ctaMessage` (string, Korean, 1-2 sentences)
- `ctaHighlight` (optional substring of ctaMessage) — highlighted in #FFE5A0 bold
- `actions` (array of 2-3 items: icon + text + optional textHighlight)
- `nextUp` (string, e.g. "다음 편 · ESR Form 읽는 법")
- `pageNumber` ({ current: number; total: number })
- `brandName` (string, e.g. "@mhj_nz · Mairangi Bay")

## Forbidden
- More than 2 lines in `thanks`
- `thanksHighlight` not an exact substring of `thanks`
- More than 3 action rows (layout overflow risk)
- Italic Korean text
- Omitting `eyebrow` or `nextUp`

## When to use
- Always as the LAST slide in the carousel
- CTA actions: save / share / like / read more (use ♡ or ↗ icons)
- `nextUp` previews the next episode or article

## Visual spec
- Background: #1A2C42 (COLOR.ink) — dark card
- Thanks heading: Playfair Display italic 700, #FAF8F5, highlight span #FFE5A0
- CTA message: Noto Sans KR 600, rgba(250,248,245,0.85), highlight #FFE5A0 bold
- Action rows: rgba(250,248,245,0.08) bg, 4px left border #FF6B6B
- Next-up box: #FF6B6B bg, pushed to bottom via marginTop: auto
- Zone-top/bottom: all text on-dark (#FAF8F5)

## Font sizes
| Element         | 4x5   | 9x16  |
|-----------------|-------|-------|
| thanks          | 100px | 130px |
| cta-message     | 32px  | 38px  |
| action text     | 26px  | 32px  |
| next-up title   | 26px  | 32px  |

## References
- Visual baseline: `mockups/v3final/T6_outro_4x5.png`, `T6_outro_9x16.png`
- HTML reference: `mockups/v3final/T6_outro.html`
