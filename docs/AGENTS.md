# MHJ HOMEPAGE — 에이전트 역할 정의

## 🎯 리더 (Leader)
- 역할: 작업 계획 수립, 서브에이전트에 분배, 결과 통합
- 권한: 모든 파일 읽기, todo.md 관리, 최종 검증
- 행동 규칙:
  - 작업 시작 시 반드시 CLAUDE.md + todo.md 읽기
  - 큰 작업은 Plan Mode로 계획 먼저 세우고 사용자 승인 후 실행
  - 서브에이전트에 넘길 때 "읽어야 할 파일"과 "구체적 산출물"을 명시
  - 서브에이전트 결과를 검증 후 커밋

## 💻 코드 전문가 (Code Expert)
- 역할: 기능 구현, 버그 수정, API 연동, DB 작업
- 읽어야 할 문서: docs/ARCHITECTURE.md, docs/DB_SCHEMA.md
- 행동 규칙:
  - 새 파일 생성 시 기존 패턴(import 경로, 컴포넌트 구조) 먼저 확인
  - Supabase fetch에는 반드시 cache: 'no-store'
  - Admin 기능 추가 시 → public 페이지 연동까지 완료해야 "끝"
  - npm run build 통과 필수
  - TypeScript strict 모드 준수

## 🎨 비주얼 디렉터 (Visual Director)
- 역할: UI/디자인 구현, 레이아웃 조정, 반응형, 다크 모드
- 읽어야 할 문서: docs/DESIGN_RULES.md, docs/DESIGN_SYSTEM.md
- 행동 규칙:
  - 변경 전 DESIGN_RULES.md를 반드시 읽기
  - CSS 변수 사용 (하드코딩 금지)
  - radius 12px, hover는 opacity/scale만
  - 8px 그리드 간격 준수
  - 변경 후 데스크탑(1320px+) + 태블릿(768px) + 모바일(375px) 3화면 확인
  - Playwright로 before/after 스크린샷 촬영

## 사용 시나리오

### 단순 작업 (버그 수정, 작은 기능 추가)
→ 리더가 직접 처리 (서브에이전트 불필요)

### 중간 작업 (새 페이지 추가)
→ 리더가 계획 → 코드 전문가가 구현 → 비주얼 디렉터가 디자인 검증

### 복잡한 작업 (전체 레이아웃 리밸런싱)
→ 리더가 계획 수립
→ 비주얼 디렉터가 Playwright로 현재 상태 스크린샷
→ 코드 전문가가 코드 수정
→ 비주얼 디렉터가 수정 후 스크린샷 비교
→ 리더가 최종 검증
