# YuStudy 데이터베이스 분리 계획 (2026-09)

> 작성 2026-09-13 · 실측 기준 Supabase 프로젝트 `vpayqdatpqajsmalpfmq`(MHJ HOMEPAGE, ap-southeast-2 시드니)
> 실행: Phase 0~3 은 YuStudy 저장소 세션, Phase 4 는 이 저장소 세션.
> **상태(2026-09-14): 보류.** PeNnY 가 YuStudy 세션의 "0원 계획" ①안(분리 보류 + 무료 강화)을 채택 — D1(새 프로젝트)·9/23 전환·Phase 4 는 **취소**.
> 적용된 것: YuStudy 함수 리전 `sin1`→`syd1`(`/profile` 중앙값 1,379→403ms) · YuStudy 콘텐츠 테이블 TRUNCATE 회수(YuStudy 마이그레이션 00029). D5(`…@mhj.nz` 계정 삭제)는 9/13 완료.
> 남은 것: 사용처별 비밀 키 발급(PeNnY) · YuStudy DDL 은 홈페이지 한산 시간대(NZ 01~05시)에 · `public` 스키마 기본 권한 회수(홈페이지 세션 적용, PeNnY 승인 대기).
> 다시 꺼낼 조건: YuStudy 를 가족 밖으로 열 때 · 관리자 키 유출 · StoryPress 정리로 서버 크레딧에 자리가 날 때 · Supabase 요금제 변경. 그때는 Phase 0 기준선만 새로 잰다.
> (아래 본문은 2026-09-13 원안 그대로 보관)

## 요약

YuStudy 를 **새 Supabase 프로젝트(시드니)로 옮기고**, 홈페이지는 지금 프로젝트에 그대로 둔다.

| | |
|---|---|
| 비용 | 새 프로젝트 **월 $10**(Pro 조직, Micro 컴퓨트 — `get_cost` 실측) |
| 홈페이지 중단 | **0** — 홈페이지 쪽은 전환 뒤 YuStudy 객체를 지우는 것뿐 |
| YuStudy 중단 | **30~60분**(전환 창) + 사용자 전원 **재로그인 1회** |
| 앱 재배포 | **없음** — Capacitor 가 `server.url: https://mhj-yutudy.vercel.app` 을 불러온다. Vercel 환경변수만 바꾼다 |
| 옮기는 양 | 테이블 49 · 뷰 3 · 함수 59 · 트리거 12 · 행 8,161 · 7.5MB · 인증 사용자 2 |

---

## 1. 왜 나누나 — 실측

1. **한 프로젝트에 두 제품이 섞여 있다.** `public` 테이블 67개 중 **49개가 YuStudy**, 18개가 홈페이지. 함수 71개 중 59개, 트리거 14개 중 12개가 YuStudy. 마이그레이션 기록 270건 중 이름으로 가르면 YuStudy 177 · 홈페이지 51 · 불명 42.
2. **YuStudy 의 스키마 변경이 홈페이지 API 를 멈칫하게 한다.** DDL 마다 PostgREST 가 스키마 캐시를 다시 읽는다(2026-03-17 이후 526회, 매번 1,194개 타임존 조회 평균 443ms 포함). 2026-09-12 03:30:44 YuStudy 마이그레이션(`routine_events_notification_source`) 직후 PostgREST 연결 풀이 두 번 재초기화됐고 스키마 조회에 1.8초가 걸렸다. 504 의 주원인이던 함수 리전 문제는 PR #75 로 풀렸고, 이것이 남은 두 번째 원인이다.
3. **키 하나가 아이들 학습 데이터까지 연다.** 홈페이지 `service_role` 키는 Vercel 환경변수 · GitHub Actions(주간 site-audit) · 로컬 `.env.local` · 각종 스크립트에 있다. 이 키로 `profiles`(7행, `name_kr` 7행 채워짐) · `math_submissions`(509행) 같은 아이 데이터를 읽고 쓸 수 있다. 반대로 YuStudy 키로 홈페이지 `blogs`·`subscribers` 를 고칠 수 있다. 홈페이지의 P0(아이 실명)와 같은 무게의 문제다.
4. **소음.** 성능 어드바이저 경고(RLS initplan 23건 · FK 인덱스 없음 31건)의 거의 전부가 YuStudy 테이블이다. 주간 감사 ⑨⑩ 허용 목록에 "YuStudy 소유 — 소유자 확인 필요" 로 동결한 뷰 2개가 있다.
5. **YuStudy 문서의 전제가 틀려 있다.** YuStudy `CLAUDE.md:300` 은 DB 를 "Singapore" 로 적고 Vercel 리전을 `sin1` 로 두었다. 실제 DB 는 시드니다. 새 프로젝트를 시드니에 만들고 Vercel 리전을 `syd1` 로 맞추면 YuStudy 도 홈페이지가 #75 에서 얻은 개선(검색 1.24→0.21초)을 얻는다.

