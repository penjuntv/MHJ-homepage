# MHJ HOMEPAGE — ARCHITECTURE

> Next.js 14 App Router 기반 컴포넌트 아키텍처 및 라우팅 설계

---

## 1. 라우팅 구조

### 파일 기반 라우팅 매핑

| REFERENCE 내 page state | Next.js 경로 | 파일 |
|--------------------------|-------------|------|
| `'landing'` | `/` | `app/page.tsx` |
| `'about'` | `/about` | `app/about/page.tsx` |
| `'magazine_shelf'` | `/magazine` | `app/magazine/page.tsx` |
| `'magazine_issue'` + selectedMonth | `/magazine/[id]` | `app/magazine/[id]/page.tsx` |
| `'blog'` | `/blog` | `app/blog/page.tsx` |
| 상세 모달 (selectedItem) | URL 변경 없음 — 클라이언트 상태 모달 | `components/DetailModal.tsx` |
| — | `/admin` | `app/admin/page.tsx` |
| — | `/admin/login` | `app/admin/login/page.tsx` |
| — | `/admin/blogs/...` | `app/admin/blogs/` |
| — | `/admin/magazines/...` | `app/admin/magazines/` |

### 레이아웃 공유 구조

```
app/
├── layout.tsx          ← 루트 레이아웃 (Google Fonts, globals.css, <html lang="ko">)
├── (public)/           ← 그룹 라우트 (Navigation + Footer 공유)
│   ├── layout.tsx      ← Navigation + Footer 포함
│   ├── page.tsx        ← Landing
│   ├── about/page.tsx
│   ├── magazine/
│   │   ├── page.tsx    ← Shelf
│   │   └── [id]/page.tsx ← Issue
│   └── blog/
│       └── page.tsx    ← Library
├── admin/              ← 별도 레이아웃 (Navigation/Footer 없음)
│   ├── layout.tsx      ← Admin 전용 레이아웃
│   ├── page.tsx
│   ├── login/page.tsx
│   ├── blogs/
│   └── magazines/
├── api/
│   └── ai-insight/route.ts
├── sitemap.ts
└── robots.ts
```

---

## 2. 서버 vs 클라이언트 컴포넌트 판단

### 서버 컴포넌트 (기본값)
| 컴포넌트/페이지 | 이유 |
|----------------|------|
| `app/(public)/layout.tsx` | 정적 레이아웃 셸 |
| `app/(public)/page.tsx` | 초기 데이터 fetch (blogs) |
| `app/(public)/about/page.tsx` | 초기 데이터 fetch (family_members) |
| `app/(public)/magazine/page.tsx` | 초기 데이터 fetch (magazines) |
| `app/(public)/magazine/[id]/page.tsx` | 초기 데이터 fetch (magazine + articles) |
| `app/(public)/blog/page.tsx` | 초기 데이터 fetch (blogs) |
| `app/api/ai-insight/route.ts` | API Route (서버 전용) |

### 클라이언트 컴포넌트 ('use client')
| 컴포넌트 | 이유 |
|---------|------|
| `Navigation.tsx` | useState (mobileOpen), onClick 핸들러 |
| `HeroCarousel.tsx` | useState (idx), useEffect (setInterval), onClick |
| `MagazineShelf.tsx` | useRef (scrollRef), useState (hovered), useEffect (wheel listener), onMouseEnter |
| `BlogLibrary.tsx` | useState (activeCategory), onClick (필터) |
| `DetailModal.tsx` | useState (aiInsight, loading), fetch (AI API), onClick |
| `AiInsight.tsx` | useState, fetch |
| `ArticleCard.tsx` | onMouseEnter/Leave (hover 효과) |
| `BlogCard.tsx` | onMouseEnter/Leave (hover 효과) |

### 하이브리드 패턴
- **페이지 (서버)** → Supabase에서 데이터 fetch → **클라이언트 컴포넌트**에 props로 전달
- 예: `magazine/page.tsx` (서버)에서 magazines 데이터 fetch → `<MagazineShelf magazines={data} />` (클라이언트)

