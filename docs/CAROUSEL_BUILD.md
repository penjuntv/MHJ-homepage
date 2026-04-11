# CAROUSEL_BUILD.md — Claude Code 세션 1 지시서
# 인스타그램 캐러셀 자동 생성 엔진

> **이 파일을 읽고 그대로 실행하세요.**
> Plan Mode에서 계획을 세우고, 승인 후 실행하세요.

---

## 작업 목표

블로그 글 데이터로부터 인스타그램 캐러셀 이미지 10장(1080×1350 PNG)을 자동 생성하는 API와 컴포넌트를 만든다. 기존 `/api/og` OG 이미지 생성 패턴(Satori/ImageResponse)을 확장하여 구현한다.

---

## 반드시 먼저 읽을 파일

```
docs/DESIGN_RULES.md     ← 색상, 폰트, radius 규칙
docs/DESIGN_SYSTEM.md    ← 디자인 토큰 원본
docs/ARCHITECTURE.md     ← 라우팅 + 컴포넌트 구조
docs/DB_SCHEMA.md        ← DB 스키마 (carousel 컬럼 이미 추가됨)
src/app/api/og/route.tsx ← 기존 OG 이미지 생성 코드 (패턴 참고)
```

---

## 현재 상태 (이미 완료된 것)

### DB (Supabase, project: vpayqdatpqajsmalpfmq)

**blogs 테이블에 이미 추가된 캐러셀 컬럼 11개:**
- `carousel_enabled` BOOLEAN DEFAULT false
- `carousel_title` TEXT — 인스타용 영어 훅 제목
- `carousel_subtitle` TEXT
- `carousel_points` JSONB — `[{title, body, highlight, highlightKr, highlightZh}]`
- `carousel_summary` TEXT[] — 영어 요약 4줄
- `carousel_summary_kr` TEXT[] — 한국어 요약
- `carousel_yussi_take` TEXT — Yussi 코멘트 (EN)
- `carousel_yussi_take_kr` TEXT — Yussi 코멘트 (KR)
- `carousel_cta` TEXT DEFAULT 'Read the full article'
- `carousel_style` TEXT DEFAULT 'default'
- `carousel_generated_at` TIMESTAMPTZ

**instagram_content 테이블 (신규, 독립 콘텐츠용):**
- id, content_type, title, data(JSONB), caption_en, caption_kr, caption_zh
- hashtags(TEXT[]), blog_id(FK nullable), style, status, scheduled_for
- posted_at, performance(JSONB), created_at, updated_at

**hashtag_presets 테이블 (신규, 8개 카테고리):**
- immigration, parenting, education, local, lunchbox, settlement, travel, storypress
- 모든 프리셋에 `#MHJnz` 포함

**Storage:**
- `carousel` 버킷 생성 완료 (public, PNG/JPEG/ZIP 허용, 5MB 제한)

### 블로그 카테고리 → 해시태그 매핑
```
Home Learning    → education
Life in Aotearoa → local
Little 15 Mins   → storypress (또는 education)
Local Guide      → local
Settlement       → settlement
Whānau           → parenting (아직 글 없음)
Travelers        → travel (아직 글 없음)
```

### 테스트용 블로그 글
- id:66 "[NZ] NCEA Is Changing: No More Levels, No More Credits" (Home Learning)
- id:67 "Fireworks at Shore — Orewa Surf Sounds 2026" (Local Guide)
- id:68 "Night Market Tuesdays" (Life in Aotearoa)

---

## 구현할 것

### 1. 디자인 토큰 파일

**파일: `src/components/carousel/tokens.ts`**