## 2. 대안

| 안 | 내용 | 판단 |
|---|---|---|
| A | 그대로 두고 완화(마이그레이션 시간대 규칙 · 컴퓨트 증설) | 키 하나가 두 제품을 여는 문제가 남는다. 임시책으로만 |
| **B** | **YuStudy 를 새 프로젝트로** | **권장** — 월 $10, YuStudy 30~60분 중단 |
| C | 홈페이지를 새 프로젝트로 | **기각** — 이미지 1,117개(1.7GB)가 본문·OG·**이미 발송한 뉴스레터 22호**에 `vpayqdatpqajsmalpfmq.supabase.co/storage/…` 절대 URL 로 박혀 있다. 옮기면 지난 메일의 이미지가 깨진다 |
| D | StoryPress 프로젝트(`MJH_Press`, 싱가포르)에 합치기 | **기각** — 같은 섞임을 다른 곳에 만든다. 리전도 멀다 |

## 3. 무엇이 어디로

두 제품 사이에 **외래 키가 하나도 없다**(pg_constraint 실측). YuStudy 코드는 홈페이지 테이블을, 홈페이지 코드는 YuStudy 테이블을 쓰지 않는다(두 저장소 grep). 이음매가 깨끗하다.

### YuStudy 로 옮기는 것

- **테이블 49**: `profiles` `parents` · 학습 기록(`curriculum_sessions` `curriculum_word_progress` `daily_completion` `daily_problems` `daily_sessions` `daily_words` `learning_progress` `math_submissions` `math_wrong_notes` `math_concept_mastery` `math_daily_problem_assignments` `topic_mastery` `streaks` `star_transactions` `test_requests` `test_results` `placement_tests` `word_progress` `routine_events` `difficulty_feedback` `feedback` `wishes` `challenges` `surprise_rewards`) · 콘텐츠(`words` `word_bank` `sentence_bank` `weekly_stories` `math_bank` `math_hints` `math_problem_concepts` `math_topics` `math_curriculum_units` `math_curriculum_concepts` `math_concept_prerequisites` `topic_prerequisites` `concept_keys` `curriculum_mapping` `curriculum_weeks` `daily_word_sets` `placement_questions` `quotes` `translations`) · 알림(`push_subscriptions` `push_tokens` `notification_settings` `notification_log`)
- **뷰 3**: `math_curriculum_coverage` `math_curriculum_mapping_audit` `routine_events_daily_rollup`
- **함수 59 · 트리거 12**(홈페이지 것 14개를 뺀 전부) · 해당 시퀀스 · RLS 정책 · 권한
- **스토리지**: `math-submissions` 버킷(비공개, 객체 0) + 정책 2
- **인증 사용자 2**: `80b7fc22…`(PeNnY — **홈페이지 관리자와 같은 계정**, MFA 켜짐) · `141532ae…@yustudy.app`(QA 부모)
- **확장**: `pgcrypto` `uuid-ossp`(새 프로젝트 기본 포함)

### 홈페이지에 남는 것

- 테이블 18(`blogs` `articles` `article_pages` `article_reactions` `magazines` `newsletters` `subscribers` `comments` `gallery` `landing_photos` `hero_slides` `site_settings` `family_members` `page_events` `affiliate_links` `instagram_content` `hashtag_presets` `carousel_v3_jobs`) · 함수 12(`mhj_*` 7 · `increment_*` 3 · `set_blogs_updated_at` `sync_created_at_from_date`) · 트리거 2
- 버킷 `images`(1,117개 · 1.7GB) `carousel` `carousel-v3-output` `carousel-v3-photos`
- 인증 사용자 `80b7fc22…`(관리자 — 분리 뒤 **두 프로젝트에 각각** 존재) · `cbfc0e30…@mhj.nz`(2026-09-01 생성, 로그인 0회 — **D5**)

### 어느 쪽도 쓰지 않는 것

- 엣지 함수 3개: `make-server-dcdd22ae`(2025-11) · `upload-image`(2026-04) · `qa-create-user`(2026-04). 홈페이지·YuStudy·StoryPress 세 저장소 어디에서도 호출 0, 최근 24시간 함수 로그 0(Phase 0 에서 대시보드의 호출 통계로 기간을 넓혀 한 번 더 확인). **옮기지 않는다 — D6**

