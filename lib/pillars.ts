// 홈 4개 기둥 — 카테고리 매핑 (옵션 B, 세션 5)
// Local Guide 카테고리는 기둥 밖. Journal 그리드에서만 노출.

export const PILLARS = [
  {
    id: 'storypress',
    name: 'StoryPress',
    categories: ['Little 15 Mins'],
    subtitleKey: 'pillar_storypress_intro',
  },
  {
    id: 'aotearoa',
    name: 'Aotearoa',
    categories: ['Travelers', 'Life in Aotearoa'],
    subtitleKey: 'pillar_aotearoa_intro',
  },
  {
    id: 'homelearning',
    name: 'Home Learning',
    categories: ['Home Learning'],
    subtitleKey: 'pillar_homelearning_intro',
  },
  {
    id: 'whanau',
    name: 'Whānau',
    categories: ['Whānau', 'Settlement'],
    subtitleKey: 'pillar_whanau_intro',
  },
] as const;

export type Pillar = typeof PILLARS[number];
