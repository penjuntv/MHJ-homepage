# MHJ HOMEPAGE — DB 스키마 (실제)

> Supabase 프로젝트: vpayqdatpqajsmalpfmq
> 마지막 업데이트: 2026-03-17 (자동 조회)

---

## magazines
| 컬럼 | 타입 | Null | 기본값 | 비고 |
|------|------|------|--------|------|
| id | text | NO | — | PK, 예: '2026-03' |
| year | text | NO | — | |
| month_name | text | NO | — | 예: 'Mar' |
| title | text | NO | — | |
| editor | text | NO | — | |
| image_url | text | NO | — | |
| created_at | timestamptz | YES | now() | |
| pdf_url | text | YES | — | |
| color_theme | text | YES | 'ocean' | |
| cover_subtitle | text | YES | '' | |
| contributors | text[] | YES | '{}' | |
| accent_color | text | YES | '#1A1A1A' | |
| cover_filter | text | YES | 'none' | |
| cover_copy | text | YES | '' | |
| cover_images | text[] | YES | '{}' | |
| issue_number | text | YES | '01' | |
| bg_color | text | YES | '#F5F0EA' | |
| published | boolean | NO | true | |

---

## articles
| 컬럼 | 타입 | Null | 기본값 | 비고 |
|------|------|------|--------|------|
| id | integer | NO | serial | PK |
| magazine_id | text | NO | — | FK → magazines.id |
| title | text | NO | — | |
| author | text | NO | — | |
| date | text | NO | — | 예: '2026.03.02' |
| image_url | text | NO | — | |
| content | text | NO | — | |
| created_at | timestamptz | YES | now() | |
| pdf_url | text | YES | — | |
| sort_order | integer | YES | 0 | |
| article_type | text | YES | 'article' | |
| type | text | YES | 'article' | |
| page_start | integer | YES | — | |
| page_end | integer | YES | — | |
| template | text | YES | 'classic' | |
| article_status | text | YES | 'draft' | |
| article_images | text[] | YES | '{}' | |
| image_positions | text[] | YES | '{}' | |

---

## blogs
| 컬럼 | 타입 | Null | 기본값 | 비고 |
|------|------|------|--------|------|
| id | integer | NO | serial | PK |
| category | text | NO | — | CHECK: Little 15 Mins/Home Learning/Whanau/Settlement/Life in Aotearoa/Travelers/Local Guide |
| title | text | NO | — | |
| author | text | NO | 'Yussi' | |
| date | text | NO | — | |
| image_url | text | NO | — | |
| content | text | NO | — | |
| slug | text | NO | — | UNIQUE |
| meta_description | text | YES | — | SEO |
| og_image_url | text | YES | — | SEO |
| published | boolean | YES | true | |
| created_at | timestamptz | YES | now() | |
| view_count | integer | NO | 0 | |
| tags | text[] | YES | '{}' | |
| publish_at | timestamptz | YES | — | 예약발행 |
| is_sponsored | boolean | YES | false | |
| sponsor_name | text | YES | — | |
| hero_order | integer | YES | 0 | |
| is_hero | boolean | YES | false | |
| featured | boolean | YES | false | |
| content_backup | text | YES | — | 🔒 비공개 — anon SELECT revoke 대상 |
| info_block_html | text | YES | — | 인포블록 HTML |
| insight_kr | text | YES | — | AI 감상평 캐시 · 🔒 비공개 (ai-insight 는 service_role) |
| insight_cached_at | timestamptz | YES | — | 캐시 생성 시각 · 🔒 비공개 |
| cover_caption | text | YES | — | 표지 캡션 |
| letter_to | text | YES | — | 'M' / 'H' / 'J' — 편지 형식 글의 수신자 라벨 |
| updated_at | timestamptz | NO | now() | 편집 컬럼 실제 변경 시 트리거 갱신 — dateModified/lastmod 원천 (W4-A 2026-09-08) |
| seo_title | text | YES | — | `<title>`/og:title 전용 제목, 없으면 title (D2) |
| summary_ko | text | YES | — | 한국어 요약 블록 `<section lang="ko">` (D1) |
| faq_json | jsonb | YES | — | `[{"q","a"}]` · CHECK `blogs_faq_json_shape`(배열 + 원소마다 q·a 문자열) · FAQPage JSON-LD |
| related_slugs | text[] | YES | — | 편집자가 고른 관련 글 slug (존재 검증은 W4-C preflight) |
| og_image_alt | text | YES | — | og:image alt |

