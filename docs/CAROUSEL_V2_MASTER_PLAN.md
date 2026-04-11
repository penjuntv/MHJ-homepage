# CAROUSEL V2 — 마스터 플랜
## MHJ Instagram Carousel Generator 완전 재구축

*작성: 2026-04-11 | PeNnY + Claude Opus*
*렌더링 엔진: html-to-image (클라이언트 사이드)*
*목표: Canva 수준의 에디토리얼 캐러셀 자동 생성*

---

## 현재 상태 요약

| 항목 | 현재 (v1) | 목표 (v2) |
|------|----------|----------|
| 렌더링 | Satori (서버, CSS 제약 심함) | html-to-image (클라이언트, CSS 제약 없음) |
| 슬라이드 수 | 6장 (4개 죽은 코드) | 10장 (전부 활성) |
| 레이아웃 | 5 variant 자동 순환 | 20+ 템플릿 선택 가능 |
| AI 연동 | 없음 (Yussi Factory 수동 JSON) | Gemini 자동 분석 + 레이아웃 추천 |
| 디자인 수준 | 70% (flat rect/circle) | 95%+ (blur, clip-path, gradient, arch) |
| 사진 처리 | cover만 가능 | 아치 클리핑, 원형, 폴라로이드, 오버레이 |
| 편집 | 폼 입력 → Generate | 실시간 미리보기 + 슬라이드별 레이아웃 교체 |

---

## 아키텍처 변경 핵심

### 렌더링 흐름 변경

```
[v1 — 서버 렌더링]
Admin 폼 입력 → POST /api/carousel/generate → Satori(서버) → base64 PNG 반환

[v2 — 클라이언트 렌더링]
Admin 편집 → React 컴포넌트 실시간 미리보기 → html-to-image(브라우저) → PNG/ZIP 다운로드
```

### 유지하는 것

- `/mhj-desk/carousel` 경로
- `CarouselInput`, `CarouselPoint` 타입 구조 (확장만)
- `blogs` 테이블의 `carousel_*` 컬럼
- `instagram_content` 테이블
- `hashtag_presets` 테이블
- BlogSelector, CaptionPanel, HashtagManager, RecentList (리팩토링)
- Yussi Factory JSON paste 기능
- 캡션 생성 로직 (`generateCaption`, `generateAltTexts`)

### 삭제/교체하는 것

- `components/carousel/render.tsx` → 삭제 (Satori 렌더러)
- `components/carousel/slides/*.tsx` → 전부 삭제, v2 컴포넌트로 교체
- `app/api/carousel/generate/route.tsx` → 삭제 (서버 렌더링 불필요)
- `app/api/carousel/download/route.tsx` → 삭제 (클라이언트 다운로드로 교체)
- `CarouselPreview.tsx` → 삭제, v2 라이브 미리보기로 교체
- `CarouselDownloader.tsx` → 삭제, v2 클라이언트 다운로더로 교체
- `CarouselEditor.tsx` → 대폭 리팩토링

### 새로 추가하는 것

- `html-to-image`, `file-saver` 패키지
- `components/carousel/v2/` — 새 슬라이드 컴포넌트 20+개
- `components/carousel/v2/LayoutLibrary.tsx` — 템플릿 선택 모달
- `app/api/carousel/ai-layout/route.ts` — Gemini 레이아웃 추천 API
- `components/carousel/v2/tokens.ts` — 확장된 디자인 토큰

---

## 세션 분할 (3세션)

### 세션 1: 렌더링 엔진 교체 + 핵심 컴포넌트 (Opus)

> 이 세션이 가장 중요. 기반을 다진다.

### 세션 2: 20+ 레이아웃 템플릿 구현 (Opus)

> 디자인 퀄리티를 결정하는 세션. Antigravity + Playwright QA 필수.

### 세션 3: Gemini AI 자동 배치 + 편집 UX (Sonnet)

> AI 연동과 UX 폴리싱.

---

# 세션 1 지시서: 렌더링 엔진 교체 + 기반 구축

## 반드시 먼저 읽을 파일

