# YuStudy DB 이전 지시서 (2026-10-26)

> 보내는 쪽: MHJ 홈페이지 세션 「카파시 앱 개발 방법 분석」(`local_a68fc9e8-d4a5-49b9-8533-798013acc3c1`, 폴더 `/Users/penny/MHJ_HOMEPAGE`)
> 받는 쪽: YuStudy 저장소(`/Users/penny/mhj-yutudy`)의 이전 전용 세션
> 근거: 판결 `docs/decisions/council-2026-10-24-yustudy-db-split.md` · 계획 `docs/PLAN-yustudy-db-split-2026-09.md`(§4 방법, §7 지뢰 — 둘 다 홈페이지 저장소, 읽기만) · 2026-10-26 PeNnY 와 질문 라운드 Q1~Q10 합의
> 이 문서가 `docs/HANDOFF-yustudy-split-questions-2026-10-24.md` 의 질문 7개를 대신한다(답은 아래 "사실"과 "결정"에 반영됨).

## 목표

YuStudy 의 데이터베이스·로그인 계정·파일을 공유 프로젝트 `vpayqdatpqajsmalpfmq`(MHJ HOMEPAGE)에서 **새 프로젝트 `ldpuncshlpdxwlmtlxuy`(yustudy, 시드니, Micro, Pro 조직)** 로 옮기고, YuStudy 가 새 프로젝트로 동작하게 한다. 홈페이지는 이 작업 내내 영향이 없어야 한다.

## 결정 (PeNnY, 2026-10-26)

| | 결정 |
|---|---|
| Q1 시점 | **이번 주 안에 전환.** 아래 준비가 끝난 뒤, 날짜는 이 세션이 준비에 맞춰 제안 → PeNnY 승인 |
| Q2 실행 | **이 세션(YuStudy 저장소)이 실행.** 홈페이지 세션은 감독과 홈페이지 쪽 정리(Phase 4, 12월 첫 주) |
| Q3 자동 공개 | 새 프로젝트의 **"새 표 자동 공개" 를 데이터 넣기 전에 끈다.** 앞으로 YuStudy 마이그레이션은 표마다 권한(GRANT)을 직접 적는다 — 저장소 규칙 문서에 반영 |
| Q4 동결 | **준비 시작부터 전환 끝까지 YuStudy 의 DB 구조 변경을 멈춘다.** 돌고 있는 YuStudy 세션들에 알린다(아래 1단계) |
| Q5 전환 시간 | **평일 오전 학교 시간(NZ 9:30~12:00).** 크론(03:00·12:00 UTC = NZDT 16:00·01:00)과 겹치지 않음 |
| Q6 DB 비밀번호 | **PeNnY 가 터미널에서 직접 입력.** Claude 는 명령만 준비, 비밀번호·키 값을 채팅·파일에 쓰지 않는다 |
| Q7 새 가입 | 옛 프로젝트는 **PeNnY 가 지금 대시보드에서 끈다.** 새 프로젝트는 **처음부터 꺼진 상태.** 회원가입 화면은 "가족 초대 전용" 안내로 바꾼다 |
| Q8 계정 | auth 사용자 **3명 모두 옮긴다**(`5d3106ee…` 는 가족 계정 — PeNnY 확인). `80b7fc22…` 는 홈페이지 관리자와 같은 계정 — 옛 프로젝트에도 그대로 남는다 |
| Q9 파일 | 버킷 **`math-submissions`(비공개)·`yustudy-tts`(공개) 둘 다 파일까지 옮긴다.** 버킷 설정·접근 규칙도 똑같이 |
| Q10 로그인·메일 설정 | 옛 프로젝트 대시보드의 **site URL·redirect URL·이메일 확인·SMTP·메일 템플릿을 그대로 복제.** 이 세션이 확인 목록을 만들고 PeNnY 가 화면을 보며 맞춘다 |

## 사실 (2026-10-26 확인)

- 새 프로젝트: 비어 있음(public 표 0, auth 사용자 0), Postgres 17.11. 기본 권한이 `anon`·`authenticated` 에 새 표 전권(`arwdDxtm`) — 자동 공개가 켜진 채로 만들어짐(Q3 대상).
- YuStudy 저장소(읽기 조사):
  - 새 auth 사용자를 만드는 곳은 `supabase.auth.signUp` 한 곳(`lib/actions/auth.ts:26-40`, 화면 `app/signup/page.tsx`). `emailRedirectTo` 가 `https://mhj-yutudy.vercel.app/auth/callback` 로 하드코딩인데 `/auth/callback` 라우트는 조사에서 못 찾음 — 확인할 것.
  - 아이 추가(`addChild`)는 auth 사용자를 만들지 않음 — `parents`·`profiles`·`streaks` 행만.
  - Capacitor `server.url = https://mhj-yutudy.vercel.app` → **Vercel 환경변수 교체만으로 앱 전환**(재심사 없음). `ios/`·`android/` 의 생성된 `capacitor.config.json` 은 확인 못 함 — 확인할 것.
  - 바꿀 환경변수 3개: `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY`. (`CRON_SECRET` 은 그대로)
  - 크론: `vercel.json` 의 `/api/cron/expire-challenges`(`0 12 * * *`)·`/api/cron/send-daily-reminders`(`0 3 * * *`). pg_cron·Edge Function·Realtime·GitHub Actions 없음.
  - 마이그레이션 파일(63개)만으로는 운영과 같은 DB 가 안 됨(`scripts/qa/local/snapshot-prod.sh:5-6`) → **`pg_dump` 로 옮긴다.**
  - 옛 ref 가 동작에 쓰이는 곳은 `scripts/qa/local/snapshot-prod.sh:13` 하나. 문서: `CLAUDE.md:377` · `docs/CLAUDE.md:146` · `.claude/skills/supabase-queries/SKILL.md:11` · `.agents/skills/db_verify.md:6` · `docs/DB_SCHEMA.md:4`(지역을 Singapore 로 잘못 적음) 등.