## 4. 방법

### 경로 1 — CLI 덤프·복원 (기본)

Supabase 공식 절차(`migrating-within-supabase/backup-restore`)를 그대로 쓴다. 인증 스키마가 함께 옮겨져 **사용자 UUID·비밀번호 해시가 유지**된다(`parents.user_id` 외래 키가 그대로 맞는다).

```bash
supabase db dump --db-url "$OLD_DB_URL" -f roles.sql --role-only
supabase db dump --db-url "$OLD_DB_URL" -f schema.sql
supabase db dump --db-url "$OLD_DB_URL" -f data.sql --use-copy --data-only \
  -x public.blogs -x public.articles -x public.article_pages -x public.article_reactions \
  -x public.magazines -x public.newsletters -x public.subscribers -x public.comments \
  -x public.gallery -x public.landing_photos -x public.hero_slides -x public.site_settings \
  -x public.family_members -x public.page_events -x public.affiliate_links \
  -x public.instagram_content -x public.hashtag_presets -x public.carousel_v3_jobs
```

- `-x` 로 홈페이지 테이블의 **데이터는 아예 복사하지 않는다**(구독자 이메일 등). 스키마 덤프에는 빈 홈페이지 테이블 정의가 따라오므로 복원 직후 새 프로젝트에서 지운다.
- 복원은 `session_replication_role = replica` 로 — **트리거가 돌면 별·연속 학습·오답 노트가 두 번 계산된다**(`trg_session_complete` `trg_update_topic_mastery` `trg_resolve_wrong_note` 등).
- 복원 뒤 시퀀스를 `max(id)` 로 맞춘다.
- 새 프로젝트에서 지울 것: 홈페이지 테이블 18 · 함수 12 · 트리거 2 · `cbfc0e30` 사용자 · `storage.objects` 의 홈페이지 버킷 행.
- DB 비밀번호가 필요하다 — **PeNnY 가 직접 명령을 실행**하거나 셸 환경변수로 넣는다(에이전트는 비밀번호를 입력하지 않는다).
- Phase 0 에서 설치된 Supabase CLI 의 `db dump --help` 로 `-x/--exclude` 지원을 확인한다. 없으면 `pg_dump --exclude-table-data` 로 같은 일을 한다.

### 경로 2 — 대시보드 "Restore to a new project"

인증 사용자·비밀번호 해시까지 통째로 복제한다. 다만 **원본 프로젝트에 물리 백업이 켜져 있어야** 한다(문서 `platform/clone-project`). 29MB 인 이 프로젝트는 PITR 없이 논리 백업일 가능성이 크다 — Phase 0 에서 버튼이 있는지만 확인한다. 쓸 수 있더라도 홈페이지 데이터 전체(구독자 포함)가 복제되므로 즉시 지워야 하고, 전환 시점의 최신 데이터는 어차피 경로 1 의 데이터 덤프로 다시 옮겨야 한다.

### 인증

- JWT 시크릿은 **새로 발급된 것을 쓴다**. 옛 시크릿을 재사용하면 한쪽 토큰이 다른 쪽에서 통해 분리의 의미가 없다. 대가: YuStudy 사용자 전원 재로그인 1회.
- YuStudy 는 비밀번호 로그인·가입만 쓴다(`signInWithPassword` `signUp`) — MFA 없음. PeNnY 계정의 MFA 요소는 함께 복사되지만 YuStudy 에선 쓰이지 않는다.
- YuStudy 규칙 9("`auth.users` raw SQL INSERT 금지")는 이 이전 한 번만 예외로 기록한다.
- 분리 뒤 PeNnY 계정은 두 프로젝트에 따로 있다 — **비밀번호를 바꾸면 한쪽만 바뀐다.**

## 5. 단계

### Phase 0 — 준비 (중단 없음 · YuStudy 세션 · 반나절)

- [ ] D1~D7 승인
- [ ] **YuStudy DDL 동결** 선언 — 지금부터 Phase 2 끝까지 새 마이그레이션 없음(Sprint 5D · Gate A 일정과 맞춘다)
- [ ] 기준선 기록(SQL, 파일로 저장): YuStudy 테이블별 행 수 · 함수/트리거/정책/시퀀스 목록 · `anon`/`authenticated` 권한 표 · 기본 권한(default privileges)
- [ ] Auth 설정 기록: Site URL · Redirect URLs · 이메일 템플릿 · SMTP · 비율 제한(대시보드 화면 캡처)
- [ ] 경로 2 버튼 유무 확인
- [ ] 저장소 마이그레이션(`supabase/migrations` 28개)과 라이브의 차이 확인 — 새 프로젝트의 기준은 **라이브 덤프**다. 저장소는 전환 뒤 `00029_baseline_2026-09.sql` 로 정리