```
docs/DESIGN_RULES.md
docs/ARCHITECTURE.md
docs/DB_SCHEMA.md
components/carousel/types.ts        ← 기존 타입 (확장할 것)
components/carousel/utils.ts        ← 캡션 생성 등 유지할 유틸
components/carousel/tokens.ts       ← 기존 토큰 (확장할 것)
app/mhj-desk/carousel/page.tsx      ← 기존 Admin 페이지 (리팩토링 대상)
```

## 모델: Opus

## 작업 목록

### 1-1. 패키지 설치

```bash
npm install html-to-image file-saver @types/file-saver
```

### 1-2. 타입 확장 (`components/carousel/types.ts`)

기존 `CarouselInput`, `CarouselPoint` 유지하고 아래 추가:

```typescript
// v2 레이아웃 타입 — 20+ 템플릿
export type CarouselLayoutType =
  // 커버 (5종)
  | 'cover-arch'          // 아치 프레임 + 사진
  | 'cover-full-image'    // 전면 사진 + 그라디언트 오버레이
  | 'cover-split'         // 상하 분할 (사진/텍스트)
  | 'cover-minimal'       // 타이포그래피 중심
  | 'cover-polaroid'      // 폴라로이드 회전 프레임
  // 콘텐츠 (8종)
  | 'content-editorial'   // 매거진 드롭캡 스타일
  | 'content-step'        // 번호 + 원형 사진
  | 'content-split'       // 좌우 사진/텍스트
  | 'content-quote'       // 큰따옴표 강조
  | 'content-bold-number' // 거대 숫자 인포그래픽
  | 'content-photo-overlay' // 사진 위 글래스 카드
  | 'content-abstract'    // 원형 도형 겹침
  | 'content-list'        // 메뉴/리스트 스타일
  // 특수 (4종)
  | 'summary-checklist'   // 체크리스트 요약
  | 'yussi-take'          // Yussi 코멘트 (세이지 그린)
  | 'visual-break'        // 풀 이미지 + 인용
  | 'cta-minimal'         // CTA + 아이콘
  // 추가 (3종)
  | 'content-continuous-line'  // 라인아트 배경
  | 'content-arch-photo'      // 아치형 사진 클리핑
  | 'cover-dark';              // 다크 시네마틱 커버

export interface SlideConfig {
  id: number;                    // 1-10
  layout: CarouselLayoutType;    // 선택된 레이아웃
  // 데이터 (CarouselInput에서 매핑)
  title?: string;
  subtitle?: string;
  body?: string;
  stepNumber?: number;
  imageUrl?: string;             // Supabase Storage 또는 업로드
  customImage?: string;          // 사용자 업로드 (blob URL)
  // 스타일 오버라이드
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
}

export interface CarouselV2Output {
  slides: SlideConfig[];
  captionEn: string;
  captionKr?: string;
  hashtags: string[];
  altTexts: string[];
}
```

### 1-3. 디자인 토큰 확장 (`components/carousel/v2/tokens.ts`)

MHJ 브랜드 토큰 + yussi-inata 참고 + 레퍼런스 이미지 분석:

```typescript
export const v2Tokens = {
  canvas: { width: 1080, height: 1350 },

  // MHJ 브랜드 — DESIGN_RULES.md 기준
  brand: {
    cream: '#FAF8F5',
    brown: '#8A6B4F',
    brownLight: '#C9A882',
    dark: '#1A1A1A',
    surface: '#F8FAFC',
    border: '#EDE9E3',
  },

  // 캐러셀 전용 확장 팔레트 (레퍼런스 이미지 기반)
  palette: {
    warmBeige: '#F5EFE6',
    sandstone: '#E8DCCB',
    cardDark: '#4A3C31',
    gold: '#D4A373',
    goldMuted: '#C2B2A3',
    sage: '#8A9A86',
    peach: '#D8A48F',
    softBlue: '#B5C6C4',
    tealDark: '#0F4C5C',
    amberBold: '#E5A937',
    burgundy: '#8B2332',      // Merci Studio 참고
    charcoal: '#2C2C2C',
  },

  fonts: {
    display: "'Playfair Display', Georgia, serif",
    body: "'Inter', system-ui, sans-serif",
    bodyKr: "'Noto Sans KR', sans-serif",
  },

  // 슬라이드별 추천 색상 프리셋
  presets: {
    warm: { bg: '#FAF8F5', text: '#1A1A1A', accent: '#C9A882' },
    sand: { bg: '#E8DCCB', text: '#4A3C31', accent: '#D4A373' },
    dark: { bg: '#1A1A1A', text: '#F8FAFC', accent: '#C9A882' },
    sage: { bg: '#8A9A86', text: '#FFFFFF', accent: '#F5EFE6' },
    teal: { bg: '#0F4C5C', text: '#FFFFFF', accent: '#E5A937' },
    burgundy: { bg: '#8B2332', text: '#FFFFFF', accent: '#F5EFE6' },
  },
} as const;
```