트리거 2개(BEFORE, 이름순으로 실행):
- `trg_sync_created_at` — INSERT · UPDATE OF date → `created_at` = 발행일 자정 NZ.
- `trg_sync_updated_at` (`set_blogs_updated_at()`, `docs/migrations/2026-09-08_set_blogs_updated_at_v2.sql`) —
  ① 선택 텍스트 8컬럼(og_image_url·meta_description·sponsor_name·info_block_html·cover_caption·seo_title·summary_ko·og_image_alt)의
  `''`/공백을 NULL 로 정규화한다(모든 writer 공통 — **"없음" 은 NULL 하나**, 2026-09-08 기존 `''` 111건/75행 정리).
  ② 독자에게 보이는 컬럼이 **실제로 바뀔 때만** `updated_at = now()` — 판정은 **제외 목록**(id·created_at·updated_at·view_count·
  published·featured·is_hero·hero_order·publish_at·content_backup·insight_*·og_image_url·carousel_*)을 뺀 `to_jsonb` 비교라
  새 컬럼은 기본이 편집 컬럼이다(제외하려면 함수의 `excluded` 배열에 추가). 명시적으로 `updated_at` 을 SET 한 UPDATE 는 존중.
  ③ 항상 `updated_at ≥ created_at` — 예약발행(미래 date)도 dateModified ≥ datePublished. 정확한 목록은 함수 본문이 정본.

🔒 비공개 컬럼 3종은 anon 롤에서 컬럼 단위 grant 로 차단한다(anon 은 테이블 SELECT 없음 — 새 컬럼은 grant 전엔 42501, fail-closed).
참고본 `docs/sql/anon_blogs_column_whitelist_grant.sql`(42컬럼). 앱 쪽 화이트리스트는 `lib/constants.ts` 의 `BLOG_*_COLUMNS`,
가드는 `.claude/hooks/select-star-guard.sh` + `scripts/audit-select-star.mjs` + `scripts/audit-anon-column-grant.mjs`(상수 ⊆ 참고본, source-guard).

**blogs 공개 컬럼 추가 절차 (정본 — 다른 문서는 여기를 가리킨다)**
1. `apply_migration` 으로 컬럼 추가(+ 필요하면 트리거 `excluded` 배열·정규화 목록 갱신).
2. **추가형 grant 를 코드 배포 "전" 에** 적용(`grant select (새컬럼) on public.blogs to anon`) + 참고본 sql 의 목록 갱신.
   반대로 코드가 먼저 나가면 `select=새컬럼` 이 42501 → 공개 페이지 전부 500.
3. `lib/constants.ts` `BLOG_*_COLUMNS` + `lib/types.ts` → 배포. (`audit-anon-column-grant` 가 2↔3 의 어긋남을 PR 에서 막는다.)
4. **회수형**(revoke 를 동반한 화이트리스트 재적용)만 코드 배포 **후** — 배포 전에 하면 구코드의 select 가 깨진다(2026-09-04 3분 장애).

---

## comments
| 컬럼 | 타입 | Null | 기본값 | 비고 |
|------|------|------|--------|------|
| id | integer | NO | serial | PK |
| blog_id | integer | YES | — | FK → blogs.id |
| name | text | NO | — | |
| email | text | NO | — | |
| content | text | NO | — | |
| approved | boolean | YES | false | 관리자 승인 필요 |
| created_at | timestamptz | YES | now() | |

---

## article_reactions
| 컬럼 | 타입 | Null | 기본값 | 비고 |
|------|------|------|--------|------|
| id | integer | NO | serial | PK |
| article_id | integer | YES | — | FK → articles.id |
| type | text | NO | — | |
| content | text | YES | — | |
| author_name | text | YES | 'Anonymous' | |
| created_at | timestamptz | YES | now() | |