```typescript
export const carouselTokens = {
  canvas: {
    width: 1080,
    height: 1350,
    safeMargin: 80,
    profileCropZone: 270,
    uiOverlay: 150,
  },
  colors: {
    bg: '#FFFFFF',
    bgWarm: '#FAF8F5',
    bgSurface: '#F8FAFC',
    text: '#1A1A1A',
    textSecondary: '#64748B',
    textTertiary: '#CBD5E1',
    accent: '#8A6B4F',         // MHJ 브랜드 — 절대 인디고(#4F46E5) 사용 금지
    accentDark: '#C9A882',
    border: '#EDE9E3',
    borderLight: '#F1F5F9',
    highlight: '#FEF3C7',
  },
  typography: {
    display: 'Playfair Display',
    body: 'Inter',
    bodyKr: 'Noto Sans KR',
    bodyZh: 'Noto Sans SC',
  },
  decoration: {
    borderRadius: 8,
    highlightRadius: 6,
    ctaButtonRadius: 24,
    accentLineWidth: 3,
  },
  styles: {
    default:   { bg: '#FAF8F5', text: '#1A1A1A' },
    editorial: { bg: '#FFFFFF', text: '#1A1A1A' },
    dark:      { bg: '#1E1E1E', text: '#F8FAFC' },
    photo:     { bg: 'transparent', text: '#FFFFFF' },
    quote:     { bg: '#8A6B4F', text: '#FFFFFF' },
  },
} as const;
```

### 2. 타입 정의

**파일: `src/components/carousel/types.ts`**

```typescript
export interface CarouselPoint {
  title: string;          // English
  body: string;           // English (2-3 sentences)
  highlight: string;      // English highlight line
  highlightKr?: string;   // 한국어
  highlightZh?: string;   // 中文
}

export interface CarouselInput {
  category: string;
  style: 'default' | 'editorial' | 'dark' | 'photo' | 'quote';
  coverImageUrl?: string;
  title: string;           // English hook title
  subtitle?: string;
  titleKr?: string;        // 한국어 부제
  points: CarouselPoint[];
  visualImageUrl?: string;
  pullQuote?: string;
  summaryPoints: string[];       // English 4-line
  summaryKr?: string[];          // 한국어
  yussiTake?: string;            // English
  yussiTakeKr?: string;          // 한국어
  ctaTitle: string;
  ctaUrl?: string;
  brandName?: string;            // default: 'MHJ'
  instagramHandle?: string;      // default: '@mhj_nz'
}

export interface CarouselSlide {
  index: number;
  type: 'cover' | 'context' | 'content' | 'visual' | 'summary' | 'yussi' | 'cta';
  imageBase64: string;
}

export interface CarouselOutput {
  slides: CarouselSlide[];
  captionEn: string;
  captionKr?: string;
  hashtags: string[];
}
```

### 3. 슬라이드 JSX 컴포넌트 (Satori용)

**디렉토리: `src/components/carousel/slides/`**

Satori에서 렌더링되는 JSX 함수들. **React 컴포넌트가 아니라 JSX를 반환하는 함수**여야 한다 (Satori는 React-DOM이 아님).

7개 파일:
- `CoverSlide.tsx` — #1: 배경 사진(optional) + Playfair Display 제목 + 한국어 부제
- `ContextSlide.tsx` — #2: "Why this matters" 텍스트 슬라이드
- `ContentSlide.tsx` — #3~6: 번호 + 소제목 + 본문 + 하이라이트 박스 + 한국어 하이라이트
- `VisualBreakSlide.tsx` — #7: 풀블리드 사진 + pull quote 오버레이
- `SummarySlide.tsx` — #8: 4줄 영어 체크리스트 + 한국어 요약
- `YussiTakeSlide.tsx` — #9: Yussi 배지(#8A6B4F) + 영어 본문 + 한국어 원문
- `CtaSlide.tsx` — #10: MHJ 로고/브랜드 + Save/Send/Follow CTA + 다국어

