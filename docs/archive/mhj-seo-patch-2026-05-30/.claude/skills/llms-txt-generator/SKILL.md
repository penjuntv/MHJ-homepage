---
name: llms-txt-generator
description: |
  MHJ llms.txt / llms-full.txt 갱신·검증·라이브 확인. USE WHEN user mentions
  "llms.txt", "llms-full", "GEO", "AI 인용", "Perplexity", "ChatGPT 인용",
  or after publishing a new blog/magazine to verify the AI index reflects it.
---

# llms-txt-generator — MHJ AI 답변 엔진 최적화

## 무엇을 하는 스킬인가

MHJ는 `app/llms.txt/route.ts` 와 `app/llms-full.txt/route.ts` 가 **동적 라우트로 자동 생성**된다.
이 스킬은 그 라우트가 올바르게 작동하는지 점검·갱신·검증한다.

## 언제 트리거되나

- "llms.txt 갱신해줘" / "llms.txt 확인"
- 블로그·매거진 발행 후 "AI 인덱스 반영됐나?"
- featured 블로그 변경 후
- "Perplexity에서 우리 사이트 인용되나" 같은 GEO 질문
- 정기 점검 (월 1회 권장)

## 핵심 사실

1. **라우트는 동적 + revalidate=3600** (1시간 캐시)
2. **llms.txt** = 큐레이션 (8 정적 + featured 7 + 매거진 1 = 최대 16개)
3. **llms-full.txt** = 전체 인덱스 (카테고리별 그룹)
4. 라이브 URL: `https://www.mhj.nz/llms.txt`, `https://www.mhj.nz/llms-full.txt`
5. robots.ts 에 AI 봇 명시 allow 되어 있어야 함 (Phase A1)

## 검증 절차

### Step 1. 라이브 라우트 확인

```bash
curl -sI https://www.mhj.nz/llms.txt | head -5
curl -sI https://www.mhj.nz/llms-full.txt | head -5
```

200 OK + `Content-Type: text/markdown` 이어야 한다.

### Step 2. 내용 점검

```bash
curl -s https://www.mhj.nz/llms.txt | head -40
```

체크리스트:
- [ ] `# MHJ — My Mairangi Journal` 타이틀 있나
- [ ] 8개 핵심 페이지 링크 (about, magazine, blog, storypress, mairangi-notes, gallery, media-kit, home)
- [ ] featured 블로그 7개 (또는 view_count 상위 보충)
- [ ] 최신 매거진 이슈 1개
- [ ] Last updated 날짜가 오늘
- [ ] 절대 URL (`https://www.mhj.nz/...`) 로 시작

### Step 3. 발행 후 즉시 반영 필요 시

발행 후 1시간 캐시 만료를 안 기다리고 즉시 갱신하려면:

```bash
curl -X POST https://www.mhj.nz/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"secret":"23f30c498a06a5a31bc3e409bb5b7ee9","paths":["/llms.txt","/llms-full.txt"]}'
```

## 컨텐츠 정책 — MHJ 차별점

이 라우트들이 만들 때 반영해야 할 것:

1. **이름 규칙**: PeNnY, Yussi, Min, Hyun, Jin만. 실명 금지.
2. **사진 정책**: 어른 측면/뒷모습, 아이들 멀리서. 이게 llms.txt 푸터에 명시되어 있음.
3. **NZ English only** (public 페이지). 한국어 본문은 라우트에서 제외.
4. **카테고리 7개 정확히**: Little 15 Mins / Home Learning / Whānau / Settlement / Life in Aotearoa / Travelers / Local Guide
5. **StoryPress 별도 도메인**: app.mhj.nz 이라는 사실 명시 (검색 결과 분리)

## DB 의존성

이 라우트들은 다음 컬럼을 조회한다. 컬럼 이름·타입이 바뀌면 라우트 깨짐:

| 테이블 | 컬럼 |
|---|---|
| blogs | slug, title, meta_description, category, view_count, featured, published, publish_at, date, created_at |
| magazines | id, title, year, month_name, cover_subtitle, published, created_at |
| articles | slug, title, subtitle, magazine_id, article_status, created_at |
| newsletters | issue_number, subject, preheader, status, sent_at |

`blogs.featured = true` 글이 7개 미만일 때 view_count 상위로 보충.

## Gotchas

- **`force-dynamic` 쓰지 말 것**: revalidate=3600 으로 충분. force-dynamic 은 매 fetch마다 DB hit.
- **카테고리 한글 "Whānau"** 의 마크롱 (ā) 이 escape 되지 않게 주의. UTF-8 그대로 노출.
- **featured 변경**: admin 에서 featured 토글하면 1시간 후 반영. 즉시 반영은 /api/revalidate 호출.
- **llms.txt 길이 제한**: 공식 spec 없지만 권장 200줄 이하. 현재 라우트는 16개 + 헤더 = 약 80줄. OK.
- **테스트**: 새 글 발행 → curl /llms.txt → 새 글이 featured 면 표시되는지 확인.
- **YuStudy 데이터 혼입 금지**: 같은 Supabase 프로젝트(`vpayqdatpqajsmalpfmq`) 사용 중. 라우트는 MHJ 테이블(blogs/magazines/articles/newsletters)만 조회. YuStudy 테이블(profiles/word_bank 등) 조회 코드 추가 금지.

## 모니터링 (3개월 뒤 점검)

- Vercel runtime log 에서 `GPTBot|ClaudeBot|PerplexityBot` 검색 → /llms.txt fetch 빈도 확인
- ChatGPT / Claude / Perplexity 에 "What is My Mairangi Journal?" 질의 → 답변에 우리 사이트 인용 여부
- 인용 패턴 변화 시 이 스킬 Gotchas 섹션에 추가
