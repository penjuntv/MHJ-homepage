-- ⛔ 미적용 — 실행하려면 사용자 승인이 필요하다. (작성: 2026-09-05)
--
-- 목적: `blogs` 에 이어(→ `anon_blogs_revoke_write.sql`) 나머지 공개 스키마 전체에서
--       anon 롤의 쓰기 권한을 회수한다. **SELECT 는 아무것도 건드리지 않는다.**
--
-- ═══ 왜 안전한가 — 이 SQL 의 전제 ═══════════════════════════════════════
-- 대상 62개(테이블 60 + 뷰 2)는 **anon 이 지금도 쓸 수 없는 것들**이다.
-- 즉 이 회수는 "동작하던 것을 막는" 변경이 아니라, 이미 RLS 가 거절하는 일을
-- 권한 레이어에서도 거절하게 만드는 다층 방어다. 근거는 3중으로 실측했다:
--
--   ① 정책 실측 — 대상 62개 전부 RLS 활성이고, anon 에 적용되는 쓰기 정책이 없다.
--      ⚠️ `{anon}` 명시 정책만 세면 놓친다. `{public}` 롤 정책도 anon 에 적용된다 —
--      실제로 4개(curriculum_sessions·curriculum_word_progress·learning_progress·
--      placement_tests)가 `{public}` 쓰기 정책을 갖고 있었다.
--   ② 정책 내용 실측 — 그 `{public}` 정책들은 `get_my_children_ids()` 를 타고
--      `get_my_parent_id()` = `SELECT id FROM parents WHERE user_id = auth.uid()`
--      로 귀결된다. anon 은 `auth.uid()` 가 NULL 이라 통과할 수 없다.
--   ③ anon 키 REST 프로브(비파괴 — profile_id 에 존재할 수 없는 UUID, FK 로 보증):
--        curriculum_sessions       401 42501 permission denied for function get_my_children_ids
--        curriculum_word_progress  401 42501 (동일)
--        learning_progress         401 42501 (동일)
--        placement_tests           401 42501 new row violates row-level security policy
--        math_curriculum_coverage  500 55000 cannot insert into view
--        math_curriculum_mapping_audit  500 55000 cannot insert into view
--      → 뷰 2개는 업데이트 불가 뷰(`pg_relation_is_updatable`=0, INSTEAD 룰 0)라
--        grant 자체가 무력하다. 회수해도, 안 해도 동작은 같다.
--
-- ═══ 제외 대상 — 회수하면 실제로 깨진다 (2개) ═══════════════════════════
--   · comments          — `app/api/comments/route.ts:82` 가 **anon 클라이언트**
--                         (`import { supabase } from '@/lib/supabase'`)로 insert.
--   · article_reactions — `components/MagazineViewer.tsx:127` 가 브라우저에서 insert.
--                         `lib/supabase-browser.ts` 는 anon 키를 쓰고, 이 컴포넌트는
--                         공개 페이지 `app/(public)/magazine/[id]/page.tsx` 에 실린다
--                         (방문자는 비로그인 = anon).
--   이 둘은 anon INSERT 정책이 **의도된 것**이다. 목록에서 제외했다.
--
-- ═══ 주의 — 정책은 남지만 권한이 없어지는 2개 ═══════════════════════════
-- `page_events` 와 `subscribers` 는 anon INSERT **정책**이 있지만, 코드 실측 결과
-- 실제 쓰기는 전부 service_role 이다 — page_events 는 `app/api/track/route.ts`,
-- subscribers 는 `app/api/{subscribe,unsubscribe,send-newsletter,
-- process-welcome-sequence}/route.ts` 가 모두 `createAdminClient()`. 공개 페이지는
-- 읽기만 한다. 그래서 회수 대상에 넣었다 — 정책은 **유물(vestigial)** 이다.
--   ⚠️ 회수 후 두 테이블은 "정책은 허용하는데 권한이 없는" 상태가 된다. 동작은
--      fail-closed 로 안전하지만 다음 사람이 헷갈린다. 회수한다면 유물 정책
--      (`page_events` · `subscribers` 의 anon INSERT 정책)도 함께 정리하는 편이 낫다.
--      단, 그건 별도 판단이라 이 파일에는 넣지 않았다.
--   ⚠️ 반대로 나중에 "구독 폼을 서버 라우트 없이 브라우저에서 직접 insert" 하도록
--      바꾸면 이 회수 때문에 조용히 깨진다. 그때는 grant 를 되돌릴 것.
--
-- ═══ 적용 후 검증 (반드시) ═════════════════════════════════════════════
--   1) 재실측: 아래 "검증 쿼리" 로 anon 쓰기 grant 보유 대상이 comments ·
--      article_reactions **2개만** 남는지 확인.
--   2) 대조군: anon 키로 `PATCH /rest/v1/<대상>?id=eq.-1` → 204 에서
--      401 permission denied 로 바뀌는지 확인(권한이 실제로 문다는 증거).
--   3) 무영향: 라이브 `/` `/blog` `/magazine` `/gallery` `/feed.xml` 200 +
--      매거진 리액션 누르기(article_reactions) + 댓글 작성(comments) 실동작.
--   4) `node scripts/audit-endpoints.mjs` · `audit-name-exposure.mjs`.
--
-- 적용: Supabase MCP apply_migration 또는 SQL Editor.
begin;