---

## family_members
| 컬럼 | 타입 | Null | 기본값 | 비고 |
|------|------|------|--------|------|
| id | integer | NO | serial | PK |
| name | text | NO | — | |
| role | text | NO | — | |
| bio | text | NO | — | |
| image_url | text | NO | — | |
| sort_order | integer | YES | 0 | |

---

## gallery
| 컬럼 | 타입 | Null | 기본값 | 비고 |
|------|------|------|--------|------|
| id | integer | NO | serial | PK |
| image_url | text | NO | — | |
| caption | text | YES | — | |
| category | text | YES | — | |
| date | text | YES | — | |
| sort_order | integer | YES | 0 | |
| created_at | timestamptz | YES | now() | |
| title | text | YES | — | |
| comment | text | YES | — | |
| photographer | text | YES | — | |
| taken_date | text | YES | — | |
| location | text | YES | — | |
| published | boolean | YES | true | |

---

## hero_slides
| 컬럼 | 타입 | Null | 기본값 | 비고 |
|------|------|------|--------|------|
| id | integer | NO | serial | PK |
| title | text | NO | — | |
| subtitle | text | YES | — | |
| image_url | text | NO | '' | |
| link_url | text | YES | — | |
| sort_order | integer | YES | 0 | |
| is_visible | boolean | YES | true | |
| created_at | timestamptz | YES | now() | |

---

## newsletters
| 컬럼 | 타입 | Null | 기본값 | 비고 |
|------|------|------|--------|------|
| id | integer | NO | serial | PK |
| subject | text | NO | — | |
| content | text | NO | — | |
| sent_at | timestamptz | YES | — | |
| recipient_count | integer | YES | 0 | |
| status | text | YES | 'draft' | draft / sent |
| created_at | timestamptz | YES | now() | |

---

## subscribers
| 컬럼 | 타입 | Null | 기본값 | 비고 |
|------|------|------|--------|------|
| id | integer | NO | serial | PK |
| email | text | NO | — | UNIQUE |
| name | text | YES | — | |
| subscribed_at | timestamptz | YES | now() | |
| active | boolean | YES | true | |
| source | text | YES | 'website' | |

---

## site_settings
| 컬럼 | 타입 | Null | 비고 |
|------|------|------|------|
| key | text | NO | PK |
| value | text | NO | |
| description | text | YES | |

### 주요 키
- `default_theme` — 기본 테마 (light/dark)
- `welcome_title`, `welcome_description`, `welcome_hero_image_url`
- `gallery_title`, `gallery_description`

---

## page_events
1st-party 분석 이벤트(쿠키리스·익명). 정의: `docs/migrations/2026-07-31_page_events.sql`.
프로덕션 적용: **2026-08-24** (마이그레이션 `page_events_analytics`, `page_events_revoke_anon_rpc`).

| 컬럼 | 타입 | Null | 기본값 | 비고 |
|------|------|------|--------|------|
| id | bigint | NO | identity | PK |
| created_at | timestamptz | NO | now() | |
| session_id | text | YES | — | 탭 세션 랜덤 UUID (개인 식별자 아님) |
| event_type | text | NO | — | pageview \| engagement \| scroll \| read_complete \| outbound |
| path | text | YES | — | |
| blog_slug | text | YES | — | |
| referrer | text | YES | — | |
| source | text | YES | — | google \| naver \| ... \| direct \| (host) |
| medium | text | YES | — | organic \| social \| referral \| direct \| internal |
| device | text | YES | — | mobile \| tablet \| desktop |
| country | text | YES | — | Vercel geo 헤더 국가코드만 (IP 원문 미저장) |
| engagement_ms | integer | YES | — | |
| scroll_pct | integer | YES | — | |
| meta | jsonb | YES | — | |

인덱스: `created_at desc` · `source` · `blog_slug` · `(event_type, created_at desc)`

**RLS**: 활성화. insert 정책은 **authenticated 만**(2026-09-05 anon 회수 — 실제 수집은 `app/api/track` 이
service_role 로 쓴다, `docs/sql/anon_write_grant_sweep.sql`), **select 정책 없음** →
원본 행은 service_role 로만 조회 가능. 리포트는 아래 집계 RPC 를 경유한다.

