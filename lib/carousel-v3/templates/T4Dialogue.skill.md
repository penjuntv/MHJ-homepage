---
name: carousel-v3-template-dialogue
description: T4 Dialogue — Q&A bubble exchange revealing a story moment. Use when content hinges on a contrast between what was said and what was felt.
---

# T4 Dialogue — Generation Rules

## Required fields
- `label` (string, max 12 chars) — coral label above, e.g. "The Reveal"
- `q.speaker` (string) — e.g. "JIN" (uppercase recommended)
- `q.text` (string, short English phrase with quotes, ~8 chars)
- `a.speaker` (string) — e.g. "친구"
- `a.text` (string, very short response, ~5 chars)
- `reveal` (string, max ~60 KR chars) — the plot twist in the body box
- `revealHighlight` (optional, exact substring of `reveal`) — highlighted in #FFE5A0

## Forbidden
- More than 2 bubbles (no triple dialogue)
- Long bubble text (> 15 chars overflows at 76px)
- revealHighlight not an exact substring of reveal

## When to use
- A scene that hinges on contrast: what was said vs. what was felt
- Short Q&A exchange followed by emotional reveal
- The "but actually..." moment in a story

## References
- mockups/v3final/T4_dialogue_4x5.png
- mockups/v3final/T4_dialogue.html