- 옛 공유 프로젝트(2026-10-24): `public` 표 75개(9/13 의 67 → YuStudy 새 표 포함 추정), 홈페이지 표 18개는 계획서 §3 목록. 두 제품 사이 외래 키 0.

## 순서

각 단계 끝에 PeNnY 에게 짧게 보고하고, **되돌리기 어려운 단계(5·6) 전에는 반드시 승인**을 받는다.

1. **동결 알림.** 지금 돌고 있는 YuStudy 세션들(`ListAgents` 로 확인 — 예: "NZ Year 7 수학 교육과정 적합성 감사", Y7 수학 보충·문제 수정 워크트리들)에 "이전 끝날 때까지 DB 구조 변경·`apply_migration` 금지"를 보낸다. 받지 못하는(오프라인) 세션은 PeNnY 에게 목록으로 알린다.
2. **기준선(옛 프로젝트, 읽기만).** YuStudy 소유 객체 전수: 표(계획서 §3 의 49 + 그 뒤 생긴 것 — 홈페이지 18개를 뺀 나머지)·뷰·함수·트리거·시퀀스·RLS 정책·권한·버킷과 객체 수·auth 사용자 3·행 수. 홈페이지 18개 표와 홈페이지 함수(`mhj_*` 등)·버킷(`images`·`carousel*`)은 **옮기지 않는다.**
3. **새 프로젝트 준비.** 자동 공개 끄기(대시보드 Data API 설정, 안 되면 `ALTER DEFAULT PRIVILEGES … REVOKE` — `supabase_admin` grantor 분은 postgres 권한으로 안 될 수 있음) · 새 가입 끄기 · 로그인·메일 설정 복제 목록(Q10) · 버킷 2개 생성. 확장(`pgcrypto`·`uuid-ossp`) 확인.
4. **리허설.** 덤프(YuStudy 객체만, 홈페이지 표 제외 — 계획서 §4 경로 1)를 새 프로젝트에 복원하고 2단계 기준선과 대조. 트리거는 복원 중 꺼 둔다(`session_replication_role = replica`, 지뢰 2). 앱을 **프리뷰 배포**(새 프로젝트 환경변수)로 띄워 로그인·학습 흐름을 확인. 끝나면 새 프로젝트를 깨끗이 비우고 본 전환을 기다린다.
5. **본 전환 (승인 후, 평일 9:30~12:00 NZ).** 쓰기 멈춤 → 최종 덤프(auth 사용자 포함, 비밀번호 해시 유지) → 복원 → 파일 복사(두 버킷) → 대조 → Vercel 환경변수 3개 교체·재배포 → 로그인·학습·사진 올리기·음성 재생·크론 확인. 사용자 전원 재로그인 1회 안내.
6. **옛 쪽 정리는 하지 않는다.** 옛 프로젝트의 YuStudy 표·파일은 관찰 기간(7~14일) 동안 그대로 둔다 — 롤백 = Vercel 환경변수 되돌리기(그 사이 새 기록은 잃을 수 있음 — PeNnY 승인 범위).
7. **저장소 정리.** ref·지역 문서 갱신, `snapshot-prod.sh` 의 `REF`, 마이그레이션 규칙에 "표마다 GRANT 직접"(Q3), 회원가입 화면 "가족 초대 전용"(Q7).
8. **관찰 끝 → 홈페이지 세션에 신호.** "옛 프로젝트의 YuStudy 객체를 지워도 된다" + 지울 표·뷰·함수·트리거·시퀀스·버킷 목록을 홈페이지 세션(`local_a68fc9e8-d4a5-49b9-8533-798013acc3c1`)에 보낸다. **이 세션은 옛 프로젝트에서 아무것도 지우지 않는다.**

## 지킬 것

- **아이 데이터(P0).** 덤프 파일에는 아이 이름·학습 기록이 있다 — 저장소·PR·채팅에 붙이지 않는다. 로컬 임시 폴더(저장소 밖)에만 두고 전환·관찰 뒤 지운다. 보고에는 아이 실명을 쓰지 않는다(Min/Hyun/Jin).
- **키·비밀번호.** 값을 출력·기록하지 않는다. JWT 시크릿은 새 프로젝트 것을 쓴다(재사용 금지, 지뢰 6).
- **홈페이지 무영향.** 옛 프로젝트에서는 읽기와 덤프만. 홈페이지 표·함수·정책·버킷을 건드리지 않는다.
- **완료 정의.** 새 프로젝트의 YuStudy 객체·행 수가 전환 시점 기준선과 같음 · 홈페이지 객체 없음 · YuStudy 테스트 통과 · 운영 확인(로그인·학습 기록·사진·음성·크론) · 전환 뒤 3일 연속 `daily_completion` 기록.
- 진행 보고와 질문은 홈페이지 세션이 아니라 **PeNnY 에게 먼저.** 홈페이지 세션에는 4단계 리허설 결과, 5단계 전환 완료, 8단계 신호를 보낸다.