---

## 3. 컴포넌트 아키텍처

### 3.1 Navigation (`components/Navigation.tsx`)

```typescript
'use client';

interface NavigationProps {
  // Next.js에서는 usePathname()으로 현재 경로 감지 — props 불필요
}

// 상태: mobileOpen (boolean)
// 동작: Link 컴포넌트로 라우팅, 모바일 풀스크린 메뉴 토글
// 반응형: 768px 브레이크포인트 — 데스크톱 메뉴 / 모바일 햄버거
// 스타일: fixed top, z-100, blur 배경, 1px 하단 보더
```

**주요 구현 포인트:**
- `usePathname()`으로 현재 페이지 하이라이트
- Magazine 경로 (`/magazine`와 `/magazine/[id]` 모두) 하이라이트
- `next/link`의 `Link` 컴포넌트 사용
- 모바일 메뉴 열 때 `body overflow: hidden` 처리

### 3.2 Footer (`components/Footer.tsx`)

```typescript
// 서버 컴포넌트 가능 (onClick은 Link로 대체)
interface FooterProps {}

// 3컬럼 그리드: 브랜드 + Explore 링크 + Contact
// 하단: 저작권 + 아카이브 라벨
// 배경: #000, 텍스트: white 계열 투명도
```

### 3.3 HeroCarousel (`components/HeroCarousel.tsx`)

```typescript
'use client';

interface HeroCarouselProps {
  items: Blog[];  // 최근 블로그 5개
  onItemClick: (item: Blog) => void;
}

// 상태: idx (number) — 현재 슬라이드 인덱스
// useEffect: 6초 자동재생 setInterval
// 동작: prev/next 버튼, 인디케이터 도트, 아이템 클릭 시 모달
// 높이: 85vh
// 전환: opacity 1s ease
```

**핵심 구현:**
- `useEffect`로 6초 `setInterval` (cleanup 필수)
- 이전/다음 버튼: `(idx - 1 + length) % length`, `(idx + 1) % length`
- 인디케이터: active는 width 48px, inactive는 32px
- 이미지: `filter: saturate(1.5)`

### 3.4 MagazineShelf (`components/MagazineShelf.tsx`) ⭐ 핵심

```typescript
'use client';

interface MagazineShelfProps {
  magazines: Magazine[];
}

// 상태: hovered (number) — 현재 호버된 아이템 인덱스
// useRef: scrollRef — 가로 스크롤 컨테이너
// useEffect: wheel 이벤트 리스너 (deltaY → scrollLeft)
// 동작: hover 시 width 확장, 클릭 시 /magazine/[id]로 라우팅
```

**핵심 구현:**
- `useCallback`으로 wheel 핸들러 메모이제이션
- `{ passive: false }` 옵션으로 `preventDefault()` 가능하게
- width 전환: `transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1)`
- Spine과 Cover 크로스페이드: opacity + transform 전환
- Cover에 `transition-delay: 0.15s` (나타날 때)
- `next/navigation`의 `useRouter()`로 클릭 시 라우팅
- 끝에 `8vw` 빈 공간 (패딩 역할)

### 3.5 BlogLibrary (`components/BlogLibrary.tsx`)

```typescript
'use client';

interface BlogLibraryProps {
  blogs: Blog[];
  onItemClick: (item: Blog) => void;
}

// 상태: activeCategory (string) — 'All' | 'Daily' | 'School' | 'Kids' | 'Travel' | 'Food'
// 필터: activeCategory === 'All' ? 전체 : category 일치
// 그리드: auto-fill, minmax(min(320px, 100%), 1fr)
```

### 3.6 ArticleGrid (`components/ArticleGrid.tsx`)

```typescript
'use client';

interface ArticleGridProps {
  articles: Article[];
  onItemClick: (item: Article) => void;
}

// 그리드: auto-fill, minmax(min(300px, 100%), 1fr)
// 카드: 3:4 이미지 + 날짜/저자 + 제목
// hover: translateY(-16px) + shadow 강화
```

