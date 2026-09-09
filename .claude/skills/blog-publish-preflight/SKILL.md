---
name: blog-publish-preflight
description: |
  블로그 발행 전 품질 체크. USE WHEN user says "발행", "publish",
  "블로그 체크", "preflight", or before any blog post goes live.
---

# Blog Publish Preflight

## ⚙️ 폼 안 자동 점검 (2026-09-10, W4-C)

기계로 잴 수 있는 항목은 **글 편집 화면의 "발행 전 체크리스트" 가 자동으로 본다**
(`lib/blog-preflight.mjs` — 필수 항목은 저장을 막고, 권장 항목은 경고만 한다).
이 스킬은 그 위에서 사람이 봐야 하는 것 — 링크 실검증(fact-verify), 사진 속 실명, 인포블록 디자인 — 을 맡는다.
아래 목록 중 slug·og_image_url·meta_description·본문 이미지 항목은 폼이 이미 점검하므로 눈으로 다시 세지 않아도 된다.

## 필수 체크리스트
- [ ] slug가 영문 kebab-case인가
- [ ] og_image_url이 채워져 있는가
- [ ] meta_description이 있는가 (155자 이내)
- [ ] 카테고리가 Little 15 Mins / Home Learning / Whanau / Settlement / Life in Aotearoa / Travelers / Local Guide 중 하나인가
- [ ] 작성자가 "Yussi"인가
- [ ] published = true인가
- [ ] 본문에 빈 이미지 태그가 없는가
- [ ] info_block_html이 있다면 인라인 스타일이 포함되어 있는가
- [ ] 링크 체크 — fact-verify §1(Link check) 절차를 content + info_block_html 에 실행했는가. `/go/` 링크는 `lib/validate-affiliate-links.ts` 로 검증. FAIL 이 1건이라도 있으면 발행 중단.

## Gotchas
- admin 카테고리 드롭다운이 사이트 필터와 불일치한 적 있음
- photographer: Yumin/Yuhyeon/Yujin 발견 시 Min/Hyun/Jin으로 변경
- info_block_html 인라인 스타일 없으면 라이브에서 디자인 안 나옴
- 제목 60자 이내 권장 (OG 이미지 잘림 방지)