**공통 규칙 (모든 슬라이드):**
- 캔버스: `width: 1080, height: 1350` (Satori의 `width`/`height` 옵션)
- **display: 'flex'** 필수 (Satori는 flexbox만 지원, grid 금지)
- 모든 스타일은 **inline style 객체**로 작성 (Tailwind/CSS 클래스 불가)
- padding: 최소 80px 사방 (안전 영역)
- 폰트 크기: 최소 16px (인스타에서 가독성)
- border-radius: 8px 이하 (DESIGN_RULES)
- 색상: `carouselTokens.colors` 참조
- 한국어/중국어 부연 텍스트: 본문보다 작게 (16~18px), `textSecondary` 색상
- 하단 매 슬라이드: 브랜드 워터마크 `MHJ` 또는 슬라이드 번호 (작게)

**Satori 제약사항 주의:**
- `display: 'grid'` 금지
- `position: 'absolute'`는 가능하지만 부모가 `position: 'relative'` 필요
- `background-image: url()` 대신 `<img>` 태그 사용
- 이미지 src: base64 또는 절대 URL
- text-transform, text-decoration 제한적 지원
- lineHeight는 숫자(1.5)가 아닌 문자열 필요 없음 (Satori는 숫자 OK)

### 4. 캐러셀 생성 API Route

**파일: `src/app/api/carousel/generate/route.tsx`**

```
POST /api/carousel/generate
Body: { blogId: number } 또는 { input: CarouselInput }
Response: { slides: CarouselSlide[], captionEn, captionKr, hashtags }
```

**로직:**
1. blogId가 주어지면 → Supabase에서 blogs 테이블 조회 → carousel_* 컬럼에서 CarouselInput 조립
2. input이 직접 주어지면 → 그대로 사용
3. 폰트 파일 로드 (fetch로 ArrayBuffer):
   - Inter Regular + Bold (영어 본문)
   - Playfair Display Bold (영어 제목)
   - Noto Sans KR Regular (한국어 부연)
4. 10장 슬라이드 순회하며 각각 `ImageResponse` (또는 `satori` + `@resvg/resvg-js`) 호출
5. 결과 PNG를 base64로 반환
6. 캡션 + 해시태그 자동 생성

**폰트 로딩 전략:**
- `public/fonts/` 디렉토리에 TTF 파일 배치
- API Route에서 `fetch(new URL('/fonts/Inter-Regular.ttf', ...))` 패턴
- 또는 기존 `/api/og` 구현의 폰트 로딩 방식 그대로 따라가기
- **폰트 파일이 없으면**: Google Fonts에서 다운로드하여 `public/fonts/`에 배치
  - Inter: https://fonts.google.com/specimen/Inter (Regular 400, Bold 700)
  - Playfair Display: https://fonts.google.com/specimen/Playfair+Display (Bold 700)
  - Noto Sans KR: https://fonts.google.com/noto/specimen/Noto+Sans+KR (Regular 400)
- **번들 크기 주의**: Noto Sans KR TTF는 매우 큼 (~16MB). 서브셋 필요.
  - `pyftsubset` 또는 `fonttools`로 한국어 기본 음절(가~힣) + 기본 라틴만 추출
  - 또는 Noto Sans KR의 가벼운 woff 대신 **Regular 웨이트만** 사용
  - 목표: 폰트 총합 2MB 이내

**Satori vs ImageResponse 선택:**
- `ImageResponse` (from `next/og`): 더 간단. App Router에서 바로 사용 가능.
- 단, 10장을 순차 생성하면 느릴 수 있음 → `Promise.all`로 병렬 생성 고려
- Edge Runtime이면 500KB 번들 제한 → **Node.js Runtime** 사용 권장
  ```typescript
  export const runtime = 'nodejs'; // Edge 아님 — 폰트 크기 때문
  ```

### 5. 캐러셀 다운로드 API

**파일: `src/app/api/carousel/download/route.tsx`**

```
GET /api/carousel/download?blogId=66&format=zip
GET /api/carousel/download?blogId=66&format=individual&slide=0
```

