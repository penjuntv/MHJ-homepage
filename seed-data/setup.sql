-- MHJ HOMEPAGE: Supabase 테이블 생성
-- Claude Code에서 Supabase SQL Editor에 붙여넣거나, 마이그레이션으로 실행

-- 1. 매거진
CREATE TABLE IF NOT EXISTS magazines (
  id TEXT PRIMARY KEY,
  year TEXT NOT NULL,
  month_name TEXT NOT NULL,
  title TEXT NOT NULL,
  editor TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 아티클 (매거진 내 글)
CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  magazine_id TEXT NOT NULL REFERENCES magazines(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  date TEXT NOT NULL,
  image_url TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 블로그
CREATE TABLE IF NOT EXISTS blogs (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('Daily', 'School', 'Kids', 'Travel', 'Food')),
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Heejong Jo',
  date TEXT NOT NULL,
  image_url TEXT NOT NULL,
  content TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  meta_description TEXT,
  og_image_url TEXT,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 가족 멤버
CREATE TABLE IF NOT EXISTS family_members (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- 5. 사이트 설정
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT
);

-- 사이트 설정 기본 데이터
INSERT INTO site_settings (key, value, description) VALUES
  ('site_name', 'MY MAIRANGI', '사이트 이름 (내비게이션/푸터)'),
  ('site_subtitle', 'Family Archive', '사이트 부제 (푸터 하단)'),
  ('hero_label', 'Featured Story', '히어로 캐러셀 라벨'),
  ('intro_title', 'MAIRANGI', '인트로 섹션 제목 (큰 글자)'),
  ('intro_subtitle', 'JOURNAL', '인트로 섹션 부제 (이탤릭)'),
  ('intro_description', '세 딸과 함께하는 오클랜드 노스쇼어 라이프. 매일 마주하는 바다와 학교, 그리고 따뜻한 식탁의 기록을 나눕니다.', '인트로 섹션 본문'),
  ('about_vision_title', 'START TO GLOW', 'About 페이지 비전 타이틀'),
  ('about_vision_description', '기자 출신의 아빠와 석사 과정을 밟고 있는 엄마, 그리고 세 명의 딸이 함께 일구는 뉴질랜드 삶의 기록입니다.', 'About 페이지 비전 설명'),
  ('blog_title', 'The Library', '블로그 페이지 제목'),
  ('blog_description', '사회복지사 석사 과정과 일상을 기록하는 희종의 개인 서재입니다.', '블로그 페이지 설명'),
  ('footer_description', E'뉴질랜드 오클랜드 노스쇼어\n마이랑이 베이에서 기록하는\n우리 가족의 이야기', '푸터 브랜드 설명'),
  ('contact_location', 'Mairangi Bay, Auckland', '연락처 위치'),
  ('contact_email', 'sangmok.jo@email.com', '연락처 이메일')
ON CONFLICT (key) DO NOTHING;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_articles_magazine ON articles(magazine_id);
CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs(published);

-- 7. RLS (Row Level Security) 정책
ALTER TABLE magazines ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 허용 (published 블로그만)
CREATE POLICY "Public read magazines" ON magazines FOR SELECT USING (true);
CREATE POLICY "Public read articles" ON articles FOR SELECT USING (true);
CREATE POLICY "Public read published blogs" ON blogs FOR SELECT USING (published = true);
CREATE POLICY "Public read family" ON family_members FOR SELECT USING (true);

-- 인증된 사용자만 쓰기 (관리자)
CREATE POLICY "Auth write magazines" ON magazines FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write articles" ON articles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write blogs" ON blogs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write family" ON family_members FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Public read settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Auth write settings" ON site_settings FOR ALL USING (auth.role() = 'authenticated');

-- 7. Storage 버킷 (이미지 업로드용)
-- Supabase 대시보드에서 수동 생성 필요:
-- 버킷 이름: mhj-images
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
