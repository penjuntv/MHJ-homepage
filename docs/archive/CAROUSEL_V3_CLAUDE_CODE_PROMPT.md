# 캐러셀 V3 — 인스타그램 글로벌 기준 전면 리디자인

## 모델: Opus
## 세션 전략: 신규 1세션 (집중 실행)
## 예상 범위: tokens.ts + 27개 레이아웃 + SlideFooter + convertInput — 약 30개 파일 수정

---

## 반드시 먼저 읽을 파일

```
docs/DESIGN_RULES.md
components/carousel/v2/tokens.ts
components/carousel/v2/SlideFooter.tsx
components/carousel/v2/convertInput.ts
components/carousel/v2/SlideRenderer.tsx
```

레이아웃 파일은 수정 직전에 읽을 것 (한 번에 다 읽지 말고 수정할 때마다):
```
components/carousel/v2/layouts/*.tsx (27개)
```

레퍼런스 코드 (디자인 참고용):
```bash
git clone https://github.com/penjuntv/yussi-inata.git /tmp/yussi-inata
# /tmp/yussi-inata/src/App.tsx — 82K 단일 파일, 레이아웃 패턴 참고만
```

---

## 문제 정의

현재 캐러셀은 1080×1350 캔버스에서 **텍스트가 너무 작아서 인스타그램에서 읽을 수 없다.**

### 현재 fontSize 실측값 (grep 결과)

| 역할 | 현재 값 | 출현 횟수 | 문제 |
|------|--------|----------|------|
| 라벨/카테고리 | 0.75rem (12px) | **24회** | 업계 최소 18px 미만 |
| 본문 body | 0.875~0.9375rem (14~15px) | 18회 | 업계 최소 24px 미만 |
| 제목 title | 2~2.75rem (32~44px) | 17회 | 업계 권장 56~72px 미만 |
| Footer MHJ 로고 | 1rem (16px) | 1회 | 너무 작음 |
| Footer 번호 | 0.6875rem (11px) | 1회 | 거의 안보임 |

### 인스타그램 업계 기준 (2026)

| 요소 | 업계 최소 | 업계 권장 | 우리 목표 |
|------|---------|---------|---------|
| 커버 제목 | 36px | 48~72px | **4.5rem (72px)** |
| 콘텐츠 제목 | 36px | 48~56px | **3.5rem (56px)** |
| 서브타이틀 | 24px | 28~32px | **2rem (32px)** |
| 본문 | **24px** | 24~30px | **1.75rem (28px)** |
| 보조 텍스트 | 18px | 20~24px | **1.5rem (24px)** |
| 라벨/카테고리 | 18px | 20~24px | **1.375rem (22px)** |
| 캡션 최소 | 16px | 18px | **1.125rem (18px)** |

---

## Step 1: tokens.ts — fontSize 상수 추가

현재 tokens.ts에는 fontSize 상수가 **없다.** 27개 레이아웃이 각각 하드코딩하고 있다.
아래를 v2Tokens에 추가:

```typescript
export const v2Tokens = {
  canvas: { width: 1080, height: 1350 },

  // ✅ 신규: 인스타그램 글로벌 기준 폰트 사이즈
  fontSize: {
    heroTitle: '4.5rem',     // 72px — 커버 제목
    title: '3.5rem',         // 56px — 콘텐츠 제목
    subtitle: '2rem',        // 32px — 서브타이틀
    body: '1.75rem',         // 28px — 본문
    bodySmall: '1.5rem',     // 24px — 보조 텍스트
    label: '1.375rem',       // 22px — 라벨/카테고리
    caption: '1.125rem',     // 18px — 캡션 (절대 최소)
    decorNumber: '8rem',     // 128px — 장식 번호 (유지)
    decorQuote: '7.5rem',    // 120px — 장식 따옴표 (유지)
  },

  // ✅ 신규: 인스타그램 세이프 존
  safeZone: {
    top: '6.25rem',          // 100px
    bottom: '6.25rem',       // 100px (Footer 포함)
    sides: '3.75rem',        // 60px
  },

  brand: { ... },  // 기존 유지
  palette: { ... }, // 기존 유지
  fonts: { ... },   // 기존 유지
  presets: { ... },  // 기존 유지
} as const;
```

---

## Step 2: SlideFooter.tsx — 크기 키우기

현재:
- height: 70 → **90**
- MHJ 로고 fontSize: 1rem → **1.25rem**
- 번호 fontSize: 0.6875rem → **1rem**
- padding: '0 5rem' → **'0 3.75rem'** (safeZone.sides와 맞춤)

---

## Step 3: 27개 레이아웃 일괄 수정

### 매핑 테이블 (파일별 정확한 변경)

모든 레이아웃 공통 패턴:
- `fontSize: '0.75rem'` (라벨) → `v2Tokens.fontSize.label`
- `fontSize: '0.6875rem'` → `v2Tokens.fontSize.label`
- `fontSize: '0.875rem'` (본문) → `v2Tokens.fontSize.body`
- `fontSize: '0.9375rem'` (본문) → `v2Tokens.fontSize.body`
- `fontSize: '0.8125rem'` (보조) → `v2Tokens.fontSize.bodySmall`
- `padding: '5rem 5rem 4.375rem'` → `padding: '${v2Tokens.safeZone.top} ${v2Tokens.safeZone.sides} ${v2Tokens.safeZone.bottom}'`

