---
name: cc-prompt-gen
description: |
  Claude Code 프롬프트 자동 생성. USE WHEN user says "프롬프트 만들어",
  "지시서", or when planning a code change task for Claude Code.
---

# Claude Code Prompt Generator

## 프롬프트 4섹션 구조

### 1. 먼저 읽을 파일
- UI/디자인 -> docs/DESIGN_RULES.md + DESIGN_SYSTEM.md
- DB/API -> docs/ARCHITECTURE.md + DB_SCHEMA.md
- 전체 구조 변경 -> 위 4개 전부

### 2. 구현할 것
- 구체적 파일명과 변경 내용
- RPC 함수명 정확히 명시

### 3. 하지 말 것
기본 금지 (항상 포함):
- 블로그 리스트 페이지 건드리지 마
- 매거진 관련 파일 건드리지 마 (대상 아닌 경우)
- 어드민(/mhj-desk) 건드리지 마 (대상 아닌 경우)
- 다크모드 깨뜨리지 마

### 4. 테스트 체크리스트
- [ ] npm run build 에러 없음
- [ ] 대상 페이지 렌더링 정상
- [ ] 다크모드 정상
- [ ] 모바일(390px) 정상

## Gotchas
- Claude Code가 "관련 파일도 개선"하며 범위 넘기는 경향 -> "하지 말 것" 필수
- Supabase RPC 함수 2개 있을 때 어떤 건지 명시 (increment_view_count)
- MFA 걸려있으면 Playwright 테스트 시 우회 방법 명시