- `format=zip`: 10장 PNG를 ZIP으로 묶어 반환 (archiver 또는 JSZip 패키지)
- `format=individual`: 단일 PNG 반환
- Content-Disposition 헤더 설정하여 다운로드 트리거

### 6. 캡션 생성 API

**파일: `src/app/api/carousel/caption/route.tsx`**

```
POST /api/carousel/caption
Body: { blogId: number, category: string }
Response: { captionEn, captionKr, hashtags }
```

- `hashtag_presets` 테이블에서 category에 맞는 해시태그 조회
- 블로그 카테고리 → 해시태그 카테고리 매핑:
  ```
  'Home Learning'     → 'education'
  'Life in Aotearoa'  → 'local'
  'Little 15 Mins'    → 'storypress'
  'Local Guide'       → 'local'
  'Settlement'        → 'settlement'
  'Whānau'            → 'parenting'
  'Travelers'         → 'travel'
  ```
- 캡션 템플릿:
  ```
  {title}

  {point highlights joined by newline}

  💾 Save this for later
  📩 Send to a friend who needs this
  💬 What's your experience? Share below

  🇰🇷 {captionKr || '한국어 요약은 프로필 링크에서'}
  🇨🇳 {captionZh || '详情请看主页链接'}

  {hashtags joined by space}
  ```

### 7. 유틸리티

**파일: `src/components/carousel/utils.ts`**

- `blogCategoryToHashtagCategory(category: string): string` — 매핑 함수
- `generateCaption(input: CarouselInput, hashtags: string[]): { captionEn, captionKr }` — 캡션 생성
- `buildCarouselInputFromBlog(blog: any): CarouselInput` — blogs row → CarouselInput 변환

---

## 파일 구조 요약

```
src/
  components/
    carousel/
      tokens.ts                    ← 디자인 토큰
      types.ts                     ← TypeScript 타입
      utils.ts                     ← 유틸리티 함수
      slides/
        CoverSlide.tsx             ← #1
        ContextSlide.tsx           ← #2
        ContentSlide.tsx           ← #3~6 (번호 prop)
        VisualBreakSlide.tsx       ← #7
        SummarySlide.tsx           ← #8
        YussiTakeSlide.tsx         ← #9
        CtaSlide.tsx               ← #10

  app/
    api/
      carousel/
        generate/route.tsx         ← POST: 10장 PNG 생성
        download/route.tsx         ← GET: ZIP/개별 다운로드
        caption/route.tsx          ← POST: 캡션 + 해시태그
```

---

## 디자인 가이드라인

### 슬라이드 비주얼 톤