-- ── 테이블 60개 ─────────────────────────────────────────────────────────
revoke insert, update, delete, truncate, references, trigger on table public.affiliate_links from anon;
revoke insert, update, delete, truncate, references, trigger on table public.article_pages from anon;
revoke insert, update, delete, truncate, references, trigger on table public.articles from anon;
revoke insert, update, delete, truncate, references, trigger on table public.carousel_v3_jobs from anon;
revoke insert, update, delete, truncate, references, trigger on table public.challenges from anon;
revoke insert, update, delete, truncate, references, trigger on table public.concept_keys from anon;
revoke insert, update, delete, truncate, references, trigger on table public.curriculum_mapping from anon;
revoke insert, update, delete, truncate, references, trigger on table public.curriculum_sessions from anon;
revoke insert, update, delete, truncate, references, trigger on table public.curriculum_weeks from anon;
revoke insert, update, delete, truncate, references, trigger on table public.curriculum_word_progress from anon;
revoke insert, update, delete, truncate, references, trigger on table public.daily_completion from anon;
revoke insert, update, delete, truncate, references, trigger on table public.daily_problems from anon;
revoke insert, update, delete, truncate, references, trigger on table public.daily_sessions from anon;
revoke insert, update, delete, truncate, references, trigger on table public.daily_word_sets from anon;
revoke insert, update, delete, truncate, references, trigger on table public.daily_words from anon;
revoke insert, update, delete, truncate, references, trigger on table public.difficulty_feedback from anon;
revoke insert, update, delete, truncate, references, trigger on table public.family_members from anon;
revoke insert, update, delete, truncate, references, trigger on table public.feedback from anon;
revoke insert, update, delete, truncate, references, trigger on table public.gallery from anon;
revoke insert, update, delete, truncate, references, trigger on table public.hashtag_presets from anon;
revoke insert, update, delete, truncate, references, trigger on table public.hero_slides from anon;
revoke insert, update, delete, truncate, references, trigger on table public.instagram_content from anon;
revoke insert, update, delete, truncate, references, trigger on table public.landing_photos from anon;
revoke insert, update, delete, truncate, references, trigger on table public.learning_progress from anon;
revoke insert, update, delete, truncate, references, trigger on table public.magazines from anon;
revoke insert, update, delete, truncate, references, trigger on table public.math_bank from anon;
revoke insert, update, delete, truncate, references, trigger on table public.math_concept_mastery from anon;
revoke insert, update, delete, truncate, references, trigger on table public.math_concept_prerequisites from anon;
revoke insert, update, delete, truncate, references, trigger on table public.math_curriculum_concepts from anon;
revoke insert, update, delete, truncate, references, trigger on table public.math_curriculum_units from anon;
revoke insert, update, delete, truncate, references, trigger on table public.math_daily_problem_assignments from anon;
revoke insert, update, delete, truncate, references, trigger on table public.math_hints from anon;
revoke insert, update, delete, truncate, references, trigger on table public.math_problem_concepts from anon;
revoke insert, update, delete, truncate, references, trigger on table public.math_submissions from anon;
revoke insert, update, delete, truncate, references, trigger on table public.math_topics from anon;
revoke insert, update, delete, truncate, references, trigger on table public.math_wrong_notes from anon;
revoke insert, update, delete, truncate, references, trigger on table public.newsletters from anon;
revoke insert, update, delete, truncate, references, trigger on table public.page_events from anon;
revoke insert, update, delete, truncate, references, trigger on table public.parents from anon;
revoke insert, update, delete, truncate, references, trigger on table public.placement_questions from anon;
revoke insert, update, delete, truncate, references, trigger on table public.placement_tests from anon;
revoke insert, update, delete, truncate, references, trigger on table public.profiles from anon;
revoke insert, update, delete, truncate, references, trigger on table public.push_tokens from anon;
revoke insert, update, delete, truncate, references, trigger on table public.quotes from anon;
revoke insert, update, delete, truncate, references, trigger on table public.sentence_bank from anon;
revoke insert, update, delete, truncate, references, trigger on table public.site_settings from anon;
revoke insert, update, delete, truncate, references, trigger on table public.star_transactions from anon;
revoke insert, update, delete, truncate, references, trigger on table public.streaks from anon;
revoke insert, update, delete, truncate, references, trigger on table public.subscribers from anon;
revoke insert, update, delete, truncate, references, trigger on table public.surprise_rewards from anon;
revoke insert, update, delete, truncate, references, trigger on table public.test_requests from anon;
revoke insert, update, delete, truncate, references, trigger on table public.test_results from anon;
revoke insert, update, delete, truncate, references, trigger on table public.topic_mastery from anon;
revoke insert, update, delete, truncate, references, trigger on table public.topic_prerequisites from anon;
revoke insert, update, delete, truncate, references, trigger on table public.translations from anon;
revoke insert, update, delete, truncate, references, trigger on table public.weekly_stories from anon;
revoke insert, update, delete, truncate, references, trigger on table public.wishes from anon;
revoke insert, update, delete, truncate, references, trigger on table public.word_bank from anon;
revoke insert, update, delete, truncate, references, trigger on table public.word_progress from anon;
revoke insert, update, delete, truncate, references, trigger on table public.words from anon;

