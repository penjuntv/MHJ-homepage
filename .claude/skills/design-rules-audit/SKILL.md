---
name: design-rules-audit
description: |
  MHJ DESIGN_RULES 위반 검출. USE WHEN user says "디자인 검수", "audit",
  "디자인 체크", or when modifying components in app/(public)/ or components/.
---

# DESIGN_RULES Audit

## 10가지 핵심 규칙
1. 콘텐츠 max-width: 1320px, 본문: 720px
2. 4컬럼 반응형 (1320->1024->768-><768)
3. border-radius <= 12px
4. 제목 font-size cap: 72px
5. 8px 기반 간격
6. 아크로매틱 팔레트 (흑백+슬레이트만)
7. 인디고 = AI Insight 전용
8. 카드 hover에 translateY 금지
9. 텍스트를 카드 이미지 위에 올리지 말 것
10. 블로그 카드 16:10, 매거진 3:4

## 검사 방법
- `rounded-2xl` 이상 -> 위반
- `hover:-translate-y` -> 위반
- `text-indigo` + AI Insight 외 -> 위반
- `max-w-` 값이 1320/720과 다르면 확인

## Gotchas
- 매거진 서가는 DESIGN_RULES 11에 예외 있음
- 다크모드에 하드코딩 bg-black/text-white 잔재 확인
- 5-card 그리드는 태블릿에서 깨짐 -> 캐러셀 사용