MHJ는 에디토리얼 매거진이다. **Kinfolk + Cereal Magazine** 느낌.
- 여백을 충분히 (cramped 금지)
- 텍스트 과적재 금지 (슬라이드당 1 메시지)
- 깔끔한 타이포그래피 중심
- 사진이 없는 슬라이드는 타이포그래피 + 미니멀 장식으로
- accent color(#8A6B4F)는 라인, 번호, 배지에만 절제해서 사용

### 색상 절대 규칙
- 인디고(#4F46E5) 사용 금지 — AI Insight 전용
- 차가운 회색(#F5F5F5) 금지 — 따뜻한 크림톤(#FAF8F5) 사용
- 검은 배경은 `dark` 스타일에서만

### 타이포그래피
- 영어 제목: Playfair Display Bold, 44~52px
- 영어 본문: Inter Regular, 20~24px, line-height 1.7
- 한국어 부연: Noto Sans KR Regular, 16~18px, textSecondary 색상
- 슬라이드 번호: Playfair Display Bold, 56~64px, accent 색상
- 브랜드: 'MHJ' Playfair Display 400, 18px, letter-spacing 3px

### radius
- DESIGN_RULES: ≤ 12px
- 캐러셀 내 박스: 6~8px
- CTA 버튼: 24px (예외 허용)

---

## 테스트 방법

1. `npm run build` 통과 확인
2. 개발 서버 `localhost:3003`에서:
   - `POST /api/carousel/generate` with `{ "blogId": 66 }` → 10장 base64 PNG 응답 확인
   - 각 PNG가 정확히 1080×1350인지 확인
   - 한글 렌더링 깨짐 없는지 확인
   - 안전 영역 내에 텍스트가 있는지 확인
3. 블로그 66번에 carousel 데이터가 없을 수 있으므로, 테스트용 더미 데이터로 직접 호출:
   ```json
   {
     "input": {
       "category": "education",
       "style": "default",
       "title": "5 Things I Wish I Knew Before NZ School Enrolment",
       "subtitle": "A guide for immigrant families",
       "titleKr": "NZ 학교 입학 전 알았으면 좋았을 5가지",
       "points": [
         {
           "title": "Zoning matters more than you think",
           "body": "In New Zealand, your home address determines which school your children can attend. This is called the school zone or enrolment scheme.",
           "highlight": "Check the school zone BEFORE signing a rental agreement",
           "highlightKr": "임대 계약 전에 학교 존 확인하세요"
         },
         {
           "title": "The school year starts in January",
           "body": "Unlike many Asian countries where school starts in March, NZ schools begin their academic year in late January or early February.",
           "highlight": "Plan your move around Term 1 start dates",
           "highlightKr": "1학기 시작일에 맞춰 이사 계획을"
         },
         {
           "title": "Year levels work differently",
           "body": "NZ uses a Year 1-13 system. Children start school on their 5th birthday, not at the beginning of the school year.",
           "highlight": "Your child may enter mid-term — that's completely normal here",
           "highlightKr": "학기 중 입학은 NZ에서 완전히 정상입니다"
         },
         {
           "title": "School donations are voluntary",
           "body": "Most NZ schools ask for an annual donation, but it is not compulsory. This changed with government policy in recent years.",
           "highlight": "You won't be penalised for not paying the donation",
           "highlightKr": "기부금 미납해도 불이익 없습니다"
         }
       ],
       "summaryPoints": [
         "✓ Check school zones before choosing where to live",
         "✓ School year starts in January, not March",
         "✓ Mid-term enrolment is normal in NZ",
         "✓ School donations are voluntary"
       ],
       "summaryKr": [
         "✓ 거주지 선택 전 학교 존 확인",
         "✓ 학년은 1월 시작",
         "✓ 학기 중 입학 가능",
         "✓ 학교 기부금은 자율"
       ],
       "yussiTake": "As a social work student, I see many immigrant families stressed about school enrolment. The NZ system is actually more flexible than most Asian education systems — embrace that flexibility.",
       "yussiTakeKr": "사회복지학을 공부하면서 많은 이민 가정이 학교 입학 때문에 스트레스받는 걸 봅니다. NZ 교육 시스템은 아시아보다 훨씬 유연해요.",
       "ctaTitle": "Read the full guide on mhj.nz",
       "ctaUrl": "https://www.mhj.nz/blog/ncea-is-changing-no-more-levels-no-more-credits"
     }
   }
   ```

---

## 제약사항 & 주의사항

- **기존 코드 수정 금지**: 이 세션은 신규 파일만 생성. 기존 컴포넌트/페이지/API 변경 없음.
- **Admin UI는 이 세션에서 만들지 않음**: 세션 2에서 별도 구현.
- **runtime: 'nodejs'** 사용 (Edge 아님 — 폰트 크기 제한 회피)
- **`npm run build` 반드시 통과** 후 commit
- 폰트 파일이 없으면 Google Fonts에서 다운로드하여 `public/fonts/`에 배치
- Noto Sans KR은 서브셋 필요 (전체 TTF 16MB → 서브셋 후 ~2MB 목표)
- archiver/JSZip 등 패키지가 필요하면 설치 (`npm install`)
- 기존 `/api/og/route.tsx` 구현을 반드시 읽고 동일한 폰트 로딩 패턴 따르기
