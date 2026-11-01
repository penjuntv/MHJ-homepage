-- YuStudy DB 분리 Phase 4 — 옛 프로젝트(vpayqdatpqajsmalpfmq)에서 YuStudy 객체 지우기.
-- 목록 근거: mhj-yutudy/scripts/db-split-2026-10/phase4-delete-list.txt · HANDOFF_P 「관찰 중간 (11/1)」(YuStudy 세션: 지워도 된다, 11/3 NZ 뒤).
-- 남기는 것: public.mhj_is_admin() (홈페이지 RLS 가 씀), 로그인 계정 80b7fc22 (PeNnY).
-- 사전 점검(2026-11-02, 읽기만): 홈페이지 코드 사용처 0 · 바깥 FK 0 · 바깥 뷰 0 · 바깥 트리거 0 · 바깥 함수 본문 참조 0 ·
--   바깥 정책은 아래 Storage 정책 2개뿐(목록에 있음) · 시퀀스 23개 모두 표 소유(표와 함께 지워짐) · auth.users 를 참조하는 public FK 는 parents 하나.
-- CASCADE 를 쓰지 않는다 — 목록 밖 의존이 있으면 실패하고 전체가 되돌아간다.
-- 버킷(yustudy-tts 349개·math-submissions 0개)의 파일과 버킷 자체는 Storage API 로 지운다(SQL 로 storage.objects 를 지우면 실제 파일이 남는다).
-- 계정은 Auth Admin API 로 지운다: 141532ae (QA 부모) · 5d3106ee (PeNnY 확인 뒤에만).

BEGIN;

-- Storage 정책 2
DROP POLICY math_submissions_photos_read_own_children ON storage.objects;
DROP POLICY math_submissions_photos_upload_own_children ON storage.objects;

-- 뷰 4
DROP VIEW public.math_curriculum_coverage, public.math_curriculum_mapping_audit,
  public.math_submissions_effective, public.routine_events_daily_rollup;

-- 표 57 (트리거 12·시퀀스 23 은 표와 함께 지워진다)
DROP TABLE
  public.challenges, public.concept_keys, public.curriculum_mapping, public.curriculum_sessions,
  public.curriculum_weeks, public.curriculum_word_progress, public.daily_completion, public.daily_problems,
  public.daily_sessions, public.daily_word_sets, public.daily_words, public.difficulty_feedback,
  public.feedback, public.learning_progress, public.math_bank, public.math_concept_mastery,
  public.math_concept_prerequisites, public.math_curriculum_concepts, public.math_curriculum_units,
  public.math_daily_problem_assignments, public.math_hints, public.math_problem_concepts,
  public.math_submission_corrections, public.math_submission_effects, public.math_submission_followups,
  public.math_submissions, public.math_topics, public.math_wrong_notes, public.my_quests,
  public.notification_log, public.notification_settings, public.parents, public.placement_questions,
  public.placement_tests, public.play_events, public.profiles, public.push_subscriptions,
  public.push_tokens, public.quiz_answers, public.quotes, public.routine_events, public.sentence_bank,
  public.star_transactions, public.streaks, public.surprise_rewards, public.test_requests,
  public.test_results, public.test_schedules, public.topic_mastery, public.topic_prerequisites,
  public.translations, public.weekly_stories, public.wishes, public.word_bank, public.word_challenges,
  public.word_progress, public.words;