### 3.7 DetailModal (`components/DetailModal.tsx`) ⭐

```typescript
'use client';

interface DetailModalProps {
  item: Article | Blog | null;
  onClose: () => void;
}

// 상태: aiInsight (string), loading (boolean)
// 동작: AI Insight 버튼 클릭 → /api/ai-insight 호출
// 레이아웃: 오른쪽 슬라이드인, max-width 900px
// 애니메이션: 백드롭 fade-in + 패널 slide-right
```

**핵심 구현:**
- 백드롭 클릭 시 닫기
- ESC 키로 닫기 (useEffect + keydown)
- body scroll 잠금 (모달 열릴 때)
- AI Insight: `/api/ai-insight` POST → 응답 표시
- 드롭캡: 첫 글자 분리 렌더링
- 21:9 하단 이미지

### 3.8 AiInsight (`components/AiInsight.tsx`)

```typescript
'use client';

interface AiInsightProps {
  title: string;
  content: string;
}

// 상태: insight (string), loading (boolean)
// 버튼 클릭 → fetch('/api/ai-insight', { method: 'POST', body: { title, content } })
// 결과: zoom-in 애니메이션으로 표시
```

### 3.9 BlogCard / ArticleCard

```typescript
'use client';

interface BlogCardProps {
  blog: Blog;
  onClick: () => void;
  staggerIndex: number;  // 1~4
}

interface ArticleCardProps {
  article: Article;
  onClick: () => void;
  staggerIndex: number;
}

// onMouseEnter/Leave로 hover 효과 (translateY, boxShadow)
// 또는 Tailwind group hover로 처리
```

---

## 4. 데이터 흐름

### Supabase 클라이언트 설정

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// 서버 컴포넌트용 (SSR)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 관리자용 (서버 사이드, service_role key)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### 페이지별 데이터 fetch

| 페이지 | 테이블 | 쿼리 |
|--------|--------|------|
| Landing `/` | blogs | `SELECT * FROM blogs WHERE published = true ORDER BY created_at DESC LIMIT 5` (히어로) + 전체 (Intro) |
| About `/about` | family_members | `SELECT * FROM family_members ORDER BY sort_order` |
| Magazine Shelf `/magazine` | magazines | `SELECT * FROM magazines ORDER BY created_at DESC` |
| Magazine Issue `/magazine/[id]` | magazines + articles | `SELECT * FROM magazines WHERE id = $1` + `SELECT * FROM articles WHERE magazine_id = $1` |
| Blog `/blog` | blogs | `SELECT * FROM blogs WHERE published = true ORDER BY created_at DESC` |

### AI Insight API Route

```typescript
// app/api/ai-insight/route.ts
// POST { title: string, content: string }
// → Claude API 호출 (process.env.ANTHROPIC_API_KEY — 서버 전용!)
// → { insight: string }
```

---

## 5. 타입 정의

```typescript
// lib/types.ts

export interface Magazine {
  id: string;            // '2026-03'
  year: string;
  month_name: string;    // 'Mar'
  title: string;
  editor: string;
  image_url: string;
  created_at?: string;
}

export interface Article {
  id: number;
  magazine_id: string;   // FK → magazines.id
  title: string;
  author: string;
  date: string;          // '2026.03.02'
  image_url: string;
  content: string;
  created_at?: string;
}

export interface Blog {
  id: number;
  category: 'Daily' | 'School' | 'Kids' | 'Travel' | 'Food';
  title: string;
  author: string;        // default 'Heejong Jo'
  date: string;
  image_url: string;
  content: string;
  slug: string;
  meta_description?: string;
  og_image_url?: string;
  published: boolean;
  created_at?: string;
}

export interface FamilyMember {
  id: number;
  name: string;
  role: string;
  bio: string;
  image_url: string;
  sort_order: number;
}

// 모달용 통합 타입
export type DetailItem = (Article | Blog) & {
  category?: string;  // Blog에만 있음
};
```

