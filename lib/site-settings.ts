import { supabase } from './supabase';

export interface SiteSetting {
  key: string;
  value: string;
  description: string | null;
}

// 기본값 (fallback)
export const DEFAULT_SETTINGS: Record<string, string> = {
  site_name: 'MY MAIRANGI',
  site_subtitle: 'Family Archive',
  hero_label: 'Featured Story',
  intro_title: 'MAIRANGI',
  intro_subtitle: 'JOURNAL',
  intro_description: '세 딸과 함께하는 오클랜드 노스쇼어 라이프. 매일 마주하는 바다와 학교, 그리고 따뜻한 식탁의 기록을 나눕니다.',
  about_vision_title: 'START TO GLOW',
  about_vision_description: '기자 출신의 아빠와 석사 과정을 밟고 있는 엄마, 그리고 세 명의 딸이 함께 일구는 뉴질랜드 삶의 기록입니다.',
  blog_title: 'The Library',
  blog_description: '사회복지사 석사 과정과 일상을 기록하는 희종의 개인 서재입니다.',
  footer_description: '뉴질랜드 오클랜드 노스쇼어\n마이랑이 베이에서 기록하는\n우리 가족의 이야기',
  contact_location: 'Mairangi Bay, Auckland',
  contact_email: 'sangmok.jo@email.com',
  magazine_title: 'Magazine Shelf',
  magazine_hint: 'Scroll to explore',
  storypress_title: 'StoryPress',
  storypress_description: 'An English learning app born from our bilingual family journey. Designed for ESOL children who deserve a gentle, story-based path to language.',
  storypress_cta_url: '',
  storypress_cta_text: 'Join the Waitlist',
  gallery_title: 'Photo Gallery',
  gallery_description: '마이랑이 베이에서 담아낸 우리 가족의 순간들.',
  welcome_title: 'Welcome to My Mairangi',
  welcome_description: 'A Korean family\'s life archive from Mairangi Bay, Auckland',
  welcome_hero_image_url: '',
  default_theme: 'system',
};

// 설명 매핑
export const SETTING_DESCRIPTIONS: Record<string, string> = {
  site_name: '사이트 이름 (내비게이션/푸터)',
  site_subtitle: '사이트 부제 (푸터 하단)',
  hero_label: '히어로 캐러셀 라벨',
  intro_title: '인트로 섹션 제목 (큰 글자)',
  intro_subtitle: '인트로 섹션 부제 (이탤릭)',
  intro_description: '인트로 섹션 본문',
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
  gallery_title: 'Gallery 페이지 제목',
  gallery_description: 'Gallery 페이지 설명',
  welcome_title: 'Welcome 페이지 제목',
  welcome_description: 'Welcome 페이지 설명',
  welcome_hero_image_url: 'Welcome 히어로 이미지 URL',
  default_theme: '기본 테마 (light/dark/system)',
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