-- ── 뷰 2개 (업데이트 불가 뷰 — 정리 목적) ───────────────────────────────
revoke insert, update, delete, truncate, references, trigger on table public.math_curriculum_coverage from anon;
revoke insert, update, delete, truncate, references, trigger on table public.math_curriculum_mapping_audit from anon;

commit;

-- ── 검증 쿼리 (적용 후 실행 — comments · article_reactions 2행만 나와야 한다) ──
-- select distinct table_name
--   from information_schema.table_privileges
--  where table_schema='public' and grantee='anon'
--    and privilege_type in ('INSERT','UPDATE','DELETE')
--  order by table_name;

-- ── 롤백 ────────────────────────────────────────────────────────────────
-- 위 목록의 `revoke` 를 `grant` 로, `from anon` 을 `to anon` 으로 바꿔 실행.
-- ⚠️ 되돌리면 스키마 전체가 다시 RLS 한 겹 의존으로 돌아간다.
--
-- ── 새 테이블을 만들 때 ─────────────────────────────────────────────────
-- Supabase 는 새 테이블에 anon 쓰기 grant 를 기본으로 붙인다. 즉 이 정리는
-- 한 번 하고 끝나지 않는다. 새 테이블마다 같은 판단(anon 쓰기가 필요한가?)을
-- 하고, 필요 없으면 위와 같이 회수할 것. 주간 감사에 편입하는 것도 방법이다.
