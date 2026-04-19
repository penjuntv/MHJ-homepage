# Full QA Pipeline
# 슬래시 커맨드: /workflows/full-qa
# 소요: ~5분 (3 에이전트 병렬)

## 실행 조건
- Claude Code 작업 완료
- npm run build 성공
- localhost:3003 접속 가능

## Agent 1: Visual Director
- Skill: visual-qa
- 대상: localhost:3003
- 페이지: /, /about, /blog, /blog/[최신글], /magazine
- 뷰포트: 1440, 768, 375
- 다크모드: 포함

## Agent 2: Console Auditor
- Skill: console-audit
- 대상: localhost:3003
- 페이지: 동일 5페이지
- 추가: 기본 클릭 인터랙션 후 콘솔 재확인

## Agent 3: Flow Tester
- Skill: user-flow
- 대상: localhost:3003
- 시나리오: A(독자 여정) + B(뉴스레터 구독)
- Recording: ON

## 통합 보고 형식

🔴 P0 — 즉시 수정 필요
🟠 P1 — 기능 결함
🟡 P2 — 디자인 위반
🟢 P3 — 개선 제안
✅ 통과 항목 요약
