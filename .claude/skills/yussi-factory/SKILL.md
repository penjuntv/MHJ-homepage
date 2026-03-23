---
name: yussi-factory
description: |
  MHJ 블로그 콘텐츠 생산 파이프라인. USE WHEN user mentions "유씨팩토리",
  "인포블록", "info block", "블로그 발행 준비", or asks to process Yussi's
  blog draft into deliverables. Also USE WHEN editing blog posts that need
  info_block_html field populated.
---

# Yussi Factory — 콘텐츠 생산 파이프라인

## 입력
Yussi의 블로그 원고 (한국어 또는 영어)

## 5가지 산출물
1. **NZ English 블로그 본문** — 자연스러운 뉴질랜드 영어, 에디토리얼 톤
2. **인포블록 HTML** — info_block_html 필드에 넣을 HTML (인라인 스타일 필수)
   - 4가지 패턴 중 콘텐츠에 맞는 것 선택: 가로 픽 카드 / 데이터 테이블 / 체크리스트 / 통계 로우
3. **SEO 메타** — title (60자), meta_description (155자), slug (영문 kebab-case)
4. **Instagram 캡션** — 해시태그 20개 포함
5. **한국어 요약** — PeNnY/Yussi 검토용 (산출물에 포함 안 함)

## 인포블록 디자인 규칙
- 배경: #faf8f5, 테두리: #ede9e3, 하이라이트: 옐로우
- 타이틀: Playfair Display, 본문: Noto Sans KR
- 1포스트당 최대 1개, NZ English only

## Gotchas
- 인포블록에 한국어 넣지 마
- slug 반드시 영문 kebab-case (한국어 romanize 필요)
- 작성자는 항상 "Yussi" (Heejong Jo 아님)
- og_image_url 필드도 함께 채워야 함
- 카테고리: Little 15 Mins / Home Learning / Whanau / Settlement / Life in Aotearoa / Travelers / Local Guide 중 하나