### Phase 1 — 새 프로젝트 (중단 없음 · 반나절~하루)

- [ ] 프로젝트 `YuStudy` 생성 — **ap-southeast-2**, Micro(월 $10 확인 후)
- [ ] 역할·스키마 복원 → 홈페이지 객체 삭제 → 데이터 **리허설** 복원 → 행 수·객체 수를 기준선과 대조
- [ ] 보안 재적용: 새 프로젝트는 Supabase 기본값(새 테이블에 `anon` 전권)이다 → 홈페이지에서 쓴 `docs/sql/anon_default_privileges_revoke.sql` 과 같은 회수 · 테이블 권한은 덤프가 옮기므로 권한 표로 대조
- [ ] `math-submissions` 버킷 + 정책 2 생성 · Auth 설정 입력(Site URL 은 YuStudy 주소)
- [ ] YuStudy **미리보기 배포**를 새 프로젝트에 연결 → 테스트 318건 · `QA_MISSIONS.md` 골든패스(QA 부모 계정) · 같은 QA 프로필로 `get_home_dashboard` `get_daily_init` 결과를 옛/새 프로젝트에서 비교

### Phase 2 — 전환 (YuStudy 30~60분 중단)

전환 창: **평일 오전(아이들 학교 시간)**. 피할 시각 — 03:00 UTC(NZ 15:00, 알림 크론) · 12:00 UTC(챌린지 만료 크론).

1. 하루 전 가족에게 알림
2. Vercel 크론 두 개 일시 중지
3. 옛 프로젝트: YuStudy 테이블에서 `anon`·`authenticated` 의 INSERT/UPDATE/DELETE 회수 — **쓰기 동결**(실수로 옛 곳에 쓰면 조용히 사라지지 않고 에러가 난다)
4. 최종 데이터 덤프(`-x` 그대로) → 새 프로젝트 YuStudy 테이블 비우고 복원(트리거 끔) → 시퀀스 → 행 수 대조
5. YuStudy Vercel 운영 환경변수 교체: `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY` + `vercel.json` `regions: ["sin1"]` → `["syd1"]` → 재배포
6. 운영 확인: PeNnY·QA 로그인 · 홈 대시보드 · 오늘 학습 시작 · 수학 제출 · 하루 완료 · 알림 설정 화면
7. 크론 재개 · 가족에게 "한 번 다시 로그인" 안내

### Phase 3 — 관찰 (7~14일)

- 옛 YuStudy 테이블은 쓰기 동결 상태로 둔다 = 되돌리기 원본
- 매일: 새 프로젝트 `daily_completion` 행이 이어지는지 · YuStudy 에러 로그 · 새 프로젝트 API 로그
- **되돌리기**: 환경변수를 옛 값으로 + 전환 이후 새 프로젝트에 쌓인 행을 옛 테이블로 복사(행이 적어 스크립트 한 번) + 쓰기 권한 복구

### Phase 4 — 홈페이지 정리 (이 저장소 세션 · 반나절)

- [ ] 옛 YuStudy 객체 최종 덤프(암호화 · 저장소 밖 · 기한 뒤 삭제) → 테이블 49 · 뷰 3 · 함수 59 · 트리거 12 · 시퀀스 · 버킷 `math-submissions` 삭제
- [ ] 인증: QA 부모 `141532ae` 삭제. PeNnY 계정은 남긴다(홈페이지 관리자)
- [ ] 엣지 함수 3개 삭제(D6)
- [ ] 주간 감사 허용 목록에서 YuStudy 뷰 2개 제거 · `_comment` 의 "YuStudy 와 공유" 문구 삭제 · `docs/DB_SCHEMA.md` · 핸드오프 문서
- [ ] 어드바이저 재실행 · site-audit ⑨⑩ 수동 실행 · PostgREST 스키마 캐시 적재 시간과 릴레이션 수(70 → 18) 기록
- [ ] YuStudy 저장소: `CLAUDE.md`(프로젝트 ID · "Singapore" 정정 · 규칙 7 삭제) · `.claude/rules/supabase-conventions.md` · `.claude/skills/supabase-queries` · `.agents/skills/db_verify.md` · `docs/DB_SCHEMA.md` · `supabase link` 다시(`supabase/.temp/project-ref`) — 옛 프로젝트 ID 를 적은 파일이 20개가 넘는다(`grep -rl vpayqdatpqajsmalpfmq`)
- [ ] (선택) 홈페이지 주간 감사 ⑨⑩(anon 쓰기·읽기 노출)을 YuStudy 프로젝트에도 — 분리하면 YuStudy 는 이 감시를 잃는다

