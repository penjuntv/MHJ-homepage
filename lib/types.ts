export interface Magazine {
  id: string;            // '2026-03'
  year: string;
  month_name: string;    // 'Mar'
  title: string;
  editor: string;
  image_url: string;
  pdf_url?: string | null;          // 통합 PDF (매거진 전체)
  article_count?: number;           // 개별 기사 수 (서가 UI 뱃지용)
  color_theme?: string | null;      // 레거시 컬러 테마 키 (ocean, forest, ...)
  cover_subtitle?: string | null;   // 표지 부제목
  contributors?: string[] | null;   // 기여자 목록
  // Phase 2 new fields
  accent_color?: string | null;     // 커스텀 액센트 색상 (hex)
  cover_filter?: string | null;     // 사진 필터 (none/warm/cool/bw/vivid/muted)
  cover_copy?: string | null;       // 표지 카피 문구
  cover_images?: string[] | null;   // 추가 표지 이미지 배열
  issue_number?: string | null;     // 이슈 번호 ('01', '02', ...)
  bg_color?: string | null;         // 배경색 (hex)
  published?: boolean;              // 서가 노출 여부 (false면 숨김)
  created_at?: string;
}

export interface Article {
  id: number;
  magazine_id: string;   // FK → magazines.id
  title: string;
  author: string;
  date: string;          // '2026.03.02'
  image_url: string;
  content: string;
  pdf_url?: string | null;          // 이미지/PDF 콘텐츠 URL
  article_type?: 'cover' | 'contents' | 'article' | null;
  sort_order?: number | null;
  page_start?: number | null;       // 통합 PDF 내 시작 페이지
  page_end?: number | null;         // 통합 PDF 내 끝 페이지
  // Phase 2 new fields
  template?: string | null;         // 기사 템플릿 키 (classic/split/photo-hero/...)
  article_images?: string[] | null; // 추가 기사 이미지 배열
  image_positions?: string[] | null; // 각 이미지의 object-position
  article_status?: 'draft' | 'complete' | 'published' | null;
  created_at?: string;
}

export interface ArticleReaction {
  id: number;
  article_id: number;
  type: 'like' | 'comment';
  content?: string | null;
  author_name: string;
  created_at: string;
}

export interface Blog {
  id: number;
  category: 'Little 15 Mins' | 'Home Learning' | 'Whānau' | 'Settlement' | 'Life in Aotearoa' | 'Travelers';
  title: string;
  author: string;        // default 'Yussi'
  date: string;
  image_url: string;
  content: string;
  slug: string;
  meta_description?: string;
  og_image_url?: string;
  published: boolean;
  view_count?: number;
  tags?: string[];
  publish_at?: string | null;
  is_sponsored?: boolean;
  sponsor_name?: string | null;
  featured?: boolean;
  is_hero?: boolean;
  hero_order?: number;
  created_at?: string;
  info_block_html?: string | null;
}

export interface Comment {
  id: number;
  blog_id: number;
  name: string;
  email: string;
  content: string;
  approved: boolean;
  created_at: string;
  parent_id?: number | null;
  blog?: { title: string; slug: string };
}

export interface FamilyMember {
  id: number;
  name: string;
  role: string;
  bio: string;
  image_url: string;
  sort_order: number;
}

// 모달용 통합 타입
export type DetailItem = (Article | Blog) & {
  category?: string;
};

export interface HeroSlide {
  id: number;
  title: string;
  subtitle?: string | null;
  image_url: string;
  link_url?: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at?: string;
}

// HeroCarousel에서 사용하는 통합 타입
export interface HeroCarouselItem {
  id: string;           // blog:{id} or slide:{id}
  title: string;
  subtitle?: string;
  image_url: string;
  category?: string;
  author?: string;
  date?: string;
  content?: string;
  slug?: string;        // 블로그: /blog/{slug}
  link_url?: string;    // 커스텀 슬라이드: 임의 링크
  is_custom?: boolean;
}

// 새 HeroCarousel 슬라이드 타입 (5-slide showcase)
export interface CarouselSlide {
  key: string;
  type: 'blog' | 'magazine' | 'storypress';
  label: string;
  title: string;
  subtitle?: string;
  image_url?: string;
  cta_text: string;
  blog?: Blog;
  link_url?: string;
}

export interface ArticlePage {
  id?: number;
  article_id: number;
  page_number: number;
  template: string;      // classic/photo-hero/photo-essay/gallery/text-only/split
  content: string;
  images: string[];
  caption?: string | null;
  captions?: string[] | null;   // 사진별 캡션 (images[i] ↔ captions[i])
}

export interface GalleryItem {
  id: number;
  image_url: string;
  // 신규 필드 (photographer exhibition)
  title?: string | null;
  comment?: string | null;
  photographer?: string | null;   // 'Min' | 'Hyun' | 'Jin' | 'PeNnY' | 'Yussi'
  taken_date?: string | null;
  location?: string | null;
  published?: boolean;
  // 레거시 필드
  caption?: string | null;
  category?: string | null;
  date?: string | null;
  sort_order: number;
  created_at?: string;
}
