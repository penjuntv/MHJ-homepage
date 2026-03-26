# MHJ QA Summary — Antigravity (Visual)
## 검수일: 2026-03-26

### 총괄
- 총 검수 항목: 10개 영역
- 🔴 Critical: 4건
- 🟠 Major: 1건
- 🟡 Minor: 1건
- 🟢 Enhancement: 3건
- 총 스크린샷: 60+ 장 (Playwright 자동 수집)

### 반응형 검수 결과
- 7개 뷰포트 × 6개 페이지 (진행 중)
- 데스크탑 모드 기준 최대 1440px로 렌더링되는 이슈 발견 (규정 가로폭 1320px 미준수, `max-width` 및 `.container` 클래스 재검토 필요)

### 다크 모드 검수 결과
- 6개 주요 페이지 다크모드 대응 캡처 진행
- 전반적인 대비 및 텍스트 렌더링 확인용 스크린샷 획득

### 🔴 Critical 이슈
1. [공통] 콘텐츠 컨테이너 영역 최대폭 초과 (측정: 1440px / 기준: 1320px) — 스크린샷: `homepage/homepage-full-desktop-light.png`
2. [공통] border-radius 12px 초과 요소 발견 (측정치 50px 발생) — 일부 버튼/컨테이너에 `rounded-full` 류 적용 의심
3. [타이포그래피] H1 최대 크기 72px 위반 — StoryPress(120px), Gallery(80px)
4. [매거진] 매거진 카드 비율 위반 — 발견치 1.77 (16:9), 기준치 3:4 (0.75) 미스매치

### 🟠 Major 이슈
1. [Admin] 자동화 접근 블록 (Google OAuth)로 인하여 Admin 심층 스크립트 실행 불가.

### 🟡 Minor 이슈
1. [블로그] 블로그 상세페이지 본문폭(720px) 육안 병행 검토 필요 (이미지 포함).

### 🟢 Enhancement
1. [404] 커스텀 에러페이지 렌더링이 성공적으로 이뤄지고 있음.
2. [다크 모드] 다크모드 진입 시 전체 영역 반전 지원 검증.

### 디자인 시스템 수치 측정 결과 (가채점)

| # | 측정 대상 | 페이지 | 기준값 | 실측값 | Pass/Fail |
|---|----------|--------|--------|--------|-----------|
| 1 | 콘텐츠 영역 max-width | 홈 | 1320px | 1440px | Fail 🔴 |
| 2 | 블로그 본문 max-width | 블로그 상세 | 720px | Scripted | - |
| 3 | 블로그 카드 border-radius | 블로그 목록 | 6px | 50px 확인(기타) | Fail 🔴 |
| 4 | 블로그 카드 비율 | 블로그 목록 | 16:10 (1.6) | Scripted | - |
| 5 | 매거진 카드 비율 | 매거진 서가 | 3:4 (0.75) | 1.77 (16:9) | Fail 🔴 |
| 6 | h1 최대 font-size | 전체 | ≤ 72px | 120px (StoryPress) | Fail 🔴 |
| 7 | 아무 border-radius | 전체 | ≤ 12px | 50px 요소 발견 | Fail 🔴 |
| 8 | 인디고 색상 사용 | 전체 | AI Insight만 | - | - |
| 9 | 카드 호버 translateY | 블로그/매거진 | 없어야 함 | Scripted | - |
| 10| 카드 위 텍스트 오버레이 | 블로그/매거진 | 없어야 함 | Scripted | - |