## 6. 완료 기준

- 새 프로젝트: YuStudy 테이블 49개 행 수가 전환 시점 옛 값과 **같다** · 함수 59 · 트리거 12 · 정책·권한 표가 기준선과 같다 · **홈페이지 테이블·데이터가 없다**
- YuStudy: 테스트 318/318 · 운영 확인 7항목 · 전환 뒤 3일 연속 `daily_completion` 기록
- 홈페이지: 릴레이션 70 → 18 · 함수 71 → 12 · 어드바이저의 YuStudy 경고 0 · site-audit 전 단계 통과 · 전환 전후 504·응답 시간 변화 없음

## 7. 지뢰

1. **아이 데이터(P0).** 덤프 파일에 아이 이름(`profiles.name_kr`)과 학습 기록이 들어 있다. 저장소·PR·대화에 붙이지 않는다 · 로컬 임시 위치에만 · Phase 4 끝나면 삭제.
2. **트리거.** 복원 중 트리거가 돌면 별·연속 학습이 두 번 쌓인다 → `session_replication_role = replica`.
3. **기본 권한.** 새 프로젝트는 새 테이블에 `anon` 전권이 기본이다 → Phase 1 에서 회수. 옛 프로젝트에서 2026-09-06 에 했던 일을 다시 한다.
4. **옛 프로젝트 ID 를 쓰는 세션.** YuStudy 세션·스킬이 `vpayqdatpqajsmalpfmq` 를 박아 두었다 → 전환 당일 문서 교체 + 옛 테이블 쓰기 회수로 실수가 에러로 드러나게.
5. **동시에 도는 YuStudy 세션.** 2026-09-12 에도 마이그레이션을 적용했다(03:30:46). Phase 0 의 DDL 동결이 지켜지지 않으면 덤프와 라이브가 어긋난다.
6. **JWT 시크릿 재사용 금지**(4장 인증).
7. **공유 관리자 계정.** 분리 뒤 비밀번호는 따로 관리된다.
8. **SMTP·이메일 템플릿.** 비밀번호 재설정 메일이 어느 설정으로 나가는지 Phase 0 에서 확인하지 않으면 전환 뒤 재설정 메일이 안 갈 수 있다.

## 8. 결정

2026-09-13 PeNnY 승인 — 아래 "제안" 열 그대로.

| | 결정할 것 | 제안 |
|---|---|---|
| D1 | 분리 진행 · 새 프로젝트 월 $10 | 진행 |
| D2 | 경로 | 경로 1(CLI). 경로 2 는 쓸 수 있을 때만 참고 |
| D3 | 전환 창 | 평일 오전 학교 시간, 크론 시각(03:00 · 12:00 UTC) 피함 |
| D4 | YuStudy Vercel 리전 `sin1` → `syd1` | 전환 때 함께 |
| D5 | `cbfc0e30…@mhj.nz` 계정(로그인 0회) | 용도 확인 후 유지 또는 삭제 — 2026-09-01 00:05 UTC 생성 · 이메일 확인됨 · 메타데이터 없음 · 로그인·감사 기록 0 · 관리자 판정(`mhj_is_admin`)은 이 계정을 관리자로 보지 않는다. 세션 기록에서 만든 곳을 찾지 못함 → **PeNnY 확인 대기** |
| D6 | 호출 0 인 엣지 함수 3개 | Phase 4 에서 삭제 |
| D7 | 실행 주체 | Phase 0~3 YuStudy 세션 · Phase 4 홈페이지 세션 · DB 비밀번호가 필요한 명령은 PeNnY |

## 근거 (재현 방법)

- 인벤토리: `pg_class`·`pg_proc`·`pg_trigger`·`pg_constraint`·`storage.buckets`·`auth.users`(식별 정보 없이 UUID 앞 8자·도메인만) — Supabase MCP `execute_sql`, 2026-09-13
- 스키마 캐시·504: Supabase `query_logs`(`postgrest_logs`·`edge_logs`), `pg_stat_statements`(2026-03-17 이후 누적)
- 코드 사용처: 두 저장소 `grep`(`from('…')`·`rpc('…')`·`storage.from`·`auth.*`), YuStudy `capacitor.config.ts`·`vercel.json`
- 비용: Supabase MCP `get_cost(type=project)` → 월 $10
- 복제 조건: Supabase 문서 `guides/platform/clone-project` · 인증 이전: `guides/troubleshooting/migrating-auth-users-between-projects`