### Cover 계열 (7개)

**CoverArch.tsx:**
- subtitle(카테고리): `0.75rem` → `v2Tokens.fontSize.label`
- 아치 이미지: width 280, height 340 → **width: 420, height: 500**
- title: `2.75rem` → `v2Tokens.fontSize.heroTitle` (4.5rem)

**CoverMinimal.tsx:**
- 라벨: `0.6875rem` → `v2Tokens.fontSize.label`
- title: `imgSrc ? '3rem' : '4rem'` → `imgSrc ? v2Tokens.fontSize.title : v2Tokens.fontSize.heroTitle`
- 아치 이미지: 280×320 → **380×440**

**CoverDark.tsx:**
- 라벨: `0.75rem` → `v2Tokens.fontSize.label`
- title: `3.5rem` → `v2Tokens.fontSize.heroTitle`

**CoverFullImage.tsx:**
- 라벨: `0.75rem` → `v2Tokens.fontSize.label`
- title: `2.75rem` → `v2Tokens.fontSize.heroTitle`

**CoverSplit.tsx:**
- 라벨: `0.75rem` → `v2Tokens.fontSize.label`
- title: `2.75rem` → `v2Tokens.fontSize.heroTitle`

**CoverPolaroid.tsx:**
- 라벨: `0.75rem` → `v2Tokens.fontSize.label`
- title: `2.5rem` → `v2Tokens.fontSize.heroTitle`

**CoverMagazine.tsx:**
- 라벨: `0.6875rem` → `v2Tokens.fontSize.label`
- title: `4.5rem` → 유지 (이미 충분)

### Content 계열 (11개)

**ContentStep.tsx:**
- title: `2.25rem` → `v2Tokens.fontSize.title`
- body: `0.9375rem` → `v2Tokens.fontSize.body`
- highlight 제목: `1rem` → `v2Tokens.fontSize.bodySmall`
- highlight subtitle: `0.8125rem` → `v2Tokens.fontSize.caption`
- circle photo: width/height 200 → **240** (조금 키우기)

**ContentEditorial.tsx:**
- stepNumber 라벨: `0.75rem` → `v2Tokens.fontSize.label`
- title: `2rem` → `v2Tokens.fontSize.title`
- body (드롭캡 rest): `0.9375rem` → `v2Tokens.fontSize.body`
- highlight title: `1rem` → `v2Tokens.fontSize.bodySmall`
- highlight subtitle: `0.8125rem` → `v2Tokens.fontSize.caption`
- 이미지 height: 360 → **420** (더 크게)

**ContentSplit.tsx:**
- stepNumber 라벨: `0.75rem` → `v2Tokens.fontSize.label`
- title: `2rem` → `v2Tokens.fontSize.title`
- body: `0.875rem` → `v2Tokens.fontSize.bodySmall`
- 이미지 영역: height '55%' → **'60%'**
- highlight title: `0.9375rem` → `v2Tokens.fontSize.bodySmall`
- highlight subtitle: `0.75rem` → `v2Tokens.fontSize.caption`

**ContentPhotoOverlay.tsx:**
- stepNumber 라벨: `0.75rem` → `v2Tokens.fontSize.label`
- glass card title: `1.875rem` → `v2Tokens.fontSize.title`
- body: `0.875rem` → `v2Tokens.fontSize.bodySmall`
- glass card padding: 32 → **40**
- highlight title: `0.9375rem` → `v2Tokens.fontSize.bodySmall`
- highlight subtitle: `0.75rem` → `v2Tokens.fontSize.caption`

**ContentQuote.tsx:**
- subtitle(카테고리): `0.75rem` → `v2Tokens.fontSize.label`
- 인용 텍스트: `1.875rem` → `v2Tokens.fontSize.subtitle` (2rem)
- attribution: `0.8125rem` → `v2Tokens.fontSize.caption`

**ContentBoldNumber.tsx:**
- 장식 번호: `8rem` → 유지 (decorNumber)
- 나머지 텍스트 스케일업

**ContentBarChart.tsx / ContentDonutChart.tsx:**
- 라벨: `0.75rem` → `v2Tokens.fontSize.label`
- title: `2rem` → `v2Tokens.fontSize.title`

**ContentStatGrid.tsx:**
- 라벨: `0.75rem` → `v2Tokens.fontSize.label`
- 나머지 텍스트 스케일업

**ContentList.tsx:**
- 라벨: `0.75rem` → `v2Tokens.fontSize.label`
- title: `2rem` → `v2Tokens.fontSize.title`

**ContentContinuousLine.tsx / ContentArchPhoto.tsx / ContentAbstract.tsx / ContentTimeline.tsx:**
- 동일 패턴 적용

**ContentNeoBrutalism.tsx / ContentSocialQuote.tsx:**
- 라벨/본문 동일 패턴 적용

