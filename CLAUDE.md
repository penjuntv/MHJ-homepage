# MHJ HOMEPAGE — MY MAIRANGI JOURNAL

> ⚠️ **디자인 작업 전 반드시 [DESIGN_RULES.md](./DESIGN_RULES.md)를 먼저 읽을 것.**
> 이 문서는 모든 레이아웃, 색상, 간격, 호버 효과, 이미지 비율의 절대 규칙을 담고 있다.

## 프로젝트 개요

뉴질랜드 오클랜드 노스쇼어 마이랑이 베이에 사는 한국인 가족의 라이프 매거진 웹사이트.
아이를 가진 부모들에게 영감을 주는 **하이엔드 에디토리얼 매거진** 스타일의 사이트.
아이 대상이 아닌 **성인(부모) 대상**. 톤은 세련되고, 감성적이며, 지적인 느낌.

### 운영자
- **조상목 (PeNnY)**: 기자·매거진 편집장 출신. 코딩 비전문가. 바이브 코딩으로 개발.
- **유희종 (Heejong Jo)**: 매시대학교 사회복지학 석사 과정. 블로그 섹션 주 저자.
- **세 딸**: 조유민(2014, Year 6), 조유현(2016, Year 5), 조유진(2021, Year 1)

---

## 기술 스택

- **Framework**: Next.js 14+ (App Router)
- **Database/CMS**: Supabase (PostgreSQL + Storage + Auth)
- **Styling**: Tailwind CSS
- **Fonts**: Playfair Display (display/headings) + Noto Sans KR (body)
- **Deployment**: Vercel
- **AI**: Claude API (글 감상평 생성 기능)
- **Image**: Supabase Storage (업로드) + Next.js Image 컴포넌트 (최적화)

---

## 페이지 구조

### 1. Landing Page (`/`)
- 히어로 캐러셀: 최근 블로그 글 5개가 6초 간격 자동 슬라이드
- 이전/다음 버튼 + 인디케이터 도트
- 인트로 섹션: 좌측 대형 이미지 + 우측 텍스트 + About 링크 카드

### 2. About Page (`/about`)
- 비전 섹션: "START TO GLOW" 대형 타이포 + 가족 소개 텍스트 + 가족 사진
- 세 딸 프로필: 3컬럼 그리드, 흑백→컬러 호버 효과, 이름/역할/바이오

### 3. Magazine Shelf (`/magazine`)
- **핵심 UI**: 좌우 스크롤 서가 (가로 스크롤)
- 기본 상태: 좁은 책등(100-120px) — 연도, 월, 세로 제목 표시
- 호버 상태: 해당 매거진만 넓게 확장(320-520px) — 커버 이미지 + 제목 + "Open Edition" 버튼
- CSS transition: `width 0.8s cubic-bezier(0.16, 1, 0.3, 1)`
- 마우스 휠 → 가로 스크롤 변환 (`deltaY → scrollLeft`)

### 4. Magazine Issue (`/magazine/[id]`)
- 해당 월의 아티클 목록 (3컬럼 그리드)
- 각 아티클: 3:4 비율 이미지 + 날짜/저자 + 제목
- 호버 시 카드 상승 효과 (-16px translateY)
- 클릭 시 상세 모달 오픈

### 5. Blog Library (`/blog`)
- 카테고리 필터: All / Daily / School / Kids / Travel / Food
- 블로그 카드: 정사각형 비율, 그라디언트 오버레이, 날짜+카테고리+제목
- 호버 시 카드 상승 + 그림자 강화

### 6. 글 상세 (슬라이드 모달)
- 오른쪽에서 슬라이드인하는 풀하이트 패널 (max-width: 900px)
- 대형 제목 (clamp 40px-120px)
- 첫 글자 드롭캡 효과
- AI Insight 버튼: Claude API로 2문장 감성 감상평 생성
- 하단 21:9 비율 이미지 + Like/Share 버튼 + 저자 정보

---

## 데이터 구조 (Supabase 테이블)

### magazines 테이블
```sql
CREATE TABLE magazines (
  id TEXT PRIMARY KEY,
  year TEXT NOT NULL,
  month_name TEXT NOT NULL,
  title TEXT NOT NULL,
  editor TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### articles 테이블
```sql
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  magazine_id TEXT REFERENCES magazines(id),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  date TEXT NOT NULL,
  image_url TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### blogs 테이블
