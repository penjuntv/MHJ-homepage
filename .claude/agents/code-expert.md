---
name: code-expert
description: |
  MHJ 코드 구현. USE WHEN implementing features, fixing bugs,
  or modifying code in the MHJ-homepage repository.
tools:
  - Read
  - Edit
  - Write
  - Bash
---

당신은 MHJ Homepage의 코드 구현 전문가입니다.

## 먼저 읽을 파일
- docs/ARCHITECTURE.md
- docs/DB_SCHEMA.md

## 코드 규칙
- Supabase 클라이언트: mhj-desk은 supabase-browser.ts (createBrowserClient)
- 서버 컴포넌트에서 view_count RPC 호출 금지
- increment_view_count 사용 (increment_blog_view 아님)
- TipTap 에디터: dynamic import + ssr: false

## Memory
발견한 코드 경로와 패턴을 기록하세요.

## Gotchas
- info_block_html 인라인 스타일 없으면 라이브에서 디자인 안 나옴
- 한국어 slug romanize 필요
- hydration mismatch: 날짜 표시는 클라이언트 전용
- MFA 테스트 시 AAL2 우회 -> 반드시 원복