-- 함수 69
DROP FUNCTION public.add_math_wrong_notes(p_profile_id uuid, p_problem_ids integer[]);
DROP FUNCTION public.apply_level_suggestion(p_profile_id uuid);
DROP FUNCTION public.apply_sm2_for_word(p_profile_id uuid, p_word_id integer, p_quality integer);
DROP FUNCTION public.assert_owned_profile(p_profile_id uuid);
DROP FUNCTION public.auto_set_completed_at();
DROP FUNCTION public.check_challenges_on_complete(p_profile_id uuid, p_results jsonb);
DROP FUNCTION public.check_math_level_up(p_profile_id uuid);
DROP FUNCTION public.check_word_mastery();
DROP FUNCTION public.claim_daily_reminder(p_parent_id uuid);
DROP FUNCTION public.claim_scheduled_test(p_profile_id uuid);
DROP FUNCTION public.claim_test_assigned(p_parent_id uuid);
DROP FUNCTION public.complete_curriculum_day(p_profile_id uuid);
DROP FUNCTION public.compute_level_suggestion(p_profile_id uuid);
DROP FUNCTION public.daily_completion_monotonic();
DROP FUNCTION public.dismiss_level_suggestion(p_profile_id uuid, p_lock boolean);
DROP FUNCTION public.estimate_curriculum_level(p_profile_id uuid);
DROP FUNCTION public.expire_old_challenges();
DROP FUNCTION public.finalize_daily_completion_atomic(p_profile_id uuid);
DROP FUNCTION public.finalize_daily_routine_atomic(p_profile_id uuid);
DROP FUNCTION public.generate_test_v3(p_profile_id uuid, p_blueprint jsonb);
DROP FUNCTION public.generate_weekly_test_v2(p_profile_id uuid, p_total integer, p_lookback_days integer);
DROP FUNCTION public.gentle_new_word_ids(p_profile_id uuid, p_grade integer, p_from_week integer, p_week integer, p_day integer, p_today date, p_count integer);
DROP FUNCTION public.get_adaptive_math(p_profile_id uuid, p_count integer, p_exclude_ids integer[], p_prefer_v5 boolean);
DROP FUNCTION public.get_adaptive_math_debug(p_profile_id uuid, p_count integer, p_exclude_ids integer[]);
DROP FUNCTION public.get_concept_international_view(p_concept_key text);
DROP FUNCTION public.get_content_runway(p_profile_id uuid);
DROP FUNCTION public.get_curriculum_progress(p_profile_id uuid);
DROP FUNCTION public.get_curriculum_word_breakdown(p_profile_id uuid);
DROP FUNCTION public.get_daily_init(p_profile_id uuid);
DROP FUNCTION public.get_home_dashboard(p_profile_id uuid);
DROP FUNCTION public.get_my_children_ids();
DROP FUNCTION public.get_my_parent_id();
DROP FUNCTION public.get_next_words(p_profile_id uuid, p_count integer);
DROP FUNCTION public.get_random_math(p_year_level integer, p_topic text, p_difficulty integer, p_count integer, p_exclude_ids integer[], p_auto_gradable_only boolean);
DROP FUNCTION public.get_random_sentences(p_level text, p_year_level integer, p_count integer);
DROP FUNCTION public.get_random_words(p_level text, p_year_level integer, p_count integer, p_exclude_ids integer[]);
DROP FUNCTION public.get_sentence_for_word(p_word_id integer);
DROP FUNCTION public.get_session_config(p_profile_id uuid);
DROP FUNCTION public.get_today_curriculum_words(p_profile_id uuid);
DROP FUNCTION public.get_translation(p_item_type text, p_item_id text, p_lang text);
DROP FUNCTION public.increment_math_done(p_profile_id uuid, p_date date);
DROP FUNCTION public.init_daily_mix_session(p_profile_id uuid, p_new_word_ids uuid[], p_review_word_ids uuid[], p_math_problem_ids integer[]);
DROP FUNCTION public.mark_daily_mix_session(p_profile_id uuid);
DROP FUNCTION public.math_apply_judgement_correction(p_submission_id integer, p_expected_profile_id uuid, p_expected_problem_id integer, p_expected_original boolean, p_corrected boolean, p_reason text, p_basis text, p_judgement_version text, p_run_id text);
DROP FUNCTION public.math_deactivate_judgement_correction(p_correction_id bigint, p_reason text);
DROP FUNCTION public.math_followup_run_one(p_submission_id integer, p_step text, p_with_auth boolean);
DROP FUNCTION public.math_followups_recover_for_profile(p_profile_id uuid);
DROP FUNCTION public.math_followups_run(p_limit integer);
DROP FUNCTION public.math_recompute_concept_mastery(p_profile_id uuid, p_concept_key text);
DROP FUNCTION public.math_recompute_concept_mastery_for_problems(p_profile_id uuid, p_problem_ids integer[]);
DROP FUNCTION public.on_session_complete();
DROP FUNCTION public.on_test_complete();
DROP FUNCTION public.on_wish_redeemed();
DROP FUNCTION public.parent_set_english_level(p_profile_id uuid, p_year integer, p_level text, p_lock boolean);
DROP FUNCTION public.record_curriculum_attempt(p_profile_id uuid, p_word_id uuid, p_phase text, p_correct boolean);
DROP FUNCTION public.record_routine_event(p_profile_id uuid, p_event_name text, p_dedupe_key text, p_entry_source text, p_step_kind text, p_step_index integer, p_elapsed_ms integer, p_routine_version text);
DROP FUNCTION public.record_word_attempt(p_profile_id uuid, p_word_id integer, p_kind text, p_correct boolean);
DROP FUNCTION public.refresh_level_suggestion();
DROP FUNCTION public.resolve_curriculum_grade(p_profile_id uuid);
DROP FUNCTION public.resolve_wrong_note_on_correct();
DROP FUNCTION public.routine_events_guard();
DROP FUNCTION public.run_placement_test(p_profile_id uuid, p_correct integer, p_total integer);
DROP FUNCTION public.skip_placement_for_testing(p_profile_id uuid);
DROP FUNCTION public.submit_math_answer(p_profile_id uuid, p_problem_id integer, p_attempt_id uuid, p_is_correct boolean, p_user_answer text, p_ai_feedback text, p_photo_url text, p_time_spent_ms integer);
DROP FUNCTION public.sync_profile_placement_from_lp();
DROP FUNCTION public.try_unlock_next_week(p_profile_id uuid);
DROP FUNCTION public.update_streak_on_complete(p_profile_id uuid);
DROP FUNCTION public.update_topic_mastery_on_submission();
DROP FUNCTION public.upsert_translation(p_item_type text, p_item_id text, p_lang text, p_translated_text text, p_source_api text);

COMMIT;
