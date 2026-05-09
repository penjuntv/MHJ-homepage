# V3 실행 전 안전 가이드 (Penny 직접 실행)

**작성**: 2026-05-09 (조사 결과 기반)
**목적**: 라이브 사이트 영향 0% 보장 + Claude Code 세션 시작 전 환경 준비

---

## 🟢 좋은 소식 (조사 결과)

### 1. 라이브 사이트는 V2에 의존하지 않는다
- 공개 페이지(`app/blog/*`, `app/page.tsx`)에서 `carousel_*` 컬럼을 **사용하지 않음**
- V2는 어드민 안에서만 동작 → PNG 뽑아 인스타에 수동 업로드용
- **결론: V2 코드를 건드려도 www.mhj.nz 방문자 영향 0**

### 2. V2 데이터는 1개 블로그만 사용
- DB 검색 결과: `carousel_enabled=true`인 블로그는 단 1개 (Albany Library, id=77)
- 이 데이터는 보존하면 됨 (V3와 별도 테이블 사용 예정이라 충돌 없음)

### 3. V3는 신규 디렉터리 — 충돌 0
- `mockups/v3final/` ❌ 없음 (안전, V3 자산 복사 가능)
- `docs/specs/` ❌ 없음 (안전, V3 spec 복사 가능)
- `lib/carousel-v3/` ❌ 없음 (안전)
- `app/api/carousel-v3/` ❌ 없음 (안전)
- `app/mhj-desk/carousel-v3/` ❌ 없음 (안전)

### 4. Playwright가 이미 설치돼 있다
- `package.json`에 `playwright: ^1.59.1` 있음
- Session 2 (Playwright 폴백)에서 추가 설치 불필요
- **단**: Vercel 프로덕션 배포에는 `playwright-core` + `@sparticuz/chromium-min`로 교체 필요

---

## ⚠️ 주의사항 (놓치지 말기)

### A. V2 코드는 살아있고 사용 중이다
**현재 V2 활성 경로 (수정 절대 금지)**:
- `components/carousel/v2/*` (53 파일)
- `components/carousel/render.tsx`, `types.ts`, `slides/*` (V1 잔재)
- `app/api/carousel/generate/route.tsx`
- `app/api/carousel/caption/route.tsx`
- `app/api/carousel/download/route.tsx`
- `app/api/carousel/ai-layout/route.tsx`
- `app/api/carousel/proxy-image/route.tsx`
- `app/api/carousel/save-content/route.tsx`
- `app/mhj-desk/carousel/page.tsx`
- `app/mhj-desk/carousel/gallery/*`

**Claude Code에 명시할 금지 규칙**:
> NEVER touch any file in:
> - components/carousel/ (V1 + V2)
> - app/api/carousel/ (V1 + V2)
> - app/mhj-desk/carousel/ (V2 admin)

### B. blogs 테이블의 carousel_* 컬럼은 보존
12개 컬럼 (`carousel_enabled`, `carousel_title`, `carousel_subtitle`, `carousel_points`, `carousel_summary`, `carousel_summary_kr`, `carousel_yussi_take`, `carousel_yussi_take_kr`, `carousel_cta`, `carousel_style`, `carousel_generated_at`, `carousel_series_name`, `carousel_series_number`).

V3는 신규 테이블 `carousel_v3_jobs`에 데이터 저장 → **blogs 테이블 컬럼 ALTER/DROP 절대 금지**.

### C. 내비게이션 메뉴
`app/mhj-desk/layout.tsx` 28번 줄에 V2 카루셀 링크 있음:
```ts
{ type: 'item', href: '/mhj-desk/carousel', label: '캐러셀', icon: LayoutGrid }
```

V3 추가 시:
- 이 줄은 **유지** (V2 어드민도 계속 접근 가능해야 함, "Legacy" 라벨로 표시 권장)
- V3 링크는 별도 추가: `{ type: 'item', href: '/mhj-desk/carousel-v3', label: '캐러셀 V3', icon: ... }`

---

## 📋 사전 작업 체크리스트 (Penny 직접 실행)

세션 시작 전에 이 순서로 진행:

### Step 1: 작업 브랜치 만들기
```bash
cd ~/Desktop/[MHJ 레포 경로]   # MHJ-homepage 디렉터리
git status                       # clean working tree 확인
git checkout main
git pull origin main             # 최신 상태로
git checkout -b feature/carousel-v3
```

**왜?**: V3 작업 중 V2 사용 가능 + 문제 생기면 main으로 즉시 복귀.

### Step 2: V3 자산 복사
Claude.ai에서 받은 `v3final/` 폴더를 다음 위치로:

```bash
# mockups 폴더 만들기 (V3 시각 레퍼런스)
mkdir -p mockups/v3final
cp ~/Downloads/v3final/T*.png mockups/v3final/
cp ~/Downloads/v3final/_tokens.css mockups/v3final/
cp ~/Downloads/v3final/A_mobile_*.png mockups/v3final/
cp ~/Downloads/v3final/B_shrink_test.png mockups/v3final/

# T1~T6 HTML도 필요 (Claude.ai에는 PNG만 보냈음, HTML은 별도 요청 필요)
# → /home/claude/mockups/v3final/T*.html 가져오기

# spec 문서 위치
mkdir -p docs/specs
cp ~/Downloads/v3final/V3_AUTOMATION_SPEC.md docs/specs/CAROUSEL_V3_SPEC.md
cp ~/Downloads/v3final/RESEARCH_SUMMARY.md docs/specs/CAROUSEL_V3_RESEARCH.md
```

