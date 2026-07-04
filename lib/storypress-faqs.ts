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
    a: "For ages 3–8. It's a gentle fit for homes where English isn't the first language, too. Words and stories adapt to your child — no level numbers, no pressure.",
  },
  {
    q: 'How does it work?',
    a: "Each day takes about 10 minutes. Your child meets 4 new words with pictures and sound → plays short games (spelling, matching, sentences) → then creates a story page using those words. After 10 days, the pages become a finished book. Words come back naturally through stories and games — so they stick without drilling.",
  },
  {
    q: 'How much does it cost?',
    a: 'StoryPress is free to start — your child creates their first full storybook, no credit card needed. After that, paid plans (Starter and Family) unlock unlimited books. Current pricing is always shown inside the app.',
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
    a: "4 words a day × 10 days = 1 storybook. Every day your child meets new words, plays with them, and creates a story page. By Day 10, they've made a complete book — and made every page along the way.",
  },
];
