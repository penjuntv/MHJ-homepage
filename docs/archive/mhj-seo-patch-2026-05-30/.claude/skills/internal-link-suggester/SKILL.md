---
name: internal-link-suggester
description: |
  새 블로그 발행 시 또는 기존 글 수정 시, 본문에 자연스럽게 삽입할
  내부 링크 후보를 추천. USE WHEN user says "내부 링크", "internal links",
  "관련 글 링크", "이 글에 어떤 글을 연결해야", or before publishing.
---

# internal-link-suggester — MHJ 내부 링크 추천

## 무엇을 하는 스킬인가

새 블로그(또는 수정 중인 글) 본문에 자연스럽게 삽입할 **기존 발행 글 링크 3~5개**를 추천한다.

`docs/seo-audit-2026-05-02.md` 가 발견한 **모든 52편 블로그의 내부 링크 0개** 문제를 해결하기 위함. orphan page 색인 거부의 주 원인.

## 언제 트리거되나

- "이 글에 내부 링크 어디 걸까"
- "관련 글 추천"
- 블로그 발행 전 (`blog-publish-preflight` 와 짝꿍)
- Yussi Factory 산출물에 링크 누락 발견 시

## 매칭 알고리즘 — 단순 버전 (v1)

임베딩 없이 키워드/메타데이터 기반.

### 점수 (각 후보 글당)

| 신호 | 점수 |
|---|---|
| 같은 카테고리 | +3 |
| `tags` 배열 교집합 1개 | +2 (per overlap) |
| 제목에 현재 글의 명사 키워드 포함 | +1 (per match) |
| 같은 시리즈 (`carousel_series_name` 일치) | +5 |
| 최근 60일 이내 발행 | +1 |
| view_count 상위 25% | +1 |

상위 5개 추천. 같은 점수면 view_count → 최신순.

### 명사 키워드 추출

새 글 제목/meta_description 에서:
- 카테고리 (Mairangi, Auckland, NZ 등)
- 학년 (Year 1~13, NCEA, Intermediate, Primary)
- 가족 구성원 (Min, Hyun, Jin, PeNnY, Yussi)
- 시즌 (summer, autumn, winter, spring, term 1~4)
- 동물·자연·도구 (rare nouns)

## 적용 SQL

```sql
-- 새 글 정보 (slug = 'NEW_SLUG')
WITH new_blog AS (
  SELECT slug, category, tags, title, meta_description
  FROM blogs WHERE slug = 'NEW_SLUG'
),
-- 후보 = published 글 (자기 자신 제외)
candidates AS (
  SELECT
    b.id, b.slug, b.title, b.category, b.tags, b.date, b.view_count,
    b.meta_description, b.carousel_series_name,
    -- 점수 계산
    (CASE WHEN b.category = (SELECT category FROM new_blog) THEN 3 ELSE 0 END) +
    (
      SELECT count(*) * 2
      FROM unnest(b.tags) t
      WHERE t = ANY((SELECT tags FROM new_blog))
    ) +
    (CASE
      WHEN b.carousel_series_name IS NOT NULL
       AND b.carousel_series_name = (
         SELECT carousel_series_name FROM blogs WHERE slug = 'NEW_SLUG'
       )
      THEN 5 ELSE 0
    END) +
    (CASE
      WHEN b.created_at > NOW() - INTERVAL '60 days' THEN 1 ELSE 0
    END) AS score
  FROM blogs b
  WHERE b.published = true
    AND b.slug != 'NEW_SLUG'
    AND (b.publish_at IS NULL OR b.publish_at <= NOW())
)
SELECT slug, title, category, score, view_count, date
FROM candidates
WHERE score > 0
ORDER BY score DESC, view_count DESC NULLS LAST, date DESC
LIMIT 8;
```

## 추천 결과 사용 방법

스킬 출력 예시:

```
새 글: "Year 7 Science & Social Studies in NZ"

추천 내부 링크 (상위 5):

1. [Year 7 English & Mathematics NZ](/blog/year-7-english-mathematics-nz)
   매칭: 같은 카테고리(Home Learning) + 시리즈(Year 7) + tags 교집합 3
   삽입 위치 권고: 본문 도입부 "We've already covered ..." 식
   anchor 후보: "the English & Mathematics breakdown"

2. [Year 7 Intermediate School NZ Curriculum](/blog/year-7-intermediate-school-nz-curriculum)
   매칭: 같은 카테고리 + 시리즈 (Year 7 시작점)
   삽입 위치: 도입부 또는 결론
   anchor 후보: "starting Intermediate this year"

3. [NCEA Is Changing — No More Levels, No More Credits](/blog/ncea-is-changing-no-more-levels-no-more-credits)
   매칭: 카테고리(Home Learning) + 시간순(향후)
   삽입 위치: NCEA 언급 시 inline
   anchor 후보: "the new NCEA structure we wrote about"

4. [Starting School in New Zealand](/blog/starting-school-in-new-zealand)
   매칭: 카테고리 + view_count 상위 + 학년 키워드
   삽입 위치: 한 번 더 NZ 학교 시스템 전체 컨텍스트 줄 때
   anchor 후보: "Min's first day"

5. [Setting Personal Routines](/blog/setting-personal-routines)
   매칭: 카테고리 + 최근 발행
   삽입 위치: 학습 루틴 언급 시
   anchor 후보: "the rhythm we landed on"
```

## anchor 텍스트 가이드

- **금지**: "click here", "read more", "이 글"
- **권장**: 디스크립티브, 본문 흐름에 녹는 형태. NZ English 자연스러움 유지.
- **예시**:
  - ❌ "Read [our previous post](/blog/x)"
  - ✅ "earlier, we shared [Min's first day at school](/blog/x)"

## Gotchas

- **임베딩 미사용 (v1)**: 의미상 비슷한데 키워드 안 겹치는 글은 못 찾음. v2 에서 pgvector 도입 검토 (별도 PR).
- **`carousel_series_name` 정합성**: 시리즈로 묶인 글이 적으면 (현재 거의 없음) 이 신호는 제로. featured/tags 가 주 신호.
- **tags 표준화 안 됨**: 같은 의미의 태그가 다른 표기로 흩어짐 (e.g., "Year 7" vs "year-7" vs "year7"). seo-audit 에서 태그 표준화 점검 필요.
- **anchor 텍스트 자동 추천은 약함**: 제목 발췌 수준. Yussi 가 최종 결정.
- **`internal_links = 0` 글이 52편**: 처음에는 신규 발행 글에만 적용. 기존 글 backfill 은 별도 작업 (cleanup 세션).
- **추천만 하고 자동 삽입 금지**: 본문 HTML 자동 수정은 부작용 큼. 추천 → Yussi 가 admin 에서 수동 삽입.
- **YuStudy 혼입 금지**: blogs 테이블만 조회. YuStudy 의 word_bank/sentence_bank 등 절대 SELECT 하지 말 것.

## 갱신 트리거

- pgvector 도입 시 → v2 알고리즘 섹션 추가
- 새 시리즈 콘셉트 도입 (예: "Year 7 시리즈", "Lunchbox 시리즈") 시 → 매칭 가중치 조정
- anchor 텍스트 자동 추천 품질 개선 시 → 가이드 갱신