```sql
CREATE TABLE blogs (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('Daily','School','Kids','Travel','Food')),
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Heejong Jo',
  date TEXT NOT NULL,
  image_url TEXT NOT NULL,
  content TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  meta_description TEXT,
  og_image_url TEXT,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### family_members 테이블
```sql
CREATE TABLE family_members (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);
```

---

## 관리자 페이지 (`/admin`)

### 인증
- Supabase Auth 이메일/비밀번호 로그인
- 관리자 계정은 환경변수로 관리

### 기능
- **블로그 글 관리**: 목록/작성/수정/삭제/발행토글
  - 리치 텍스트 에디터 (TipTap 등)
  - 이미지 드래그앤드롭 업로드 (Supabase Storage)
  - 카테고리 선택, 슬러그 자동 생성, 메타 설명 입력
- **매거진 관리**: 이슈 생성/아티클 추가·수정·삭제
- **가족 멤버 관리**: 프로필 수정, 사진 변경
- **대시보드**: 총 글 수, 최근 글, 카테고리별 통계

### UI 원칙
- 비기술자가 편하게 쓸 수 있는 직관적 UI
- 모바일에서도 글 작성 가능하도록 반응형

---

## SEO 최적화

### 자동 처리 (세팅 후 신경 안 써도 됨)
- Next.js `metadata` API로 각 페이지 메타태그 자동 생성
- 블로그 글: DB의 title/meta_description/og_image_url 자동 추출
- `sitemap.xml` 동적 생성 (블로그 글 + 매거진 이슈 포함)
- `robots.txt` 설정
- Open Graph / Twitter Card 메타태그
- JSON-LD 구조화 데이터 (BlogPosting, Article)
- `next/image` 자동 WebP 변환 + lazy loading
- 시맨틱 HTML (h1/h2/h3)
- lang="ko"

### 관리자가 제어
- 블로그 글별 meta_description (관리자 페이지에서 입력)
- published 토글로 검색 노출 제어
- 슬러그 커스터마이징

---

## 디자인 시스템

### 색상
```
--bg: #FFFFFF
--text: #1A1A1A
--text-secondary: #64748B
--text-tertiary: #CBD5E1
--accent: #4F46E5 (인디고)
--accent-light: #EEF2FF
--surface: #F8FAFC
--border: #F1F5F9
```

### 타이포그래피
```
Display: Playfair Display 900, italic 혼용
Label: Noto Sans KR 900, uppercase, letter-spacing 3-6px
Body: Noto Sans KR 500, line-height 1.6
```

### 모서리 & 간격
```
카드 radius: 32-50px
섹션 padding: clamp(40px, 8vw, 128px)
카드 hover: translateY(-16px) + shadow 강화
전환: 0.3s 기본, 0.7s 페이지, 0.8s 서가
easing: cubic-bezier(0.16, 1, 0.3, 1)
```

### 특수 효과
```
vivid-hover: saturate(1.2) → saturate(2.2)
grayscale→color: About 프로필 사진
드롭캡: first-letter 6-12rem float left
세로 텍스트: writing-mode: vertical-rl
```

---

## 파일 구조

```
mhj-homepage/
├── CLAUDE.md
├── REFERENCE_DESIGN.jsx          ← 원본 디자인 참고 코드
├── seed-data/
│   ├── magazines.json
│   ├── articles.json
│   ├── blogs.json
│   └── family.json
├── app/
│   ├── layout.tsx
│   ├── page.tsx                  ← Landing
│   ├── about/page.tsx
│   ├── magazine/
│   │   ├── page.tsx              ← Shelf
│   │   └── [id]/page.tsx         ← Issue
│   ├── blog/
│   │   ├── page.tsx              ← Library
│   │   └── [slug]/page.tsx       ← Detail (옵션)
│   ├── admin/
│   │   ├── page.tsx              ← 대시보드
│   │   ├── blogs/...
│   │   ├── magazines/...
│   │   └── login/page.tsx
│   ├── api/
│   │   └── ai-insight/route.ts   ← Claude API (서버사이드)
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── Navigation.tsx
│   ├── Footer.tsx
│   ├── MagazineShelf.tsx
│   ├── BlogCard.tsx
│   ├── DetailModal.tsx
│   ├── HeroCarousel.tsx
│   └── AiInsight.tsx
├── lib/
│   ├── supabase.ts
│   └── utils.ts
├── .env.local
├── tailwind.config.ts
└── package.json
```

---

## 개발 순서

1. Next.js + Tailwind + Supabase 초기화
2. 디자인 시스템 (폰트, 색상, Navigation, Footer)
3. Landing + About 페이지
4. Magazine Shelf (서가 UI)
5. Blog Library + 필터
6. Supabase 테이블 + 시드 데이터
7. 상세 모달 + AI Insight
8. 관리자 페이지 (/admin)
9. SEO (메타태그, sitemap, JSON-LD)
10. 이미지 최적화 + Vercel 배포

---

## 주의사항

- 운영자는 코딩 비전문가. 모든 코드 수정은 Claude Code를 통해 이루어짐.
- 관리자 페이지는 비기술자가 편하게 쓸 수 있어야 함.
- 이미지는 Supabase Storage에 직접 업로드 방식 권장.
- 한국어가 주 언어. 영어는 UI 라벨/브랜딩에만.
- Claude API Key는 서버 사이드(API Route)에서만 사용. 프론트엔드 노출 금지.
- **디자인 수정 시 반드시 `DESIGN_SYSTEM.md`를 먼저 읽고 원칙을 따를 것. 색상, 폰트, 간격, 애니메이션 값을 임의로 변경하지 말 것.**
