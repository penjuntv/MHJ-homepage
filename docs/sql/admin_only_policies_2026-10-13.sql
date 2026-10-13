-- ✅ 적용 완료 — 2026-10-13 NZ (PeNnY "지금 막아" · "둘 다 지금 해" · "둘 다 지금 막아", Supabase MCP apply_migration 세 건:
--    homepage_images_bucket_admin_write · homepage_content_admin_only · homepage_carousel_bucket_page_events_admin_only).
--    다시 실행할 필요 없다 (다시 돌려도 결과는 같다).
--
-- 목적: 「로그인했다」 ≠ 관리자. 이 Supabase 는 YuStudy 와 같이 쓰고 YuStudy 는 가입이 열려 있어서,
--       `TO authenticated USING (true)` 정책은 아무 가입 계정에게 홈페이지를 열어 준다. 관리자 = public.mhj_is_admin()
--       (penjunetv@gmail.com 또는 service_role) — 앱 쪽 짝은 lib/admin.ts (middleware 가 쓴다). 관리자를 바꾸면 두 곳을 같이.
--
-- 적용 전 실측 (쓰기 없는 시험 — DO 블록 안에서 역할·JWT 클레임을 바꿔 시도하고 전부 되돌림):
--   · images 버킷: 쓰기 정책 3개가 TO public — anon 키만으로 올리기·덮기·지우기 가능 (객체 1,329개)
--   · 내용 표 16개: 일반 로그인 계정이 전부 고치기·넣기 가능, 구독자 16명 목록·숨긴 댓글·블로그 초안 읽기 가능
-- 적용 후 실측: anon = 전과 같음(공개 읽기 · 방문자 댓글·반응 INSERT) · 일반 로그인 계정 = 읽기 0(원래 공개인 표는 공개분만)·
--   고치기 0행·넣기 42501 · 관리자 = 전과 같음 · anon 키 Storage 올리기 403 · 공개 이미지 주소 200.
-- 바뀌지 않는 것: 공개 읽기 정책 · 서버 키 작업(RLS 를 거치지 않는다 — /api/track 의 page_events 기록 포함) · YuStudy 표.
-- 세 건 뒤 공유 DB 전체 재점검: 「로그인만 하면 쓰기」 정책은 방문자 댓글·반응 anon INSERT(의도) 둘뿐.

-- ── 1) images 버킷 (homepage_images_bucket_admin_write) ──
DROP POLICY IF EXISTS "auth upload images" ON storage.objects;
DROP POLICY IF EXISTS "auth update images" ON storage.objects;
DROP POLICY IF EXISTS "auth delete images" ON storage.objects;
DROP POLICY IF EXISTS images_admin_upload ON storage.objects;
DROP POLICY IF EXISTS images_admin_update ON storage.objects;
DROP POLICY IF EXISTS images_admin_delete ON storage.objects;

CREATE POLICY images_admin_upload ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'images' AND public.mhj_is_admin());

CREATE POLICY images_admin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'images' AND public.mhj_is_admin())
  WITH CHECK (bucket_id = 'images' AND public.mhj_is_admin());

CREATE POLICY images_admin_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'images' AND public.mhj_is_admin());

