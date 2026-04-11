# CAROUSEL_ADMIN.md — Claude Code 세션 2 지시서
# 인스타그램 캐러셀 Admin 관리 페이지

> **이 파일을 읽고 그대로 실행하세요.**
> Plan Mode에서 계획을 세우고, 승인 후 실행하세요.
> **세션 1(CAROUSEL_BUILD.md)이 완료된 후에 실행하세요.**

---

## 작업 목표

`/mhj-desk/carousel` Admin 페이지를 만든다. 블로그 글을 선택하거나 독립 캐러셀을 작성하고, 10장 슬라이드를 미리보고 편집하고, PNG/ZIP으로 다운로드하고, 캡션+해시태그를 복사할 수 있는 올인원 관리 페이지.

---

## 반드시 먼저 읽을 파일

```
docs/DESIGN_RULES.md          ← 색상, 폰트, radius 규칙
docs/ARCHITECTURE.md           ← 라우팅 + 컴포넌트 구조
src/app/mhj-desk/layout.tsx    ← 기존 Admin 레이아웃 (재사용)
src/app/mhj-desk/blogs/        ← 기존 Admin 블로그 관리 (패턴 참고)
src/components/carousel/        ← 세션 1에서 만든 tokens, types, utils, slides
src/app/api/carousel/           ← 세션 1에서 만든 API routes
```

---

## 세션 1에서 이미 만들어진 것 (전제 조건)

### API Routes
- `POST /api/carousel/generate` → 10장 PNG base64 반환
- `GET /api/carousel/download` → ZIP 또는 개별 PNG 다운로드
- `POST /api/carousel/caption` → 캡션 + 해시태그 반환

### 컴포넌트/타입
- `src/components/carousel/types.ts` → CarouselInput, CarouselSlide, CarouselOutput
- `src/components/carousel/tokens.ts` → carouselTokens (색상, 폰트, 스타일)
- `src/components/carousel/utils.ts` → blogCategoryToHashtagCategory, generateCaption, buildCarouselInputFromBlog

### DB 테이블 (이미 존재)
- `blogs` 테이블: carousel_enabled, carousel_title, carousel_subtitle, carousel_points(JSONB), carousel_summary(TEXT[]), carousel_summary_kr(TEXT[]), carousel_yussi_take, carousel_yussi_take_kr, carousel_cta, carousel_style, carousel_generated_at
- `instagram_content` 테이블: id, content_type, title, data(JSONB), caption_en, caption_kr, caption_zh, hashtags, blog_id, style, status, scheduled_for, posted_at, performance, created_at, updated_at
- `hashtag_presets` 테이블: id, category, hashtags, is_default
- Storage 버킷: `carousel` (public, PNG/JPEG/ZIP)

### 블로그 카테고리 → 해시태그 매핑
```
'Home Learning'     → 'education'
'Life in Aotearoa'  → 'local'
'Little 15 Mins'    → 'storypress'
'Local Guide'       → 'local'
'Settlement'        → 'settlement'
'Whānau'            → 'parenting'
'Travelers'         → 'travel'
```

---

## 구현할 것

### 파일 구조

```
src/app/mhj-desk/carousel/
  page.tsx                         ← 메인 페이지
  components/
    BlogSelector.tsx               ← 블로그 글 선택 드롭다운
    CarouselEditor.tsx             ← 편집 폼 (CarouselInput 전 필드)
    CarouselPreview.tsx            ← 10장 슬라이드 미리보기 (좌우 네비)
    CarouselDownloader.tsx         ← 다운로드 버튼들
    CaptionPanel.tsx               ← 캡션 미리보기 + 복사 버튼
    StyleSelector.tsx              ← 캐러셀 스타일 선택 (default/editorial/dark/photo/quote)
    HashtagManager.tsx             ← 해시태그 프리셋 선택 + 수동 편집
```

---

### 1. 메인 페이지 (`page.tsx`)

**경로**: `/mhj-desk/carousel`

**인증**: 기존 `/mhj-desk` 레이아웃의 인증 시스템 그대로 사용. middleware.ts가 이미 처리함.

**레이아웃**:
```
┌──────────────────────────────────────────────────────────┐
│  MHJ Desk > Carousel Generator                           │
├─────────────────────────┬────────────────────────────────┤
│                         │                                │
│  [소스 선택 영역]         │  [미리보기 영역]                │
│  BlogSelector           │  CarouselPreview               │
│  또는 "New Carousel"    │  ◀ 3/10 ▶                     │
│                         │  ● ● ● ○ ○ ○ ○ ○ ○ ○         │
│  ─────────────────      │                                │
│                         │  StyleSelector                 │
│  [편집 영역]             │                                │
│  CarouselEditor         │  ─────────────────────────     │
│  (스크롤 가능)           │                                │
│                         │  [캡션 영역]                    │
│                         │  CaptionPanel                  │
│                         │                                │
│                         │  [다운로드 영역]                 │
│                         │  CarouselDownloader            │
│                         │                                │
├─────────────────────────┴────────────────────────────────┤
│  [최근 캐러셀 목록]                                        │
│  instagram_content 테이블에서 최근 10개                     │
└──────────────────────────────────────────────────────────┘
```

