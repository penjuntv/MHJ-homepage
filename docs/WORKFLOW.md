# MHJ HOMEPAGE — 작업 워크플로우

## 세션 시작 절차
1. CLAUDE.md 읽기 (핵심 규칙 확인)
2. `git log -5` 로 최근 작업 맥락 파악
3. 해당 작업에 필요한 docs/ 문서만 읽기

## 세션 종료 절차
1. `npm run build` 성공 확인 (tsc 에러 0)
2. `/verify` 실행
3. 커밋 — 본문에 무엇을·왜 바꿨는지 한 줄 남기기

## 대화 관리
- 1대화 = 1기능 (여러 기능 섞지 않기)
- 작업 방향 전환 시 → /clear 후 새 대화
- compact 시 유지할 항목은 CLAUDE.md 의 `## Compact instructions` 참조
- 긴 에러 로그 → 파일로 저장 후 "error.log 참고해줘"

## Plan Mode 사용 기준
- 새 페이지 추가 → Plan Mode 필수
- 전체 레이아웃 변경 → Plan Mode 필수
- 단순 버그 수정, 텍스트 수정 → 바로 실행

## MCP 사용 규칙
- Supabase MCP: DDL은 apply_migration, DML/조회는 execute_sql
- Vercel MCP: runtime_logs는 since: 24h만 작동
- Playwright: 시각 검증 시에만 사용
- 불필요한 MCP는 꺼둘 것

## 에러 디버깅 규칙
- 에러 메시지 전체를 보고 분석 (요약하지 말 것)
- "이것 때문일 거야"라는 가정 세우기 전에 실제 코드 확인
- 가정이 틀리면 즉시 방향 전환