-- ── 2) 내용 표 16개 (homepage_content_admin_only) — 정책 이름·명령은 그대로, 조건만 관리자로 ──
-- 전부(ALL) 정책
ALTER POLICY auth_all_affiliate_links       ON public.affiliate_links USING ((SELECT public.mhj_is_admin())) WITH CHECK ((SELECT public.mhj_is_admin()));
ALTER POLICY authenticated_all_article_pages ON public.article_pages  USING ((SELECT public.mhj_is_admin())) WITH CHECK ((SELECT public.mhj_is_admin()));
ALTER POLICY authenticated_all_reactions    ON public.article_reactions USING ((SELECT public.mhj_is_admin())) WITH CHECK ((SELECT public.mhj_is_admin()));
ALTER POLICY authenticated_all_articles     ON public.articles        USING ((SELECT public.mhj_is_admin())) WITH CHECK ((SELECT public.mhj_is_admin()));
ALTER POLICY authenticated_all_comments     ON public.comments        USING ((SELECT public.mhj_is_admin())) WITH CHECK ((SELECT public.mhj_is_admin()));
ALTER POLICY authenticated_all_family       ON public.family_members  USING ((SELECT public.mhj_is_admin())) WITH CHECK ((SELECT public.mhj_is_admin()));
ALTER POLICY authenticated_all_gallery      ON public.gallery         USING ((SELECT public.mhj_is_admin())) WITH CHECK ((SELECT public.mhj_is_admin()));
ALTER POLICY "Allow authenticated write"    ON public.hashtag_presets USING ((SELECT public.mhj_is_admin())) WITH CHECK ((SELECT public.mhj_is_admin()));
ALTER POLICY authenticated_all_hero_slides  ON public.hero_slides     USING ((SELECT public.mhj_is_admin())) WITH CHECK ((SELECT public.mhj_is_admin()));
ALTER POLICY authenticated_all_magazines    ON public.magazines       USING ((SELECT public.mhj_is_admin())) WITH CHECK ((SELECT public.mhj_is_admin()));
ALTER POLICY authenticated_all_newsletters  ON public.newsletters     USING ((SELECT public.mhj_is_admin())) WITH CHECK ((SELECT public.mhj_is_admin()));
ALTER POLICY authenticated_all_settings     ON public.site_settings   USING ((SELECT public.mhj_is_admin())) WITH CHECK ((SELECT public.mhj_is_admin()));
ALTER POLICY authenticated_all_subscribers  ON public.subscribers     USING ((SELECT public.mhj_is_admin())) WITH CHECK ((SELECT public.mhj_is_admin()));

-- 명령별 정책
ALTER POLICY "Authenticated read all blogs" ON public.blogs USING ((SELECT public.mhj_is_admin()));
ALTER POLICY "Authenticated insert blogs"   ON public.blogs WITH CHECK ((SELECT public.mhj_is_admin()));
ALTER POLICY "Authenticated update blogs"   ON public.blogs USING ((SELECT public.mhj_is_admin())) WITH CHECK ((SELECT public.mhj_is_admin()));
ALTER POLICY "Authenticated delete blogs"   ON public.blogs USING ((SELECT public.mhj_is_admin()));

ALTER POLICY "Allow authenticated insert"   ON public.instagram_content WITH CHECK ((SELECT public.mhj_is_admin()));
ALTER POLICY "Allow authenticated update"   ON public.instagram_content USING ((SELECT public.mhj_is_admin())) WITH CHECK ((SELECT public.mhj_is_admin()));
ALTER POLICY "Allow authenticated delete"   ON public.instagram_content USING ((SELECT public.mhj_is_admin()));

ALTER POLICY landing_photos_auth_select_all ON public.landing_photos USING ((SELECT public.mhj_is_admin()));
ALTER POLICY landing_photos_auth_insert     ON public.landing_photos WITH CHECK ((SELECT public.mhj_is_admin()));
ALTER POLICY landing_photos_auth_update     ON public.landing_photos USING ((SELECT public.mhj_is_admin())) WITH CHECK ((SELECT public.mhj_is_admin()));
ALTER POLICY landing_photos_auth_delete     ON public.landing_photos USING ((SELECT public.mhj_is_admin()));

-- ── 3) 옛 carousel 버킷 · page_events (homepage_carousel_bucket_page_events_admin_only) ──
-- 옛 'carousel' 버킷(공개, 0개 — 지금 코드는 carousel-v3 버킷): 올리기·지우기가 bucket_id 만 봤다 → 아무 가입 계정이 공개 버킷에 올릴 수 있었다.
-- page_events(방문 기록 1,045행): INSERT 정책이 true → 아무 가입 계정이 가짜 방문을 넣을 수 있었다. 실제 기록은 /api/track 이 service_role 로 넣는다.
-- authenticated 의 page_events TRUNCATE 권한도 회수(RLS 는 TRUNCATE 를 못 막는다).
-- 실측: 전 = 가입 계정이 둘 다 됨 → 후 = anon·가입 계정 42501, 관리자·service_role OK, 1,045행·0개 그대로.
ALTER POLICY "Allow authenticated upload carousel" ON storage.objects
  WITH CHECK (bucket_id = 'carousel' AND (SELECT public.mhj_is_admin()));
ALTER POLICY "Allow authenticated delete carousel" ON storage.objects
  USING (bucket_id = 'carousel' AND (SELECT public.mhj_is_admin()));

ALTER POLICY "page_events insert (public)" ON public.page_events
  WITH CHECK ((SELECT public.mhj_is_admin()));
REVOKE TRUNCATE ON public.page_events FROM authenticated;