### Special 계열 (4개)

**SummaryChecklist.tsx:**
- title: `2rem` → `v2Tokens.fontSize.title`
- 체크 항목: `1rem` → `v2Tokens.fontSize.bodySmall`
- 한국어: `0.9375rem` → `v2Tokens.fontSize.caption`

**YussiTake.tsx:**
- profile name: `0.875rem` → `v2Tokens.fontSize.bodySmall`
- profile role: `0.75rem` → `v2Tokens.fontSize.caption`
- title: `1.75rem` → `v2Tokens.fontSize.subtitle`
- quote body: `1rem` → `v2Tokens.fontSize.body` (1.75rem)
- 한국어: `0.9375rem` → `v2Tokens.fontSize.caption`
- "Y" circle: `1.25rem` → `v2Tokens.fontSize.bodySmall`

**VisualBreak.tsx:**
- quote text: `1.875rem` → `v2Tokens.fontSize.title` (3.5rem — 임팩트 강화)
- attribution: `0.8125rem` → `v2Tokens.fontSize.caption`

**CtaMinimal.tsx:**
- MHJ 로고: `3rem` → `v2Tokens.fontSize.title` (3.5rem)
- "my mairangi": `0.75rem` → `v2Tokens.fontSize.caption` (1.125rem)
- CTA title: `2rem` → `v2Tokens.fontSize.title`
- body: `0.875rem` → `v2Tokens.fontSize.bodySmall`
- URL: `0.8125rem` → `v2Tokens.fontSize.caption`

---

## Step 4: convertInput.ts — 본문 분량 줄이기

fallback 본문 3~4문장 → 1~2문장으로:

```typescript
// BEFORE
`Here's what we learned as an immigrant family in Auckland.`
// 이건 괜찮음 — 1문장

// BEFORE
`NZ schools have two breaks: morning tea around 10am and lunch at 12. You need to pack both — separately. Most new parents don't know this until day one.`
// AFTER
`NZ schools need two separate meals packed daily. Most new parents don't know this.`
```

모든 fallbackBodies를 최대 2문장으로 줄이기.

---

## Step 5: 이미지 크기 조정

### 핵심 원칙
**이미지는 원형/아치 안에 가두지 말고, 캔버스의 40~60%를 차지해야 한다.**

| 레이아웃 | 현재 | 목표 |
|---------|------|------|
| CoverArch 아치 | 280×340 | **420×500** |
| CoverMinimal 아치 | 280×320 | **380×440** |
| ContentStep circle | 200×200 | **240×240** |
| ContentEditorial 상단 이미지 | height 360 | **height 420** |
| ContentSplit 이미지 영역 | 55% | **60%** |

---

## Step 6: padding 통일

모든 레이아웃의 padding을 safeZone 기반으로 통일:

현재: `padding: '5rem 5rem 4.375rem'` (각 레이아웃마다 다름)
목표: `padding: \`\${v2Tokens.safeZone.top} \${v2Tokens.safeZone.sides} \${v2Tokens.safeZone.bottom}\``

단, ContentSplit/ContentPhotoOverlay처럼 이미지가 edge-to-edge인 레이아웃은 예외.

---

## 검증 체크리스트

```bash
# 1. 빌드 통과
npm run build

# 2. fontSize 검증 — 0.75rem, 0.875rem, 0.9375rem이 0개여야 함
grep -rn "fontSize: '0.75rem'" components/carousel/v2/layouts/*.tsx | wc -l
# 목표: 0

grep -rn "fontSize: '0.875rem'" components/carousel/v2/layouts/*.tsx | wc -l
# 목표: 0

grep -rn "fontSize: '0.9375rem'" components/carousel/v2/layouts/*.tsx | wc -l
# 목표: 0

# 3. v2Tokens.fontSize 사용 확인 — 최소 50회 이상
grep -rn "v2Tokens.fontSize" components/carousel/v2/layouts/*.tsx | wc -l
# 목표: 50+

# 4. SlideFooter height 확인
grep "height: 90" components/carousel/v2/SlideFooter.tsx
```

---

## 절대 하지 말 것

1. **레이아웃 구조 변경 금지** — 레이아웃 배치/flex 방향은 건드리지 마. fontSize/size/padding만 변경.
2. **새 레이아웃 추가 금지** — 기존 27개만 수정.
3. **SlideRenderer.tsx 변경 금지** — 라우팅 컴포넌트는 그대로.
4. **ExportEngine.tsx 변경 금지** — Export 로직은 이 세션에서 안 건드림.
5. **import 경로 변경 금지** — 파일명/경로는 전부 유지.

---

## 요약

**하는 것:** 폰트 크기 키우기, 이미지 크기 키우기, padding 세이프존 적용, 본문 줄이기
**안 하는 것:** 레이아웃 구조 변경, 새 파일 추가, Export 수정

이 작업은 "돋보기로 봐야 읽히는 인스타 캐러셀"을 "폰 화면에서 한 눈에 읽히는 프로 캐러셀"로 바꾸는 것이다.