**반응형**: 데스크탑은 좌우 2컬럼, 모바일(768px 미만)은 1컬럼 스택.

**상태 관리**: React useState로 관리. 전역 상태 라이브러리 불필요.

```typescript
const [mode, setMode] = useState<'blog' | 'independent'>('blog');
const [selectedBlogId, setSelectedBlogId] = useState<number | null>(null);
const [carouselInput, setCarouselInput] = useState<CarouselInput>(defaultInput);
const [generatedSlides, setGeneratedSlides] = useState<CarouselSlide[]>([]);
const [currentSlide, setCurrentSlide] = useState(0);
const [isGenerating, setIsGenerating] = useState(false);
const [caption, setCaption] = useState({ en: '', kr: '', hashtags: [] as string[] });
```

---

### 2. BlogSelector 컴포넌트

**역할**: published 블로그 글 목록에서 선택하거나, 독립 캐러셀 모드로 전환.

```typescript
interface BlogSelectorProps {
  onSelectBlog: (blogId: number, blogData: any) => void;
  onNewCarousel: () => void;
}
```

**동작**:
1. Supabase에서 `blogs` 테이블 조회: `published = true`, `created_at DESC`, 최근 20개
2. 드롭다운에 `title` 표시 + `category` 배지
3. 블로그 선택 시 → carousel_* 컬럼이 채워져 있으면 CarouselEditor에 로드
4. carousel_* 컬럼이 비어있으면 → 빈 폼 표시 (사용자가 직접 입력)
5. "New Independent Carousel" 버튼 → blog_id 없이 빈 폼

**Supabase 호출**:
```typescript
const { data: blogs } = await supabase
  .from('blogs')
  .select('id, title, slug, category, carousel_enabled, carousel_title, carousel_points')
  .eq('published', true)
  .order('created_at', { ascending: false })
  .limit(20);
```

---

### 3. CarouselEditor 컴포넌트

**역할**: CarouselInput의 모든 필드를 편집할 수 있는 폼.

```typescript
interface CarouselEditorProps {
  input: CarouselInput;
  onChange: (input: CarouselInput) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}
```

**폼 필드 (위에서 아래로)**:

| 그룹 | 필드 | 타입 | 필수 |
|------|------|------|------|
| **Cover** | Title (EN) | text input | ✅ |
| | Subtitle (EN) | text input | |
| | Title KR (한국어 부제) | text input | |
| | Cover Image URL | text input + 미리보기 | |
| **Points (1~4)** | Point title | text input | ✅ |
| | Point body | textarea (2~3줄) | ✅ |
| | Highlight EN | text input | ✅ |
| | Highlight KR | text input | |
| | Highlight ZH | text input | |
| **Visual** | Visual Image URL | text input + 미리보기 | |
| | Pull Quote | text input | |
| **Summary** | Summary lines (EN) ×4 | 4개 text input | |
| | Summary KR ×4 | 4개 text input | |
| **Yussi** | Yussi's Take (EN) | textarea | |
| | Yussi's Take KR | textarea | |
| **CTA** | CTA title | text input | |
| | CTA URL | text input | |

**포인트 편집**: 기본 4개 표시. 각 포인트는 접이식(collapsible) 카드로.

**Generate 버튼**: 폼 하단에 위치. 클릭 시 `/api/carousel/generate` 호출.

**Save to DB 버튼**: 
- blog 모드: blogs 테이블의 carousel_* 컬럼 업데이트
- independent 모드: instagram_content 테이블에 INSERT/UPDATE

```typescript
// blog 모드 저장
await supabase
  .from('blogs')
  .update({
    carousel_enabled: true,
    carousel_title: input.title,
    carousel_subtitle: input.subtitle,
    carousel_points: input.points,
    carousel_summary: input.summaryPoints,
    carousel_summary_kr: input.summaryKr,
    carousel_yussi_take: input.yussiTake,
    carousel_yussi_take_kr: input.yussiTakeKr,
    carousel_cta: input.ctaTitle,
    carousel_style: input.style,
  })
  .eq('id', blogId);

// independent 모드 저장
await supabase
  .from('instagram_content')
  .upsert({
    content_type: 'carousel',
    title: input.title,
    data: input,
    caption_en: caption.en,
    caption_kr: caption.kr,
    hashtags: caption.hashtags,
    blog_id: null,
    style: input.style,
    status: 'draft',
  });
```

