# A4 — StoryPress FAQPage schema 주입 패치

## 목표

`app/(public)/storypress/page.tsx` 에 `schema.org/FAQPage` JSON-LD 추가.

이미 같은 페이지에 `SoftwareApplication` + `BreadcrumbList` schema 가 있으므로 그 옆에 하나 더 추가.

FAQ 7개의 원본은 `components/StoryPressFAQ.tsx` 안의 `FAQS` 상수.

## 두 가지 옵션 — 결정: 옵션 B 권장

### 옵션 A: FAQS 상수를 page.tsx 로 옮긴다

- 장점: 한 곳에서만 정의
- 단점: 클라이언트 컴포넌트가 prop 으로 받아야 해서 리팩터링 필요. PR 커짐.

### 옵션 B (권장): `lib/storypress-faqs.ts` 로 추출 → page.tsx 와 StoryPressFAQ.tsx 둘 다 import

- 장점: 단일 진실 소스(single source of truth), 코드 변경 최소
- 단점: 새 파일 1개

## 적용 절차 (옵션 B)

### Step 1. `lib/storypress-faqs.ts` 신규 생성

```ts
// lib/storypress-faqs.ts
// StoryPress FAQ 단일 진실 소스.
// components/StoryPressFAQ.tsx (UI) 와 app/(public)/storypress/page.tsx (FAQPage schema) 가
// 같은 데이터를 사용하도록 분리.

export interface StoryPressFAQ {
  q: string;
  a: string;
}

export const STORYPRESS_FAQS: StoryPressFAQ[] = [
  {
    q: 'What is StoryPress?',
    a: "StoryPress is an English storybook app for children aged 3–8. Every day, your child meets 4 new words, plays short games, and uses those words to create a story page. After 10 days, all the pages come together into a finished book — with your child's name on the cover. Born from our own bilingual family journey in Auckland.",
  },
  {
    q: 'Who is it for?',
    a: "Children aged 3–8 who are growing up with two languages. It works especially well for ESOL families, immigrant families, and children who need a gentle way into English — through stories, not pressure.",
  },
  {
    q: 'How does it work?',
    a: "Each day takes about 10 minutes. Your child meets 4 new words with pictures and sound → plays short games (spelling, matching, sentences) → then creates a story page using those words. After 10 days, the pages become a finished book. Words come back naturally — each one appears 14+ times — so they stick without drilling.",
  },
  {
    q: 'How much does it cost?',
    a: 'StoryPress is free to start — your child gets a full 10-day cycle to create their first storybook. No credit card needed. After that, plans start at $5.99/month.',
  },
  {
    q: 'How is it different from other apps?',
    a: "Most apps end with a quiz. StoryPress ends with a book. Your child doesn't just practise words — they use them to create something real. And when they bring that book home to show you, that's when the real magic happens. It's also designed specifically for bilingual families — not adapted from a general English app.",
  },
  {
    q: 'Is there a parent dashboard?',
    a: "Yes. Parents can track their child's progress and review today's words together. We designed it so learning becomes a shared family moment — not just screen time.",
  },
  {
    q: 'What is the 4-10 Method?',
    a: "4 words a day × 10 days = 1 storybook. Every day your child meets new words, plays with them, and creates a story page. By Day 10, they've made a complete book — and met over 40 English words along the way.",
  },
];
```

### Step 2. `components/StoryPressFAQ.tsx` 수정

기존 파일 상단의 `const FAQS = [ ... ]` 블록을 통째로 삭제하고 import 한 줄로 대체:

**삭제:** `const FAQS = [ ... 7개 객체 ... ];`

**추가 (파일 상단 import 영역):**
```ts
import { STORYPRESS_FAQS as FAQS } from '@/lib/storypress-faqs';
```

`FAQS` 라는 이름을 그대로 쓰므로 컴포넌트 본문은 변경 불필요.

### Step 3. `app/(public)/storypress/page.tsx` 에 FAQPage schema 추가

기존 파일에서 다음을 찾는다:

```ts
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  ...
};
```

바로 위에 import 추가:

```ts
import { STORYPRESS_FAQS } from '@/lib/storypress-faqs';
```

`jsonLd` 변수 정의 바로 다음에 `faqJsonLd` 추가:

```ts
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: STORYPRESS_FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.a,
    },
  })),
};
```

그리고 `<script type="application/ld+json">` 블록 두 개 (jsonLd, breadcrumbLd) 다음에 세 번째 블록 추가:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
/>
```

### Step 4. 검증

```bash
npm run build
# 빌드 통과 후
curl https://www.mhj.nz/storypress | grep -A 3 "FAQPage"
```

Google Rich Results Test (https://search.google.com/test/rich-results) 에 URL 넣어 검증.

---

## 주의 사항

- FAQS 텍스트를 미래에 수정할 때 **반드시 `lib/storypress-faqs.ts` 한 곳만 수정**.
- `'use client'` 가 `StoryPressFAQ.tsx` 상단에 있는데, `STORYPRESS_FAQS` 는 plain object 라 서버·클라 모두에서 동일하게 import 가능.
- FAQPage schema 에 들어가는 텍스트에는 HTML 태그 금지 (현재 텍스트는 plain text라 OK).
- 2026년 기준 Google이 FAQ rich result 노출을 축소했지만, AI 답변 엔진(ChatGPT, Claude, Perplexity)은 여전히 schema 활용. AEO 가치 보존.