### 집계 RPC (모두 `security definer`, `authenticated` 만 execute)
| 함수 | 인자 | 반환 |
|------|------|------|
| `mhj_is_admin` | — | boolean — service_role 이거나 JWT email 이 어드민이면 true |
| `mhj_traffic_by_source` | days=30 | source, medium, sessions, pageviews |
| `mhj_daily_pageviews` | days=30 | day(Pacific/Auckland), pageviews, sessions |
| `mhj_top_pages` | days=30, lim=20 | path, pageviews, sessions, avg_engagement_ms |
| `mhj_content_engagement` | days=30, lim=20 | blog_slug, pageviews, avg_engagement_ms, read_complete, scroll100 |

리포트 RPC 4개는 WHERE 최상단에 `public.mhj_is_admin() and` 를 두어 **함수 내부에서** 어드민을
가린다(2026-08-24, `page_events_admin_guard`). 어드민이 아닌 `authenticated` 호출자는 에러가 아니라
**빈 결과셋**을 받는다 — 대시보드가 비어 보이면 권한부터 의심할 것.

호출부: `app/mhj-desk/insights/page.tsx` — 클라이언트 컴포넌트가 `lib/supabase-browser.ts`
(anon key + 쿠키 세션)로 `.rpc()` 호출 → 실행 롤은 `authenticated`.

> ⚠️ **Supabase 함정 — `revoke from PUBLIC` ≠ `revoke from anon`.**
> Supabase 는 default privileges 로 public 스키마 함수 execute 를 anon·authenticated
> **각 롤에 직접** 부여한다. PUBLIC(의사 롤) 회수는 이 개별 grant 를 남겨두므로,
> `revoke ... from public` 만 쓰면 anon 키로 여전히 호출된다. 비공개 RPC 는
> 반드시 `revoke execute ... from anon;` 을 명시할 것. (2026-08-24 실제 발생)
>
> 공유 프로젝트라 `authenticated` 에는 YuStudy 사용자도 포함된다 → 리포트 RPC 는
> grant 가 아니라 **함수 내부에서**(`mhj_is_admin()`) 가린다.

### 감사 RPC (`security definer`, **service_role 만** execute)
| 함수 | 인자 | 반환 | 용도 |
|------|------|------|------|
| `mhj_audit_anon_write_grants` | — | table_name, relkind, privileges text[] — anon 이 쓰기 권한(6종 중)을 하나라도 가진 테이블당 1행 | 주간 site-audit ⑨ (`scripts/audit-anon-write-grants.mjs`). 정의 `docs/migrations/2026-09-06_mhj_audit_anon_write_grants.sql` · 마이그레이션 `mhj_audit_anon_write_grants_rpc`(v1) → `mhj_audit_anon_write_grants_rpc_v2`(현재) |
| `mhj_audit_anon_read_exposure` | — | table_name, relkind, reason(`rls_disabled` \| `view_without_security_invoker`) — anon SELECT 가 있는데 행 단위 보호가 없는 릴레이션 | 주간 site-audit ⑩ (`scripts/audit-anon-read-exposure.mjs`). 정의 `docs/migrations/2026-09-06_mhj_audit_anon_read_exposure.sql` · 마이그레이션 `mhj_audit_anon_read_exposure_rpc`. 허용 목록 `scripts/qa/anon-read-exposure-allowlist.json` |

anon·authenticated 는 execute 없음(2026-09-06 REST 프로브: anon 키 401 42501). 판정(허용 목록)은
DB 가 아니라 repo `scripts/qa/anon-write-allowlist.json` 이 **(테이블, 권한) 단위**로 한다.

---

## anon 롤 권한 원칙 (2026-09-05 확립)