---

### 4. CarouselPreview 컴포넌트

**역할**: 생성된 10장 슬라이드를 인스타그램 피드처럼 미리보기.

```typescript
interface CarouselPreviewProps {
  slides: CarouselSlide[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}
```

**구현**:
- base64 PNG를 `<img>` 태그로 표시
- 1080×1350 비율 유지하며 컨테이너에 맞게 축소 (max-width: 100%, aspect-ratio: 4/5)
- 좌우 화살표 버튼 (◀ ▶)
- 하단 dot indicator (● ● ● ○ ○ ○ ○ ○ ○ ○)
- 현재 슬라이드 번호 + 타입 표시: "3/10 — Content"
- 키보드: 좌우 화살표 키로 네비게이션
- 슬라이드 미생성 시: "Generate를 눌러 미리보기를 생성하세요" placeholder

**디자인**:
- 미리보기 영역 배경: 연한 체크무늬 (투명 배경 표시용) 또는 #F8FAFC
- 미리보기 프레임: border 1px #EDE9E3, border-radius 8px
- 화살표: 반투명 원형 버튼, hover 시 불투명

---

### 5. CaptionPanel 컴포넌트

**역할**: 자동 생성된 캡션과 해시태그를 미리보고 복사.

```typescript
interface CaptionPanelProps {
  caption: { en: string; kr: string; hashtags: string[] };
  onCaptionChange: (caption: { en: string; kr: string; hashtags: string[] }) => void;
}
```

**구현**:
- 캡션 텍스트 표시 (편집 가능한 textarea)
- "Copy Caption" 버튼 → `navigator.clipboard.writeText(fullCaption)`
  - fullCaption = caption.en + '\n\n' + '🇰🇷 ' + caption.kr + '\n\n' + hashtags.join(' ')
- "Copy Hashtags Only" 버튼 → 해시태그만 복사
- 복사 성공 시 버튼 텍스트 "Copied!" 2초간 표시
- 해시태그 편집: HashtagManager 컴포넌트 연동

---

### 6. CarouselDownloader 컴포넌트

**역할**: 생성된 이미지 다운로드.

```typescript
interface CarouselDownloaderProps {
  blogId?: number;
  contentId?: number;
  slides: CarouselSlide[];
  hasSlides: boolean;
}
```

**구현**:
- "Download All (ZIP)" 버튼 → `/api/carousel/download?blogId=X&format=zip` fetch → blob → download
- "Download Current Slide" 버튼 → 현재 보고 있는 슬라이드 개별 다운로드
- 다운로드 중 로딩 스피너
- 슬라이드 미생성 시 버튼 비활성화

**파일명 규칙**:
- ZIP: `mhj-carousel-{slug or id}-{date}.zip`
- 개별: `mhj-carousel-{slug}-slide-{N}.png`

---

### 7. StyleSelector 컴포넌트

**역할**: 캐러셀 디자인 스타일 선택.

5개 스타일을 시각적 프리뷰 카드로 표시:

| 스타일 | 배경 | 텍스트 | 용도 |
|--------|------|--------|------|
| default | #FAF8F5 크림 | #1A1A1A | 일반 인사이트 |
| editorial | #FFFFFF 화이트 + 테두리 | #1A1A1A | 깊이 있는 칼럼 |
| dark | #1E1E1E 다크 | #F8FAFC | 강조/임팩트 |
| photo | 사진 위 오버레이 | #FFFFFF | 풍경/감성 |
| quote | #8A6B4F 브랜드색 | #FFFFFF | 인용/명언 |

각 스타일을 40×50px 미니 카드로 표시, 선택 시 border 강조.

---

### 8. HashtagManager 컴포넌트

**역할**: 카테고리별 해시태그 프리셋 선택 + 수동 추가/제거.

```typescript
interface HashtagManagerProps {
  category: string;
  selectedHashtags: string[];
  onChange: (hashtags: string[]) => void;
}
```

