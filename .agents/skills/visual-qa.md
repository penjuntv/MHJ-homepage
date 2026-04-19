# Visual QA Skill

## 목적
DESIGN_RULES 준수 여부를 시각적으로 검증한다.

## 실행 절차

### Step 1: 뷰포트별 캡처
대상 페이지마다 3종 뷰포트로 스크린샷:
- Desktop: 1440×900
- Tablet: 768×1024
- Mobile: 375×812

### Step 2: 체크리스트

| # | 항목 | 위반 기준 | Severity |
|---|------|----------|----------|
| 1 | border-radius | 12px 초과 (카드 6px 초과) | P2 |
| 2 | hover 효과 | translateY 또는 saturate 사용 | P2 |
| 3 | heading 크기 | 72px 초과 | P2 |
| 4 | max-width | 콘텐츠 1320px, 본문 720px 초과 | P2 |
| 5 | 카드 텍스트 오버레이 | 이미지 위에 텍스트 겹침 | P2 |
| 6 | 색상 위반 | 인디고가 AI Insight 외 사용 | P2 |
| 7 | 블로그 카드 비율 | 16:10 아님 | P1 |
| 8 | 매거진 카드 비율 | 3:4 아님 | P1 |
| 9 | 모바일 가로 스크롤 | 수평 overflow 발생 | P0 |
| 10 | 다크모드 깨짐 | 텍스트/배경 대비 불량 | P1 |
| 11 | 프라이버시 | 아이 실명/메타데이터 노출 | P0 |

### Step 3: 다크모드
브라우저 다크모드 전환 후 동일 페이지 재캡처, Step 2 반복.

### Step 4: 보고
위반 항목별로 스크린샷 + CSS selector + 수정 방향.
Walkthrough Artifact 출력.
