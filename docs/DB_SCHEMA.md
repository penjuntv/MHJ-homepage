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
| content_backup | text | YES | — | |
| info_block_html | text | YES | — | 인포블록 HTML |
| insight_kr | text | YES | — | AI 감상평 캐시 |
| insight_cached_at | timestamptz | YES | — | 캐시 생성 시각 |

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

**RLS**: 활성화. insert 는 anon·authenticated 허용(공개 페이지 수집), **select 정책 없음** →
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

---

## 비고
- Supabase에 다른 프로젝트 테이블도 공존 (children, courses 등) — MHJ와 무관
- ⚠️ 위 공존 때문에 **`authenticated` 롤은 MHJ 어드민 전용이 아니다** — YuStudy 로그인
  사용자도 같은 롤을 갖는다. `authenticated` grant 만으로는 어드민 한정이 되지 않으므로,
  민감한 RPC/테이블은 service_role(서버 경유) 또는 롤 내부 추가 검증이 필요하다.
- 모든 공개 쿼리: `published = true` 필터 + 예약발행 시 `.or('publish_at.is.null,publish_at.lte.now')`
