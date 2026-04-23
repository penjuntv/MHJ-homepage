import { supabase } from './supabase';

export interface SiteSetting {
  key: string;
  value: string;
  description: string | null;
}

// 기본값 (fallback)
export const DEFAULT_SETTINGS: Record<string, string> = {
  site_name: 'MHJ',
  site_subtitle: 'my mairangi',
  hero_label: 'Featured Story',
  intro_title: 'MAIRANGI',
  intro_subtitle: 'JOURNAL',
  intro_description: '세 딸과 함께하는 오클랜드 노스쇼어 라이프. 매일 마주하는 바다와 학교, 그리고 따뜻한 식탁의 기록을 나눕니다.',
  about_who_title: 'The Mairangi Family',
  about_who_description_en: 'Life on Auckland\'s North Shore — a studying mum, a stay-home dad, and three daughters: Min, Hyun, and Jin. Recording our family\'s second chapter in New Zealand.',
  about_who_description_kr: '뉴질랜드 오클랜드 노스쇼어 마이랑이 베이에 자리 잡은 우리 가족의 두 번째 챕터입니다. 기자 출신 아빠 PeNnY, 사회복지 석사 과정 중인 엄마 Yussi, 그리고 세 딸 Min·Hyun·Jin이 함께합니다.',
  about_who_image_url: '',
  about_vision_title: 'START TO GLOW',
  about_vision_description: '기자 출신의 아빠와 석사 과정을 밟고 있는 엄마, 그리고 세 명의 딸이 함께 일구는 뉴질랜드 삶의 기록입니다.',
  blog_title: 'The Journal',
  blog_description: '사회복지사 석사 과정과 일상을 기록하는 희종의 개인 서재입니다.',
  footer_description: '뉴질랜드 오클랜드 노스쇼어\n마이랑이 베이에서 기록하는\n우리 가족의 이야기',
  contact_location: 'Mairangi Bay, Auckland, New Zealand',
  contact_email: 'hello@mhj.nz',
  magazine_title: 'Magazine Shelf',
  magazine_hint: 'Scroll to explore',
  storypress_title: 'StoryPress',
  storypress_description: '',
  storypress_cta_url: '',
  storypress_cta_text: 'Join the Waitlist',
  storypress_hero_image_url: '',
  gallery_title: 'Photo Gallery',
  gallery_description: '마이랑이 베이에서 담아낸 우리 가족의 순간들.',
  welcome_title: 'Welcome to My Mairangi',
  welcome_description: 'A Korean family\'s life archive from Mairangi Bay, Auckland',
  about_image_url: '',
  about_family_image_url: '',
  site_title: 'MHJ',
  site_description: "A Korean family's life archive from Mairangi Bay, Auckland",
  intro_image_url: '',
  magazine_shelf_title: 'Magazine Shelf',
  magazine_shelf_hint: 'Scroll to explore',
  default_theme: 'system',
  social_instagram: '',
  social_facebook: '',
  social_youtube: 'https://www.youtube.com/@mhj_nz',
  social_threads: '',
  featured_post_id: '',
  // 에디토리얼 레이어 (세션 1 추가)
  editor_note: '',
  editor_note_updated_at: '',
  child_m_note: '',
  child_h_note: '',
  child_j_note: '',
  newsletter_cta_copy_a: '한 달에 두어 번, 조용한 편지를 보냅니다.',
  newsletter_cta_copy_b: '다음 편지를 가장 먼저 받아보세요.',
  pillar_whanau_intro: '',
  pillar_localguide_intro: '',
};

// 설명 매핑
export const SETTING_DESCRIPTIONS: Record<string, string> = {
  site_name: '사이트 이름 (내비게이션/푸터)',
  site_subtitle: '사이트 부제 (푸터 하단)',
  hero_label: '히어로 캐러셀 라벨',
  intro_title: '인트로 섹션 제목 (큰 글자)',
  intro_subtitle: '인트로 섹션 부제 (이탤릭)',
  intro_description: '인트로 섹션 본문',
  about_who_title: 'About WHO WE ARE 섹션 제목',
  about_who_description_en: 'About WHO WE ARE 영문 소개',
  about_who_description_kr: 'About WHO WE ARE 한글 소개',
  about_who_image_url: 'About WHO WE ARE 대형 가족 사진',
  about_vision_title: 'About 페이지 비전 타이틀',
  about_vision_description: 'About 페이지 비전 설명',
  blog_title: '블로그 페이지 제목',
  blog_description: '블로그 페이지 설명',
  footer_description: '푸터 브랜드 설명 (줄바꿈: \\n)',
  contact_location: '연락처 위치',
  contact_email: '연락처 이메일',
  magazine_title: '매거진 페이지 제목',
  magazine_hint: '매거진 스크롤 힌트',
  storypress_title: 'StoryPress 제목',
  storypress_description: 'StoryPress 설명',
  storypress_cta_url: 'StoryPress CTA URL (비워두면 뉴스레터 폼 표시)',
  storypress_cta_text: 'StoryPress CTA 버튼 텍스트',
  storypress_hero_image_url: 'StoryPress 히어로 이미지 URL',
  gallery_title: 'Gallery 페이지 제목',
  gallery_description: 'Gallery 페이지 설명',
  welcome_title: 'Welcome 페이지 제목',
  welcome_description: 'Welcome 페이지 설명',
  about_image_url: 'About 페이지 비전 섹션 가족사진 URL (레거시)',
  about_family_image_url: 'About 페이지 가족 대표 사진',
  site_title: '사이트 제목 (내비게이션/탭)',
  site_description: '사이트 부제 (히어로/메타)',
  intro_image_url: '인트로 섹션 대형 이미지 URL',
  magazine_shelf_title: '매거진 서가 페이지 제목',
  magazine_shelf_hint: '매거진 서가 스크롤 힌트',
  default_theme: '기본 테마 (light/dark/system)',
  social_instagram: 'Instagram URL (비워두면 숨김)',
  social_facebook: 'Facebook URL (비워두면 숨김)',
  social_youtube: 'YouTube URL (비워두면 숨김)',
  social_threads: 'Threads URL (비워두면 숨김)',
  // 에디토리얼 레이어 (세션 1 추가)
  editor_note: '홈 Hero 아래 에디터 노트 본문 — PeNnY가 매주 업데이트',
  editor_note_updated_at: '에디터 노트 최근 업데이트 ISO 일자 (예: 2026-04-24)',
  child_m_note: 'Footer/About에 노출되는 Min 한 줄 코멘트',
  child_h_note: 'Footer/About에 노출되는 Hyun 한 줄 코멘트',
  child_j_note: 'Footer/About에 노출되는 Jin 한 줄 코멘트',
  newsletter_cta_copy_a: '뉴스레터 CTA 첫 줄 — 기사 말미/홈 하단',
  newsletter_cta_copy_b: '뉴스레터 CTA 두 번째 줄',
  pillar_whanau_intro: 'Whanau(가족) 카테고리 페이지 상단 인트로',
  pillar_localguide_intro: 'Local Guide 카테고리 페이지 상단 인트로',
};

export async function getSiteSettings(): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value');
    if (error || !data?.length) return { ...DEFAULT_SETTINGS };
    const result = { ...DEFAULT_SETTINGS };
    for (const row of data) {
      result[row.key] = row.value;
    }
    return result;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}
