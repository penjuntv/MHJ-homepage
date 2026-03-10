export interface Magazine {
  id: string;            // '2026-03'
  year: string;
  month_name: string;    // 'Mar'
  title: string;
  editor: string;
  image_url: string;
  pdf_url?: string | null;   // 통합 PDF (매거진 전체)
  article_count?: number;    // 개별 기사 수 (서가 UI 뱃지용)
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
  created_at?: string;
}

export interface Blog {
  id: number;
  category: 'Education' | 'Settlement' | 'Girls' | 'Locals' | 'Life' | 'Travel';
  title: string;
  author: string;        // default 'Heejong Jo'
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
  is_hero?: boolean;
  hero_order?: number;
  created_at?: string;
}

export interface Comment {
  id: number;
  blog_id: number;
  name: string;
  email: string;
  content: string;
  approved: boolean;
  created_at: string;
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

export interface GalleryItem {
  id: number;
  image_url: string;
  caption?: string | null;
  category?: string | null;
  date?: string | null;
  sort_order: number;
  created_at?: string;
}
