-- ============================================================
-- MHJ RLS Policy Fix — Critical #4
-- 목적: {public} 역할의 과도한 ALL 정책을 제거하고
--       anon/authenticated 역할로 분리
-- 실행 전 반드시 백업 확인!
-- ============================================================

BEGIN;

-- ──────────────────────────────────────────────
-- 1. blogs (이미 authenticated 분리됨, anon SELECT만 수정)
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read published blogs" ON public.blogs;
CREATE POLICY "anon_select_blogs" ON public.blogs
  FOR SELECT TO anon USING (published = true);

-- ──────────────────────────────────────────────
-- 2. magazines
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Auth write magazines" ON public.magazines;
DROP POLICY IF EXISTS "Public read magazines" ON public.magazines;

CREATE POLICY "anon_select_magazines" ON public.magazines
  FOR SELECT TO anon USING (true);
CREATE POLICY "authenticated_all_magazines" ON public.magazines
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────
-- 3. articles
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Auth write articles" ON public.articles;
DROP POLICY IF EXISTS "Public read articles" ON public.articles;

CREATE POLICY "anon_select_articles" ON public.articles
  FOR SELECT TO anon USING (true);
CREATE POLICY "authenticated_all_articles" ON public.articles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────
-- 4. article_pages
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can manage article_pages" ON public.article_pages;
DROP POLICY IF EXISTS "Public can read article_pages" ON public.article_pages;

CREATE POLICY "anon_select_article_pages" ON public.article_pages
  FOR SELECT TO anon USING (true);
CREATE POLICY "authenticated_all_article_pages" ON public.article_pages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────
-- 5. article_reactions (anon INSERT 허용)
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin manage reactions" ON public.article_reactions;
DROP POLICY IF EXISTS "Anyone can insert reactions" ON public.article_reactions;
DROP POLICY IF EXISTS "Anyone can read reactions" ON public.article_reactions;

CREATE POLICY "anon_select_article_reactions" ON public.article_reactions
  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_article_reactions" ON public.article_reactions
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "authenticated_all_article_reactions" ON public.article_reactions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────
-- 6. comments (anon: approved만 SELECT, INSERT 허용)
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Auth manage" ON public.comments;
DROP POLICY IF EXISTS "Public insert" ON public.comments;
DROP POLICY IF EXISTS "Public read approved" ON public.comments;

CREATE POLICY "anon_select_comments" ON public.comments
  FOR SELECT TO anon USING (approved = true);
CREATE POLICY "anon_insert_comments" ON public.comments
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "authenticated_all_comments" ON public.comments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────
-- 7. subscribers (anon INSERT만 허용)
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.subscribers;
DROP POLICY IF EXISTS "Authenticated users can view subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Authenticated users can update subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Authenticated users can delete subscribers" ON public.subscribers;

CREATE POLICY "anon_insert_subscribers" ON public.subscribers
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "authenticated_all_subscribers" ON public.subscribers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────
-- 8. newsletters (admin 전용 — anon 접근 불가)
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Auth manage newsletters" ON public.newsletters;

CREATE POLICY "authenticated_all_newsletters" ON public.newsletters
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────
-- 9. family_members
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Auth write family" ON public.family_members;
DROP POLICY IF EXISTS "Public read family" ON public.family_members;

CREATE POLICY "anon_select_family_members" ON public.family_members
  FOR SELECT TO anon USING (true);
CREATE POLICY "authenticated_all_family_members" ON public.family_members
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────
-- 10. site_settings
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Auth write settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public read settings" ON public.site_settings;

CREATE POLICY "anon_select_site_settings" ON public.site_settings
  FOR SELECT TO anon USING (true);
CREATE POLICY "authenticated_all_site_settings" ON public.site_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────
-- 11. gallery
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Auth write" ON public.gallery;
DROP POLICY IF EXISTS "Public read" ON public.gallery;

CREATE POLICY "anon_select_gallery" ON public.gallery
  FOR SELECT TO anon USING (true);
CREATE POLICY "authenticated_all_gallery" ON public.gallery
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────
-- 12. hero_slides
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated write hero_slides" ON public.hero_slides;
DROP POLICY IF EXISTS "Public read hero_slides" ON public.hero_slides;

CREATE POLICY "anon_select_hero_slides" ON public.hero_slides
  FOR SELECT TO anon USING (true);
CREATE POLICY "authenticated_all_hero_slides" ON public.hero_slides
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ──────────────────────────────────────────────
-- 13. affiliate_links (anon: is_active=true만 SELECT)
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_select_affiliate_links" ON public.affiliate_links;
DROP POLICY IF EXISTS "auth_all_affiliate_links" ON public.affiliate_links;

CREATE POLICY "anon_select_affiliate_links" ON public.affiliate_links
  FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "authenticated_all_affiliate_links" ON public.affiliate_links
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

COMMIT;
