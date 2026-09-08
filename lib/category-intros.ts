/**
 * 카테고리 허브 콘텐츠 — 소개문(허브 상단)·meta description·"Start here" 3편 (2026-09-08 W2-C).
 *
 * 왜: 자체진단 F-A-06·F-D-04 — 카테고리 7개 + /blog 가 같은 description 을 쓰고, 허브에 소개·큐레이션이 없어
 * "필터된 목록"일 뿐이었다. 검색엔진에는 카테고리마다 다른 주제 문장이, 독자에게는 첫 진입 글 3편이 필요하다.
 *
 * 관리자 덮어쓰기: site_settings 키 `category_intro_{slug}` 가 비어 있지 않으면 intro 를 대체한다(설정 페이지 CATEGORY INTROS).
 * description 은 코드에서만 관리한다(120~160자 규칙을 지키기 위해). 여기 문구는 사이트 카피이지 두 분의 글이 아니다.
 * startHere 는 기존 발행 글의 slug — 미발행·삭제된 slug 는 렌더 시 조용히 빠진다.
 */
export interface CategoryIntro {
  intro: string;
  description: string;
  startHere: string[];
}

export const CATEGORY_INTROS: Record<string, CategoryIntro> = {
  'home-learning': {
    intro: "Home Learning is where we work out what school in New Zealand actually asks of a child — and what we can do at the kitchen table. Reading aloud, Year 1 maths, term reports, the Year 7 jump and the NCEA changes ahead, written as we live them with three daughters on Auckland's North Shore.",
    description: 'Home learning notes from a Korean family in Auckland: starting school in NZ, Year 1 maths, term reports, the Year 7 jump and NCEA changes.',
    startHere: ['starting-school-in-new-zealand', 'setting-personal-routines', 'y7-kahu-manu-new-way-of-learning'],
  },
  'little-15-mins': {
    intro: 'Little 15 Mins began as fifteen minutes a day of words and stories with our youngest — and grew into StoryPress. Here are the small experiments: word cards, first play dates, the homework book, and the moments a four-year-old teaches us more than we teach her.',
    description: 'Fifteen minutes a day of words and stories with our youngest — word cards, first play dates, the homework book — the experiments behind StoryPress.',
    startHere: ['the-app-we-dreamt-of', 'the-word-cards', 'love-you-too-mummy-monster'],
  },
  settlement: {
    intro: 'Settlement is the practical side of moving a Korean family to New Zealand: how to read a mid-year school report, pack a Kiwi lunchbox, keep the kids safe, and make sense of the paperwork. The things we wish someone had written down before we arrived.',
    description: "Settling a Korean family in New Zealand: reading school reports, packing a Kiwi lunchbox, keeping kids safe — the practical notes we wish we'd had.",
    startHere: ['how-to-read-a-mid-year-report', 'how-to-pack-a-lunch', 'nz-keeping-ourselves-safe'],
  },
  'life-in-aotearoa': {
    intro: 'Life in Aotearoa is the everyday record — school terms and holidays, Matariki at home, cross-country season, night markets, library hauls and slow long weekends. Ordinary weeks in Mairangi Bay, kept because they pass too quickly.',
    description: 'Everyday life in Mairangi Bay, Auckland: school terms and holidays, Matariki at home, cross-country season, night markets and slow weekends.',
    startHere: ['a-quiet-week-before-the-break-ends', 'night-market-tuesdays', 'season-of-cross-country'],
  },
  'local-guide': {
    intro: "Local Guide covers the places we actually go with three kids on Auckland's North Shore: libraries from Albany to Birkenhead, parks and beaches, IKEA runs and Orewa fireworks. Written for families new to the area, by a family that was new not long ago.",
    description: "Family places on Auckland's North Shore — libraries, parks, beaches, IKEA and Orewa — from a Korean family that moved here not long ago.",
    startHere: ['library-tour-albany-village-library', 'ikea-nz-grown-ups-also-dream-at-ikea', 'orewa-surf-sounds-2026-fireworks-at-shore'],
  },
  whanau: {
    intro: 'Whānau is the Māori word for extended family, and the lens we use for the bigger questions: raising children between two cultures, growing without a score, and what a family owes one another. Longer essays, fewer answers.',
    description: 'Essays on family between two cultures: raising children in New Zealand as Korean parents, growing without a score, and what whānau means to us.',
    startHere: ['growing-without-a-score'],
  },
  travelers: {
    intro: 'Travelers is for the short trips that punctuate school terms — Rotorua weekends, road trips and the small discoveries along the way, seen through the eyes of three daughters and two parents still learning the country.',
    description: 'Short family trips around New Zealand between school terms — Rotorua weekends, road trips and small discoveries with three daughters.',
    startHere: ['locals-002'],
  },
};

/** 설정 덮어쓰기 적용 — 빈 값이면 코드 상수 */
export function resolveCategoryIntro(slug: string, settings: Record<string, string>): CategoryIntro | null {
  const base = Object.hasOwn(CATEGORY_INTROS, slug) ? CATEGORY_INTROS[slug] : null;
  if (!base) return null;
  const override = settings[`category_intro_${slug}`]?.trim();
  return override ? { ...base, intro: override } : base;
}
