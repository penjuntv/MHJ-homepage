// 홈 4개 기둥 — 카테고리 매핑 (옵션 B, 세션 5)
import { CATEGORY_TO_SLUG } from './constants';

// 2026-09-08 W2-C: 셀은 최신 글 본문이 아니라 그 글의 카테고리 허브로 간다(허브가 진입 문서). hubSlug 는 글이 없을 때 폴백.
// hubSlug 는 CATEGORY_TO_SLUG 에서 가져와 오타가 컴파일에서 잡히게 한다.
// Local Guide 는 Aotearoa 기둥에 편입(자체진단 F-D-04: 기둥 밖 카테고리는 IA 의 구멍). 그리드는 4열 유지.

export const PILLARS = [
  {
    id: 'storypress',
    name: 'StoryPress',
    categories: ['Little 15 Mins'],
    hubSlug: CATEGORY_TO_SLUG['Little 15 Mins'],
    subtitleKey: 'pillar_storypress_intro',
  },
  {
    id: 'aotearoa',
    name: 'Aotearoa',
    categories: ['Travelers', 'Life in Aotearoa', 'Local Guide'],
    hubSlug: CATEGORY_TO_SLUG['Life in Aotearoa'],
    subtitleKey: 'pillar_aotearoa_intro',
  },
  {
    id: 'homelearning',
    name: 'Home Learning',
    categories: ['Home Learning'],
    hubSlug: CATEGORY_TO_SLUG['Home Learning'],
    subtitleKey: 'pillar_homelearning_intro',
  },
  {
    id: 'whanau',
    name: 'Whānau',
    categories: ['Whānau', 'Settlement'],
    hubSlug: CATEGORY_TO_SLUG['Settlement'],   // 최신 글이 없을 때의 폴백. 셀은 보통 최신 글의 카테고리 허브로 간다(page.tsx)
    subtitleKey: 'pillar_whanau_intro',
  },
] as const;

export type Pillar = typeof PILLARS[number];