---

## 6. SEO 메타데이터

### 페이지별 메타데이터

```typescript
// app/(public)/page.tsx
export const metadata: Metadata = {
  title: 'MY MAIRANGI — Family Archive',
  description: '뉴질랜드 오클랜드 노스쇼어에서의 특별한 나날들',
  openGraph: { ... },
};

// app/(public)/about/page.tsx
export const metadata: Metadata = {
  title: 'About — MY MAIRANGI',
  description: '기자 출신의 아빠와 석사 과정의 엄마, 세 딸의 이야기',
};

// app/(public)/magazine/page.tsx
export const metadata: Metadata = {
  title: 'Magazine — MY MAIRANGI',
  description: '마이랑이 가족의 월간 매거진 아카이브',
};

// app/(public)/magazine/[id]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const magazine = await fetchMagazine(params.id);
  return {
    title: `${magazine.title} — MY MAIRANGI Magazine`,
    description: `${magazine.year} ${magazine.month_name} Edition`,
  };
}

// app/(public)/blog/page.tsx
export const metadata: Metadata = {
  title: 'Blog Library — MY MAIRANGI',
  description: '사회복지사 석사 과정과 일상을 기록하는 개인 서재',
};
```

### 기타 SEO
- `app/sitemap.ts`: 정적 페이지 + 동적 매거진/블로그 URL
- `app/robots.ts`: `/admin` 차단
- `app/layout.tsx`: `<html lang="ko">`, JSON-LD (WebSite, Organization)
- 블로그 상세: BlogPosting JSON-LD (향후 `/blog/[slug]` 페이지 추가 시)

---

## 7. 환경변수

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  (서버 전용)
ANTHROPIC_API_KEY=sk-ant-...      (서버 전용, API Route에서만 사용)
```

## 8. 포트 설정

개발 서버와 프로덕션 서버 모두 **포트 3003** 고정.

```json
// package.json scripts
"dev": "next dev -p 3003",
"start": "next start -p 3003"
```

- `npm run dev` → http://localhost:3003
- `-p 3003` 옵션으로 포트 고정 (기본 3000 대신)

---

## 8. 모달 상태 관리 전략

REFERENCE_DESIGN.jsx에서 모달은 `selectedItem` 상태로 관리됨. Next.js에서도 동일하게 **클라이언트 상태**로 처리:

```
방법 1: 각 페이지 컴포넌트에서 useState로 selectedItem 관리
방법 2: React Context (ModalProvider)로 전역 관리
방법 3: URL search params (?detail=123) — SEO에 유리하지만 복잡도 증가

→ 권장: 방법 1 (단순함 우선). 필요 시 방법 2로 전환.
```

### 모달이 필요한 페이지
- Landing (히어로 캐러셀 아이템 클릭)
- Magazine Issue (아티클 카드 클릭)
- Blog Library (블로그 카드 클릭)

→ 각 페이지의 클라이언트 래퍼에서 `selectedItem` 상태 + `DetailModal` 렌더링

---

## 9. 관리자 페이지 구조 (간략)

```
/admin
├── layout.tsx        ← Supabase Auth 세션 체크, 리디렉트
├── page.tsx          ← 대시보드 (통계 카드)
├── login/page.tsx    ← 이메일/비밀번호 로그인
├── blogs/
│   ├── page.tsx      ← 블로그 목록 (검색, 필터, published 토글)
│   ├── new/page.tsx  ← 블로그 작성 (TipTap 에디터)
│   └── [id]/edit/page.tsx ← 블로그 수정
└── magazines/
    ├── page.tsx      ← 매거진 목록
    ├── new/page.tsx  ← 매거진 이슈 생성
    └── [id]/
        ├── page.tsx  ← 아티클 목록
        └── articles/
            ├── new/page.tsx
            └── [articleId]/edit/page.tsx
```
