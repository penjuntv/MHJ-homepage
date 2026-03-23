---
name: blog-publish-preflight
description: |
  블로그 발행 전 품질 체크. USE WHEN user says "발행", "publish",
  "블로그 체크", "preflight", or before any blog post goes live.
---

# Blog Publish Preflight

## 필수 체크리스트
- [ ] slug가 영문 kebab-case인가
- [ ] og_image_url이 채워져 있는가
- [ ] meta_description이 있는가 (155자 이내)
- [ ] 카테고리가 Little 15 Mins / Home Learning / Whanau / Settlement / Life in Aotearoa / Travelers / Local Guide 중 하나인가
- [ ] 작성자가 "Yussi"인가
- [ ] published = true인가
- [ ] 본문에 빈 이미지 태그가 없는가
- [ ] info_block_html이 있다면 인라인 스타일이 포함되어 있는가

## Gotchas
- admin 카테고리 드롭다운이 사이트 필터와 불일치한 적 있음
- photographer: Yumin/Yuhyeon/Yujin 발견 시 Min/Hyun/Jin으로 변경
- info_block_html 인라인 스타일 없으면 라이브에서 디자인 안 나옴
- 제목 60자 이내 권장 (OG 이미지 잘림 방지)
