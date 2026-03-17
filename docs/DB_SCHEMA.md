# MHJ HOMEPAGE — DB 스키마 (실제)

> Supabase 프로젝트: asatbuonduelfrhdkwgu
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
| category | text | NO | — | CHECK: Daily/School/Kids/Travel/Food |
| title | text | NO | — | |
| author | text | NO | 'Heejong Jo' | |
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

## 비고
- Supabase에 다른 프로젝트 테이블도 공존 (children, courses 등) — MHJ와 무관
- 모든 공개 쿼리: `published = true` 필터 + 예약발행 시 `.or('publish_at.is.null,publish_at.lte.now')`