### 1-4. 슬라이드 렌더러 기반 컴포넌트

`components/carousel/v2/SlideRenderer.tsx` — 핵심 컴포넌트:

- `SlideConfig`을 받아서 해당 layout에 맞는 React 컴포넌트를 렌더링
- 실제 DOM으로 렌더링 (Satori JSX가 아님)
- `1080×1350` 비율 유지 (실제 화면에서는 축소 표시, export 시 원본 크기)
- 각 슬라이드에 `ref`를 걸어서 `html-to-image`로 캡처 가능하게

```
슬라이드 크기: 1080 × 1350px (4:5 비율)
Admin 미리보기: aspect-ratio 4/5로 축소 표시
Export: pixelRatio 2 → 2160 × 2700px PNG
```

### 1-5. 클라이언트 Export 시스템

`components/carousel/v2/ExportEngine.tsx`:

```typescript
// html-to-image + JSZip + file-saver
import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export async function exportAllSlides(
  slideElements: HTMLElement[],
  filenameBase: string
): Promise<void> {
  const zip = new JSZip();
  for (let i = 0; i < slideElements.length; i++) {
    const dataUrl = await htmlToImage.toPng(slideElements[i], {
      quality: 1.0,
      pixelRatio: 2,
      width: 1080,
      height: 1350,
    });
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    zip.file(`${filenameBase}_${String(i + 1).padStart(2, '0')}.png`, base64, { base64: true });
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${filenameBase}.zip`);
}
```

### 1-6. Admin 페이지 리팩토링

`app/mhj-desk/carousel/page.tsx` 핵심 변경:

- `slides` state: `CarouselSlide[]` → `SlideConfig[]`
- Generate 버튼: 서버 API 호출 제거, `CarouselInput` → `SlideConfig[]` 변환 함수로 교체
- 미리보기: base64 이미지가 아닌 실제 React 컴포넌트 렌더링
- 다운로드: `html-to-image` 클라이언트 Export
- Yussi Factory JSON paste: 기존 로직 유지 + SlideConfig 변환 추가

### 1-7. 기본 레이아웃 3개 우선 구현

세션 1에서는 아래 3개만 먼저 구현 (동작 확인용):

1. `cover-minimal` — 가장 단순, 타이포 중심
2. `content-editorial` — 드롭캡 + 본문
3. `cta-minimal` — CTA 엔딩

나머지 17+개는 세션 2에서 구현.

### 1-8. 기존 서버 API 정리

- `/api/carousel/generate` → 삭제 (또는 deprecated 주석)
- `/api/carousel/download` → 삭제
- `/api/carousel/caption` → 유지 (캡션 생성은 서버에서 해도 됨)
- `/api/carousel/save-content` → 유지

### 1-9. 검증

```bash
npm run build
# localhost:3003/mhj-desk/carousel 접근
# 1) 블로그 선택 → 3개 레이아웃으로 10장 슬라이드 미리보기 표시
# 2) Download ZIP → 10장 PNG 포함 확인
# 3) Yussi Factory JSON paste 동작 확인
```

---

# 세션 2 지시서: 20+ 레이아웃 템플릿 구현

## 반드시 먼저 읽을 파일

```
docs/DESIGN_RULES.md
docs/DESIGN_SYSTEM.md
components/carousel/v2/tokens.ts       ← 세션 1에서 만든 토큰
components/carousel/v2/SlideRenderer.tsx ← 세션 1에서 만든 렌더러
```

## 모델: Opus

## 핵심 원칙

**이 세션이 퀄리티를 결정합니다.** 모든 레이아웃은 아래 기준을 충족해야 합니다:

1. **1080×1350px에서 완벽한 여백과 타이포그래피**
2. **텍스트 길이 변화에 대응** (짧은 제목 / 긴 제목 모두 깨지지 않음)
3. **사진 있을 때 / 없을 때 모두 동작** (placeholder 처리)
4. **MHJ 브랜드 톤 유지** (웜 크림, 골드 악센트, Playfair Display)
5. **html-to-image 캡처 시 결과 동일** (웹폰트 로딩 보장)

## 레이아웃 구현 목록

### 커버 (5종)

#### cover-arch
- 중앙에 아치(rounded-top) 프레임으로 사진 클리핑
- 아래에 Playfair Display 세리프 제목
- 상단에 카테고리 라벨 (uppercase, tracking 넓게)
- 하단에 스퀴글(squiggle) SVG 장식
- `clip-path: ellipse()` 또는 `border-radius: 50% 50% 0 0`으로 아치 구현

#### cover-full-image
- 전면 배경 사진
- 하단에서 올라오는 검정 그라디언트 (`linear-gradient(to top, rgba(0,0,0,0.9), transparent)`)
- 그라디언트 위에 흰색 제목 + 골드 카테고리 라벨
- 시네마틱 무드

#### cover-split
- 상단 55% 사진, 하단 45% 다크 배경
- 하단에 제목 + 카테고리
- 사진과 텍스트 영역의 대비

#### cover-minimal
- 사진 없음. 순수 타이포그래피
- 배경에 은은한 원형 블러 장식 (`filter: blur(60px)`, 골드+세이지 반투명)
- Playfair Display 60px+ 제목
- 골드 디바이더 라인

#### cover-polaroid
- 기울어진(-3deg) 폴라로이드 프레임 안에 사진
- 프레임 아래 여백에 손글씨 느낌 텍스트
- 배경은 sandstone 톤

### 콘텐츠 (8종)

#### content-editorial
- 매거진 드롭캡 (첫 글자 5rem, Playfair, 골드)
- 본문은 Inter 15px, line-height 2.1
- 상단에 제목 + 하단 구분선
- 배경에 은은한 리프(Leaf) SVG 장식 (opacity 0.07)

#### content-step
- 좌상단에 거대한 반투명 번호 (Playfair 80px, 골드, opacity 0.2)
- 그 위에 제목 (Playfair 30px)
- 본문 텍스트
- 우하단에 원형 사진 (`border-radius: 50%`, 6px 보더)
- 진행 화살표 아이콘

#### content-split
- 상단 55% 사진 (상단 모서리 둥글게 `border-radius: 2.5rem 2.5rem 0 0`)
- 하단 45% 텍스트 (스텝 번호 + 제목 + 본문)

#### content-quote
- 중앙 정렬
- 거대한 장식 따옴표 ("", Playfair 120px, 골드, opacity 0.15)
- 제목을 인용문 스타일로 (italic, Playfair 26px)
- 본문은 간결하게

#### content-bold-number
- 다크 배경 (teal 또는 burgundy)
- 좌상단에 거대 번호 (8rem, 골드/앰버, bold)
- 흰색 제목 + 본문
- 우하단에 기하학적 원 장식 (SVG)

#### content-photo-overlay
- 전면 배경 사진 (어둡게)
- 하단에 글래스모피즘 카드 (`backdrop-filter: blur(20px)`, 반투명 흰색)
- 카드 안에 팁 번호 배지 + 제목 + 본문
- `border-radius: 2rem`

#### content-abstract
- 배경에 3개 원형 도형 겹침 (peach, sage, softBlue)
- `mix-blend-mode: multiply`
- 중앙에 기울어진 폴라로이드 사진
- 아래에 제목 + 이탤릭 본문

#### content-list
- 제목 상단 (Playfair)
- 본문을 문장 단위로 분리 → 구분선(`<hr>`)으로 나열
- 메뉴/목록 스타일
- 상단 레이블 "WHAT TO KNOW" (uppercase, 골드)

### 특수 (4종)

#### summary-checklist
- 다크 브라운 배경 (#4A3C31)
- ✓ 체크마크 + 4줄 요약 (흰색)
- 하단에 한국어 요약 (작은 글씨, 골드)
- 제목 "Key Takeaways"

#### yussi-take
- 세이지 그린 배경 (#8A9A86)
- Yussi 프로필 영역 (이름 + "Social Work Student & Mum of 3")
- 이탤릭 인용 스타일로 Yussi 코멘트
- 하단에 한국어 원문

#### visual-break
- 전면 사진
- 중앙에 인용문 (흰색, 그림자)
- 또는 중앙 원형 프레임 안에 사진 + 주변 라인아트

#### cta-minimal
- 다크 배경 (#1A1A1A)
- MHJ 로고 (Playfair "MHJ" + "my mairangi")
- 골드 디바이더
- CTA 텍스트 + URL + @mhj_nz
- 하단에 저장/공유 아이콘 행

### 추가 (3종)

#### content-continuous-line
- 배경에 SVG 곡선 2개 (골드, opacity 0.4~0.6)
- 중앙 원형 사진 (골드 보더)
- 아래 제목

#### content-arch-photo
- 아치형 클리핑으로 사진 표시
- 옆에 제목 + 본문
- 골드 라인 장식

#### cover-dark
- 검정 배경
- 골드 악센트 텍스트
- 미니멀 시네마틱

## 레이아웃 선택 모달 (`LayoutLibrary.tsx`)

- 2열 그리드로 20+ 템플릿 표시
- 각 항목: 아이콘 + 이름 + 설명 (1줄)
- 현재 선택 하이라이트
- 클릭 → 해당 슬라이드의 layout 변경 → 실시간 미리보기 반영

## 검증 (Antigravity + Playwright 필수)

```
1. 모든 20+ 레이아웃을 순회하며 스크린샷 비교
2. 텍스트 길이 극단값 테스트 (3단어 제목 / 30단어 제목)
3. 사진 있는 버전 / 없는 버전 각각 확인
4. html-to-image export 결과 vs 미리보기 일치 확인
5. 모바일 Admin (375px) 레이아웃 확인
```

---

# 세션 3 지시서: Gemini AI 자동 배치 + UX 폴리싱

## 반드시 먼저 읽을 파일

```
docs/DESIGN_RULES.md
docs/ARCHITECTURE.md
app/api/ai-insight/route.ts           ← 기존 Gemini 연동 패턴 참고
components/carousel/v2/tokens.ts
components/carousel/v2/SlideRenderer.tsx
components/carousel/utils.ts           ← 기존 캡션 생성 로직
```

## 모델: Sonnet

## 작업 목록

### 3-1. Gemini 레이아웃 추천 API

`app/api/carousel/ai-layout/route.ts`:

```typescript
// POST body: { text: string } 또는 { blogId: number }
// 응답: { slides: SlideConfig[] }
//
// Gemini에게 보내는 프롬프트:
// "다음 블로그 글을 Instagram 캐러셀 10장으로 분해하세요.
//  각 슬라이드에 대해:
//  1. 가장 적합한 layout 타입 (cover-arch, content-step, ...)
//  2. title, subtitle, body 텍스트
//  3. stepNumber (해당 시)
//  규칙:
//  - 슬라이드 1은 반드시 cover-* 중 하나
//  - 슬라이드 10은 반드시 cta-minimal
//  - 슬라이드 8-9 중 하나는 summary-checklist
//  - 같은 layout을 연속 사용하지 않을 것
//  - title은 8단어 이내 훅
//  JSON으로만 응답하세요."
```

환경변수: 기존 `GOOGLE_AI_API_KEY` 사용 (AI Insight와 동일)

### 3-2. 3가지 입력 모드

Admin UI에 탭 3개:

| 탭 | 동작 |
|----|------|
| **Blog** | 블로그 선택 → carousel_* 데이터 로드 (기존 v1과 동일) |
| **AI Generate** | 텍스트/URL 입력 → Gemini API → 10장 자동 생성 |
| **Manual** | 빈 슬라이드 10장 → 수동 편집 |

### 3-3. 슬라이드별 편집 패널

각 슬라이드에 편집 컨트롤:

- **레이아웃 교체** 버튼 → LayoutLibrary 모달
- **텍스트 편집** 버튼 → 인라인 편집 오버레이 (제목, 부제, 본문)
- **사진 업로드** 버튼 → file input → blob URL → customImage
- **배경색 선택** → 프리셋 6개 (warm/sand/dark/sage/teal/burgundy) + 커스텀 컬러피커
- **삭제/복제** 버튼

### 3-4. 자동 슬라이드 번호 관리

- MHJ 브랜드 footer: 매 슬라이드 하단에 "MHJ" + "01 / 10" 자동 표시
- 슬라이드 추가/삭제 시 번호 자동 재계산

### 3-5. 캡션 자동 생성 개선

기존 `generateCaption` 로직 유지하되:
- Gemini가 생성한 highlight 반영
- 한국어/중국어 라인 자동 삽입
- 해시태그 프리셋 자동 선택

### 3-6. 사진 관리

- Supabase Storage `carousel` 버킷에 업로드
- 업로드된 이미지 URL을 `SlideConfig.imageUrl`에 저장
- 블로그의 `image_url`도 자동으로 커버에 사용

### 3-7. UX 폴리싱

- 슬라이드 순서 드래그 앤 드롭 (선택사항, 시간 되면)
- Export 진행률 표시 (1/10, 2/10...)
- 토스트 메시지 개선
- 키보드 단축키 (← → 슬라이드 이동)
- Admin 사이드바 아이콘 업데이트

### 3-8. 검증

```bash
npm run build
# 1) AI Generate 탭 → 텍스트 입력 → 10장 자동 생성 확인
# 2) 슬라이드별 레이아웃 교체 → 실시간 미리보기 반영
# 3) 사진 업로드 → 해당 슬라이드에 표시
# 4) Download ZIP → 10장 PNG 품질 확인
# 5) Yussi Factory JSON paste → 동작 확인
# 6) Save to Blog / Save as Independent → DB 저장 확인
```

---

## 세션 실행 순서 및 예상 시간

| 세션 | 내용 | 모델 | 예상 | 선행 조건 |
|------|------|------|------|----------|
| **1** | 렌더링 엔진 교체 + 기반 | Opus | 30~45분 | 없음 |
| **2** | 20+ 레이아웃 구현 | Opus | 60~90분 | 세션 1 완료 + Antigravity 준비 |
| **3** | Gemini AI + UX | Sonnet | 30~45분 | 세션 2 완료 |

**총 예상: 2~3시간 (세션 간 QA 포함)**

---

## 주의사항

1. **1 conversation = 1 session** — Claude Code에서 세션별로 새 대화 시작
2. **세션 2는 반드시 Antigravity + Playwright QA** — 텍스트 프롬프트만으로 디자인 퀄리티 검증 불가
3. **폰트 로딩 보장** — html-to-image 캡처 전에 `document.fonts.ready` 대기 필수
4. **기존 기능 유지** — BlogSelector, CaptionPanel, HashtagManager, RecentList는 리팩토링만 (삭제 금지)
5. **`npm run build` 매 세션 끝에 반드시 통과**
6. **Supabase 스키마 변경 없음** — 기존 `carousel_*` 컬럼 그대로 사용
7. **OG 이미지(`/api/og`)는 Satori 유지** — 건드리지 않음

---

*이 문서는 Claude Code 세션 시작 전에 `docs/` 폴더에 넣으세요.*
*각 세션 시작 시 "docs/CAROUSEL_V2_MASTER_PLAN.md 읽고 세션 N 실행해줘" 입력.*
