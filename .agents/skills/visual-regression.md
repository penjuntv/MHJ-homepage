# Visual Regression Skill

## 목적
Production(www.mhj.nz)과 Dev(localhost:3003) 동일 페이지 비교.

## 절차

### Step 1: Baseline (Production)
www.mhj.nz 에서 5페이지 캡처 (1440px):
/, /about, /blog, /blog/[최신글], /magazine

### Step 2: Current (Dev)
localhost:3003 에서 동일 캡처.

### Step 3: 비교
- 의도된 변경 → ✅
- 회귀 (수정 안 한 부분 변경) → ⚠️ P1
- 동일 → 스킵

### Step 4: 모바일 (375px) 반복

### Step 5: 다크모드 반복

### Step 6: 보고
| 페이지 | 뷰포트 | 상태 | 비고 |
회귀 발견 시 before/after 스크린샷 나란히 배치.