### Step 3: 자산 검증
```bash
ls docs/specs/CAROUSEL_V3_SPEC.md          # 612줄
ls mockups/v3final/_tokens.css             # 디자인 토큰
ls mockups/v3final/T3_quote_4x5.png        # Session 1 게이트 비교 대상
ls mockups/v3final/T3_quote.html           # Session 1 reference
```

다 있으면 OK. 없으면 Claude.ai에 요청해서 받기.

### Step 4: 환경 확인
```bash
# dev 서버 테스트
npm run dev   # localhost:3003 떠야 함

# 별도 터미널에서
curl http://localhost:3003/api/health 2>/dev/null || echo "ok if 404"

# .env.local 점검 (없으면 안 됨)
cat .env.local | grep -E "SUPABASE|RESEND|GEMINI" | head -5

# Playwright 동작 확인
npx playwright --version   # 1.59.x 표시되어야 함
```

### Step 5: Vercel 환경변수 점검 (Pro 플랜 필요 — Session 2부터)
Vercel Dashboard → Settings → Environment Variables에 추가:
- `AWS_LAMBDA_JS_RUNTIME` = `nodejs22.x`
- `LD_LIBRARY_PATH` = `/var/task/node_modules/@sparticuz/chromium/bin`

**그리고 Fluid Compute는 OFF로** (Settings → Functions → Fluid Compute 토글 끄기).

### Step 6: 메모리 확인 (Claude.ai)
이번 세션 메모리 #25에 V3 spec 결정사항 저장됨:
> "MHJ 캐러셀 V3 spec(2026-05-09): agent-slide-maker-easy+Satori 패턴..."

다음 Claude Code 세션이 메모리에서 컨텍스트 받음.

---

## 🚀 Claude Code 세션 1 실행

위 체크리스트 완료 후, 새 Claude Code 세션 열고 다음 프롬프트 그대로 붙여넣기:

```
[V3 Automation Spec Section 12의 Plan Mode 프롬프트 — 첨부 spec에서 복사]
```

(Spec의 Section 12에 있는 프롬프트를 그대로 사용)

**Plan Mode가 보여주는 계획을 먼저 검토 후 승인** — 절대 자동 진행 금지.

---

## 🛑 Session 1 게이트 (이게 가장 중요)

Session 1 완료 후, **이 검증을 통과해야만** Session 2 진행:

```bash
# 1. T3 Quote PNG 생성
curl -X POST http://localhost:3003/api/carousel-v3/preview \
  -H "Content-Type: application/json" \
  -d @tests/fixtures/t3-quote-sample.json \
  --output /tmp/t3-test.png

# 2. 시각 비교 (Antigravity 또는 직접 눈으로)
# /tmp/t3-test.png vs mockups/v3final/T3_quote_4x5.png
# 픽셀 차이 < 10% 또는 사람 눈으로 "거의 동일" 판정
```

게이트 통과 못 하면:
- ❌ Session 2 진행 금지
- ✅ Session 1 다시 (Satori CSS 조정)
- ❌ Playwright로 도망가지 마 (V2 실수 반복)

---

## 🔄 롤백 시나리오

만약 V3 작업 중 무엇이든 깨지면:

```bash
# 즉시 main으로 복귀
git checkout main
git branch -D feature/carousel-v3   # 작업 폐기

# DB는 V3 마이그레이션 롤백 (Session 3 이후)
# Supabase Dashboard → Database → Migrations → 해당 migration revert

# Vercel 배포는 자동 — feature 브랜치는 프리뷰 배포만 됨
# main 브랜치 production 배포는 영향 없음
```

---

## ✅ 충돌 방지 최종 점검

| 영역 | V2 위치 | V3 위치 | 충돌 |
|---|---|---|---|
| **컴포넌트** | `components/carousel/v2/*` | `lib/carousel-v3/*` | ❌ 없음 |
| **API** | `app/api/carousel/*` | `app/api/carousel-v3/*` | ❌ 없음 |
| **어드민** | `app/mhj-desk/carousel/*` | `app/mhj-desk/carousel-v3/*` | ❌ 없음 |
| **DB 컬럼** | `blogs.carousel_*` | `carousel_v3_jobs` (신규 테이블) | ❌ 없음 |
| **DB 데이터** | 1개 블로그 (id=77) | 새 row만 | ❌ 없음 |
| **내비게이션** | `/mhj-desk/carousel` 링크 | 추가 `/mhj-desk/carousel-v3` | ❌ 없음 (병행) |
| **공개 페이지** | 사용 안 함 | 사용 안 함 | ❌ 없음 |
| **의존성** | `html-to-image`, `html2canvas` | `@vercel/og`, (`playwright-core`) | ❌ 없음 (별도 추가) |

**완벽 분리. 라이브 사이트(www.mhj.nz) 영향 0%**.
