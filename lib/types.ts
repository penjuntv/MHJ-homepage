export interface Magazine {
  id: string;            // '2026-03'
  year: string;
  month_name: string;    // 'Mar'
  title: string;
  editor: string;
  image_url: string;
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
  created_at?: string;
}

export interface Blog {
  id: number;
  category: 'Daily' | 'School' | 'Kids' | 'Travel' | 'Food' | 'Immigration' | 'Bilingual' | 'Home' | 'Wellness';
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

export interface GalleryItem {
  id: number;
  image_url: string;
  caption?: string | null;
  category?: string | null;
  date?: string | null;
  sort_order: number;
  created_at?: string;
}
