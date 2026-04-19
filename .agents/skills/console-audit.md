# Console Audit Skill

## 목적
JS 에러, hydration mismatch, 리소스 404, 성능 경고를 수집한다.

## 실행 절차

### Step 1: Console 수집
대상 페이지 열기 → DevTools Console → 로드 완료 대기 → 기본 인터랙션 수행.

### Step 2: 분류

| 카테고리 | 키워드 | Severity |
|---------|--------|----------|
| Hydration mismatch | hydration, mismatch, did not match | P1 |
| JS Runtime Error | Uncaught, TypeError, ReferenceError | P0 |
| 리소스 404 | 404, Failed to load resource | P1 |
| CORS 에러 | CORS, blocked by CORS | P1 |
| Deprecation | deprecated, will be removed | P3 |
| Performance | [Violation], Long task | P3 |
| Supabase 에러 | supabase, pgrst, JWT | P0 |
| 이미지 누락 | img 404, ERR_FILE_NOT_FOUND | P1 |

### Step 3: 재현 조건
각 에러: 어떤 페이지 / 어떤 동작 후 / 콘솔 메시지 처음 3줄.

### Step 4: Network 탭
- 4xx/5xx 응답 목록
- 이미지 로드 실패 URL
- API 응답 > 3초

### Step 5: 보고
Severity 순 정렬, Walkthrough Artifact 출력.