**구현**:
1. Supabase에서 `hashtag_presets` 조회 → 카테고리 드롭다운
2. 카테고리 선택 → 프리셋 해시태그 자동 로드
3. 개별 해시태그 태그 UI (클릭하여 제거)
4. 수동 입력 필드 (# 붙여서 추가)
5. `#MHJnz`는 항상 포함 (제거 불가)

---

### 9. 최근 캐러셀 목록

메인 페이지 하단에 `instagram_content` 테이블에서 최근 10개 표시.

```typescript
const { data: recentCarousels } = await supabase
  .from('instagram_content')
  .select('id, title, status, scheduled_for, created_at, blog_id')
  .eq('content_type', 'carousel')
  .order('created_at', { ascending: false })
  .limit(10);
```

**표시 정보**: 제목, 상태 배지(draft/ready/posted), 날짜, 블로그 연동 여부

**클릭**: 해당 캐러셀 데이터를 편집 폼에 로드

---

## Admin 사이드바 메뉴 추가

기존 `/mhj-desk` 사이드바/네비게이션에 "Carousel" 메뉴 항목 추가.

**기존 메뉴 구조 파악 후** 동일한 패턴으로 추가:
- 아이콘: 사각형 겹침 아이콘 (lucide-react의 `LayoutGrid` 또는 `Images`)
- 텍스트: "Carousel"
- 경로: `/mhj-desk/carousel`
- 위치: "Newsletter" 아래 또는 "Comments" 위

**주의**: 기존 사이드바 컴포넌트의 파일 위치를 먼저 확인하고 수정할 것. 임의로 새 사이드바를 만들지 말 것.

---

## 디자인 가이드라인

### Admin UI 톤
- 기존 `/mhj-desk` 스타일 그대로 유지
- 따뜻한 크림톤 배경 (#FAF8F5 또는 기존 Admin 배경)
- SaaS 감성 금지 (차가운 회색, 직각, 무거운 그림자 금지)
- 카드: border-radius 8~12px, border 1px #EDE9E3
- 버튼: MHJ 브랜드 색상 #8A6B4F (primary), #F8FAFC (secondary)
- 인디고(#4F46E5) 사용 금지

### 반응형
- 데스크탑 (1024px+): 좌우 2컬럼
- 태블릿 (768~1023px): 좌우 2컬럼 (좁게)
- 모바일 (768px 미만): 1컬럼 스택 (미리보기 → 편집 → 캡션 → 다운로드)

### 접근성
- 모든 버튼에 aria-label
- 키보드 네비게이션 (좌우 화살표로 슬라이드 이동)
- 복사 성공 피드백 (시각 + aria-live)

---

## 데이터 흐름

```
[사용자 행동]                      [시스템 동작]

1. 블로그 글 선택                  → blogs 테이블에서 carousel_* 로드
   (또는 "New Carousel")          → 빈 폼 표시

2. 폼 입력/편집                    → React state 업데이트 (실시간)

3. "Save" 클릭                    → blogs.carousel_* 업데이트
                                     또는 instagram_content INSERT

4. "Generate" 클릭                → POST /api/carousel/generate
                                  → 10장 PNG base64 수신
                                  → CarouselPreview에 표시
                                  → blogs.carousel_generated_at 업데이트

5. 캡션 자동 생성                  → POST /api/carousel/caption
                                  → CaptionPanel에 표시

6. "Copy Caption" 클릭            → navigator.clipboard.writeText()
                                  → "Copied!" 피드백

7. "Download ZIP" 클릭            → GET /api/carousel/download?format=zip
                                  → 브라우저 다운로드 트리거

8. 인스타에 게시 후                → 수동으로 status = 'posted' 변경
   "Mark as Posted" 클릭          → instagram_content.posted_at 업데이트
```

---

## Supabase 클라이언트

기존 프로젝트에서 사용하는 Supabase 클라이언트 방식을 그대로 따를 것.

확인할 파일:
- `src/lib/supabase.ts` 또는 `src/utils/supabase/` — 기존 클라이언트 설정
- 서버 컴포넌트용 vs 클라이언트 컴포넌트용 구분 확인

Admin 페이지는 `'use client'`로 클라이언트 컴포넌트일 가능성 높음. 기존 `/mhj-desk/blogs` 패턴 참고.

---

## 테스트 방법

1. `npm run build` 통과 확인
2. `localhost:3003/mhj-desk/carousel` 접근 → 페이지 로드 확인
3. 블로그 글 선택 → carousel_* 데이터 로드 확인
4. 폼 입력 → "Generate" 클릭 → 10장 슬라이드 미리보기 표시 확인
5. 슬라이드 네비게이션 (좌우 화살표 + dot indicator) 동작 확인
6. "Copy Caption" → 클립보드에 복사 확인
7. "Download All" → ZIP 파일 다운로드 + 10장 PNG 포함 확인
8. 모바일 화면(DevTools 375px)에서 레이아웃 깨짐 없는지 확인
9. "Save" → Supabase에 데이터 저장 확인 (blogs 또는 instagram_content)

---

## 제약사항

- **세션 1에서 만든 API/컴포넌트는 수정하지 않음** — 호출만 함
- **기존 Admin 페이지 수정 최소화** — 사이드바 메뉴 항목 추가만
- **runtime: 'nodejs'** (기존 Admin과 동일)
- **`npm run build` 반드시 통과** 후 commit
- 새 패키지가 필요하면 설치 허용 (예: 아이콘 등)
- Tailwind CSS 사용 (기존 프로젝트와 동일)
- lucide-react 아이콘 사용 (기존 프로젝트와 동일)