- **쓰기 grant 는 (테이블, 권한) 화이트리스트** — `comments`·`article_reactions` 만 anon 쓰기(실제 anon 클라이언트
  insert 경로 있음). 나머지 public 스키마 전부 회수 완료(`docs/sql/anon_write_grant_sweep.sql`). RLS 는 TRUNCATE 에
  적용되지 않으므로 "RLS 가 막아준다"는 한 겹 방어로 보지 않는다.
  이 두 테이블도 anon 은 **INSERT 만** 보유한다 (2026-09-06 나머지 5종 회수,
  `docs/sql/anon_comments_reactions_insert_only.sql`). 허용 목록도 `["INSERT"]`.
- ~~Supabase 는 새 테이블마다 anon 쓰기 grant 를 기본으로 붙인다~~ → 2026-09-06 이후 postgres 가 만드는 새 테이블에는
  anon 쓰기 grant 가 **붙지 않는다**(아래 근본 원인 참조). 그래도 새 테이블 마이그레이션에는 `enable row level security` 와
  필요한 정책을 반드시 넣을 것. anon 쓰기 grant 가 어떤 경로로든 생기면 주간 site-audit ⑨ 가 다음 일요일에 잡는다.
- **근본 원인(default privileges)은 2026-09-06 에 끊었다** — `alter default privileges for role postgres in schema public
  revoke insert, update, delete, truncate, references, trigger on tables from anon;` 적용
  (`docs/sql/anon_default_privileges_revoke.sql`). 실증: 새 테이블에 anon 은 **SELECT 만** 붙는다(적용 전 7권한).
  authenticated·service_role·기존 테이블 불변. YuStudy 의 새 테이블에도 적용된다 — anon 쓰기가 필요하면 명시 grant
  + 허용 목록(방향은 fail-closed: 개발 시점 42501 로 드러난다). ⑨ 는 두 번째 방어선.
  잔여: `supabase_admin` grantor 의 기본 grant 는 postgres 권한으로 못 바꾼다(통상 public 에 테이블을 만들지 않음,
  생기면 ⑨ 가 잡는다). **새 테이블의 RLS 는 여전히 기본 꺼짐 + anon SELECT 기본 grant** → `enable row level security` 는 계속 필수.
- **⑩ anon 읽기 노출** (2026-09-06 추가): 새 테이블의 anon **SELECT** + RLS 미활성(plain `create table` 은 RLS 가
  꺼져 있고 anon SELECT 가 기본 grant 다 — 쓰기보다 더 넓은 유출면)과 `security_invoker` 없는 뷰를 매주 검출한다.
  2026-09-06 기준선은 테이블 63개 전부 RLS 켜짐. **새 테이블 마이그레이션에는 `enable row level security` 필수.**
  RLS 가 켜진 테이블의 `using (true)` 공개 읽기 정책은 의도된 것으로 보고 대상에서 뺀다.
- **⑨·⑩ 이 보지 않는 것** (후속, `docs/handoff-2026-09-04.md` §3): 함수 EXECUTE 기본 grant(2026-08-24 실사고 패턴), 시퀀스 USAGE.
- **공유 프로젝트 경계**: ⑨ 가 잡은 테이블이 YuStudy 것이면 MHJ 쪽에서 임의로 회수하거나 허용하지 말고
  소유자에게 확인 후 처리. 허용 목록 근거(코드 경로)는 MHJ repo 안에서 검증 가능한 것만 적는다.
- `blogs` 의 anon SELECT 는 컬럼 화이트리스트(42컬럼, `docs/sql/anon_blogs_column_whitelist_grant.sql`) — 새 공개 컬럼은 §blogs "공개 컬럼 추가 절차" 대로.

---

## 비고
- Supabase에 다른 프로젝트 테이블도 공존 (children, courses 등) — MHJ와 무관
- ⚠️ 위 공존 때문에 **`authenticated` 롤은 MHJ 어드민 전용이 아니다** — YuStudy 로그인
  사용자도 같은 롤을 갖는다. `authenticated` grant 만으로는 어드민 한정이 되지 않으므로,
  민감한 RPC/테이블은 service_role(서버 경유) 또는 롤 내부 추가 검증이 필요하다.
- 모든 공개 쿼리: `published = true` 필터 + 예약발행 시 `.or('publish_at.is.null,publish_at.lte.now')`
