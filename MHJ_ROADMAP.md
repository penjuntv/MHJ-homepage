# MHJ HOMEPAGE — 발전 로드맵 & 다음 단계 지시서

> 이 문서를 새 claude.ai 대화 또는 Claude Code 세션에 통째로 붙여넣으면 됩니다.
> 작성일: 2026.03.08 | 작성: Claude (상목님과의 작업 세션 기반)

---

## 현재 완성 상태

### 라이브 사이트: https://mhj-homepage.vercel.app

| 구분 | 완성된 항목 |
|------|-----------|
| 프론트엔드 | Landing (히어로 캐러셀 + Intro + StoryPress + Newsletter), About, Magazine Shelf, Magazine Issue, Blog Library, Blog 상세 (/blog/[slug]) |
| 백엔드 | Supabase (PostgreSQL + Storage + Auth), 영어 콘텐츠 |
| 관리자 | 로그인, 대시보드, 블로그 CRUD (TipTap 리치 에디터), 매거진/아티클 관리, Site Settings (19개+), 구독자 관리, 디자인 키트 |
| SEO | 메타태그, sitemap.xml, robots.txt, JSON-LD (BlogPosting), Open Graph |
| 배포 | Vercel, 포트 3003 고정 |
| MCP | Supabase MCP + Context7 MCP 연결됨 |

### 기술 스택
- Next.js 14 (App Router) + Tailwind CSS + TypeScript
- Supabase (PostgreSQL + Storage + Auth)
- TipTap (리치 텍스트 에디터)
- Vercel (배포)
- 폰트: Playfair Display + Noto Sans KR

### 프로젝트 핵심 문서 (루트에 있음)
- `CLAUDE.md` — 프로젝트 전체 스펙
- `DESIGN_SYSTEM.md` — 디자인 토큰 (색상, 타이포, 간격, 애니메이션)
- `ARCHITECTURE.md` — 컴포넌트 구조, 라우팅, 데이터 흐름
- `REFERENCE_DESIGN.jsx` — 원본 디자인 (진실의 원천)

---

## 롤모델 분석 — 글로벌 에디토리얼 블로그

### Tier 1: 직접 롤모델 (가족 라이프스타일 매거진)

**Cup of Jo** (cupofjo.com) — 월 420만 PV, 뉴스레터 18만 구독자
- 핵심: 매일 발행, 카테고리별 깊이, 독자 커뮤니티(댓글), "Start Here" 페이지
- 수익: 스폰서 포스트 + 뉴스레터 + 머천다이즈 (페이월 없음)
- 배울 점: "Most Popular This Week" 섹션, Reader Questions 시리즈, 감성적 에디토리얼 톤

**A Beautiful Mess** (abeautifulmess.com) — 자매 운영, DIY/라이프스타일
- 핵심: "Start Here" 진입 가이드, 시리즈 콘텐츠, 레시피/DIY 구조화
- 배울 점: 카테고리 구조의 깊이, 에버그린 콘텐츠 전략

**Wit & Delight** (witanddelight.com) — 미니멀 디자인 + 인테리어 + 육아
- 핵심: 에디토리얼 포토그래피, 구독 모델, 팟캐스트 연동
- 배울 점: 비주얼 퀄리티와 콘텐츠 깊이의 균형

### Tier 2: 디자인 영감 (에디토리얼 매거진)

**IGNANT** (ignant.com) — 아트/디자인/포토그래피 매거진
- 배울 점: 미니멀 레이아웃, 이미지 중심, 세로 마소니 그리드

**The Good Trade** (thegoodtrade.com) — 지속가능한 라이프스타일
- 배울 점: 파스텔 색상, 세리프 타이포, 에어리한 레이아웃, 가치 기반 브랜딩

**Design Milk** (design-milk.com) — 디자인/건축/라이프스타일
- 배울 점: 카테고리 네비게이션, 피처드 콘텐츠 로테이션

### Tier 3: NZ 이민자 틈새 (경쟁 분석)
- NZ 이민자 블로그는 대부분 개인 일기 수준 (WordPress/Blogger)
- **에디토리얼 매거진 퀄리티**로 만드는 곳은 거의 없음 → MHJ의 명확한 차별점
- "Korean family in NZ" + "editorial magazine quality" = 블루오션

---

## 발전 로드맵 — 4단계

### 🔵 Phase 1: 콘텐츠 & 비주얼 완성 (1-2주)

#### 1-1. 실제 가족 사진으로 교체
```
지시서:
"Unsplash 임시 이미지를 모두 실제 가족 사진으로 교체할 거야.
1) /admin에서 각 블로그 글의 대표 이미지를 실제 사진으로 업로드
2) About 페이지의 가족 사진과 세 딸 프로필 사진 — family_members 테이블의 image_url을 Supabase Storage URL로 업데이트
3) Landing Intro 섹션의 대형 이미지 — site_settings에 intro_image_url 키를 추가하고 관리자에서 수정 가능하게
4) 매거진 커버 이미지 — /admin/magazines에서 각 이슈의 커버를 업로드"
```

#### 1-2. Start Here / Welcome 페이지
```
지시서:
"/welcome 페이지를 만들어줘. Cup of Jo의 'Start Here' 스타일로.
1) app/(public)/welcome/page.tsx 생성
2) 구조:
   - 히어로: 가족 사진 + 'Welcome to My Mairangi' 대형 제목
   - 'Who We Are' 섹션: 가족 소개 (About 페이지 요약)
   - 'What You'll Find Here' 섹션: 카테고리별 대표 글 1개씩 카드로
   - 'Our Favorites' 섹션: 인기 글 Top 5 (조회수 또는 수동 선택)
   - 'StoryPress' 섹션: 앱 소개 + CTA
   - Newsletter CTA
3) Navigation에 'Welcome' 메뉴 추가 (Home과 About 사이)
4) site_settings에 welcome 관련 텍스트 추가"
```

#### 1-3. Gallery 페이지
```
지시서:
"/gallery 페이지를 만들어줘.
1) Supabase에 gallery 테이블 생성 (Supabase MCP로):
   CREATE TABLE gallery (
     id SERIAL PRIMARY KEY,
     image_url TEXT NOT NULL,
     caption TEXT,
     category TEXT CHECK (category IN ('Family','Beach','School','Travel','Home','Food')),
     date TEXT,
     sort_order INTEGER DEFAULT 0,
     created_at TIMESTAMPTZ DEFAULT now()
   );
   RLS: 공개 읽기, 인증된 사용자 쓰기.
2) app/(public)/gallery/page.tsx — 마소니 그리드 레이아웃, 카테고리 필터, 라이트박스(이미지 클릭 시 확대)
3) /admin/gallery 페이지 — 사진 업로드, 캡션 입력, 카테고리/정렬 관리
4) Navigation에 'Gallery' 메뉴 추가
5) 디자인: REFERENCE_DESIGN.jsx 스타일 — borderRadius 32px, hover translateY(-8px), vivid-hover"
```

### 🟢 Phase 2: 웹빌더 수준 기능 (2-3주)

#### 2-1. 검색 기능
```
지시서:
"사이트 전체 검색 기능을 추가해줘.
1) Navigation에 검색 아이콘 (돋보기) 추가
2) 클릭 시 풀스크린 검색 오버레이 (모달 스타일, backdrop blur)
3) /api/search API Route — blogs + articles + magazines 테이블에서 title, content를 ILIKE 검색
4) 실시간 검색 (debounce 300ms), 결과를 카테고리별로 그룹핑
5) 검색 결과 클릭 시 해당 페이지로 이동
6) 모바일에서도 풀스크린으로 동작"
```

#### 2-2. 다크 모드
```
지시서:
"다크 모드를 추가해줘.
1) Navigation에 다크모드 토글 버튼 (Sun/Moon 아이콘)
2) CSS 변수 기반: --bg, --text, --surface 등을 다크 버전으로
3) localStorage에 사용자 선호 저장 (단, React state로 관리하고 useEffect로 localStorage 동기화)
4) 시스템 설정 감지 (prefers-color-scheme)
5) DESIGN_SYSTEM.md의 색상 체계를 다크 버전으로도 정의:
   다크모드: bg #0A0A0A, text #F1F5F9, surface #1A1A1A, border #2A2A2A
6) 서가 UI, 블로그 카드, 모달 등 모든 컴포넌트에 적용
7) site_settings에 default_theme 키 추가 (light/dark/system)"
```

#### 2-3. 조회수 & 인기 글
```
지시서:
"블로그 조회수 추적과 인기 글 기능을 추가해줘.
1) blogs 테이블에 view_count INTEGER DEFAULT 0 컬럼 추가
2) /api/view API Route — POST { slug } → view_count +1 (같은 세션에서 중복 방지)
3) /blog/[slug] 페이지 로드 시 자동 호출
4) Blog Library에 'Popular' 필터 추가 (view_count 기준 정렬)
5) Landing 페이지에 'Most Read This Week' 섹션 추가 (Intro 아래)
6) /admin 대시보드에 인기 글 Top 5 표시"
```

#### 2-4. 관련 글 추천
```
지시서:
"블로그 상세 페이지 하단에 관련 글 추천을 추가해줘.
1) /blog/[slug] 페이지 하단, Newsletter CTA 위에 배치
2) 같은 카테고리의 다른 글 3개를 카드로 표시
3) 없으면 최신 글 3개
4) 디자인: 3컬럼 그리드, BlogCard와 동일한 스타일 (1:1 비율, 그라디언트)"
```

#### 2-5. 소셜 공유 기능 완성
```
지시서:
"Share 버튼의 실제 공유 기능을 완성해줘.
1) /blog/[slug] 페이지의 Share 버튼 클릭 시:
   - Web Share API 지원 브라우저: navigator.share() 호출
   - 미지원: 드롭다운으로 Facebook, Twitter/X, LinkedIn, 링크 복사 옵션
2) Open Graph 메타태그가 이미 있으니 SNS 공유 시 미리보기가 예쁘게 나옴
3) 링크 복사 시 'Copied!' 토스트 메시지"
```

#### 2-6. RSS 피드
```
지시서:
"RSS 피드를 추가해줘.
1) app/feed.xml/route.ts — 최신 블로그 20개를 RSS 2.0 형식으로
2) <head>에 <link rel='alternate' type='application/rss+xml'> 추가
3) Footer에 RSS 아이콘 링크 추가"
```

### 🟡 Phase 3: 커뮤니티 & 성장 (3-4주)

#### 3-1. 댓글 시스템
```
지시서:
"블로그 글에 댓글 기능을 추가해줘. Cup of Jo처럼 커뮤니티가 핵심이야.
1) Supabase에 comments 테이블:
   CREATE TABLE comments (
     id SERIAL PRIMARY KEY,
     blog_id INTEGER REFERENCES blogs(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     email TEXT NOT NULL,
     content TEXT NOT NULL,
     approved BOOLEAN DEFAULT false,
     created_at TIMESTAMPTZ DEFAULT now()
   );
2) /blog/[slug] 하단에 댓글 폼 (이름, 이메일, 내용) + 기존 댓글 목록
3) 기본 비공개 → 관리자 승인 후 표시 (approved = true)
4) /admin/comments 페이지 — 대기 중 댓글 목록, 승인/삭제 버튼
5) 사이드바에 '댓글' 메뉴 추가"
```

#### 3-2. 태그 시스템
```
지시서:
"블로그 태그 기능을 추가해줘.
1) blogs 테이블에 tags TEXT[] 컬럼 추가 (PostgreSQL 배열)
2) BlogForm에 태그 입력 UI (콤마 구분, 칩 스타일)
3) /blog/[slug]에 태그 표시 (클릭 가능)
4) /blog/tag/[tag] 페이지 — 해당 태그의 모든 글 목록
5) sitemap에 태그 페이지 포함
6) 인기 태그 클라우드를 Blog Library 사이드에 표시"
```

#### 3-3. 뉴스레터 자동 발송 연동
```
지시서:
"Newsletter 구독자에게 이메일을 보낼 수 있게 연동해줘.
1) Resend (resend.com) 또는 Mailgun 연동 — API Key를 .env.local에
2) /api/send-newsletter API Route — 제목, 본문 HTML → 전체 구독자에게 발송
3) /admin/newsletter/new 페이지 — 뉴스레터 작성 + 미리보기 + 발송 버튼
4) 발송 이력 테이블 (newsletters)
5) 블로그 글 발행 시 '뉴스레터로도 보내기' 체크박스 옵션"
```

#### 3-4. 예약 발행
```
지시서:
"블로그 글 예약 발행 기능을 추가해줘.
1) blogs 테이블에 publish_at TIMESTAMPTZ 컬럼 추가
2) BlogForm에 발행 일시 선택 (date + time picker)
3) 프론트엔드에서 published=true AND (publish_at IS NULL OR publish_at <= now()) 조건으로 필터
4) /admin/blogs에서 '예약됨' 상태 표시"
```

### 🔴 Phase 4: 수익화 & 확장 (4주+)

#### 4-1. 커스텀 도메인
```
지시서:
"커스텀 도메인을 연결해줘.
1) Vercel 대시보드 → Settings → Domains → mymairangi.com 추가
2) DNS 설정 안내:
   - A 레코드: 76.76.21.21
   - CNAME www: cname.vercel-dns.com
3) HTTPS 자동 적용 확인
4) sitemap.ts와 metadata의 URL을 mymairangi.com으로 업데이트"
```

#### 4-2. Analytics
```
지시서:
"Vercel Analytics를 연동해줘.
1) npm install @vercel/analytics
2) app/layout.tsx에 <Analytics /> 컴포넌트 추가
3) /admin 대시보드에 기본 통계 표시 (Vercel API로)"
```

#### 4-3. 스폰서 포스트 / 광고 영역
```
지시서:
"스폰서 콘텐츠 기능을 추가해줘.
1) blogs 테이블에 is_sponsored BOOLEAN DEFAULT false, sponsor_name TEXT 추가
2) 스폰서 포스트에 'Sponsored by [이름]' 라벨 표시
3) BlogForm에 스폰서 체크박스 + 이름 입력
4) Blog Library에서 스폰서 글은 별도 스타일 (연한 배경 또는 라벨)"
```

#### 4-4. 다국어 지원 (한국어/영어)
```
지시서:
"한국어/영어 다국어 지원을 추가해줘.
1) next-intl 패키지 설치
2) /en, /ko 경로 분리
3) site_settings를 언어별로 분리 (key_en, key_ko 또는 별도 테이블)
4) Navigation에 언어 전환 버튼 (EN | 한)
5) 블로그 글은 단일 언어로 유지하되, UI 텍스트만 다국어"
```

#### 4-5. StoryPress 앱 연동 강화
```
지시서:
"StoryPress 앱과 홈페이지의 시너지를 강화해줘.
1) /storypress 독립 랜딩 페이지 (현재 Landing의 섹션을 확장)
   - 앱 스크린샷/데모 영상
   - 기능 소개 (하루 4단어, 스토리 기반)
   - 대기자 명단 폼 (subscribers 테이블 재활용, source='storypress' 구분)
   - 사회적 증명 (가족 사진, 사용 후기)
2) 블로그에서 Bilingual 카테고리 글 → StoryPress CTA 자동 삽입
3) site_settings에 storypress_video_url 추가"
```

---

## 관리자 기능 추가 목록 (우선순위순)

| 기능 | 설명 | Phase |
|------|------|-------|
| Gallery 관리 | 사진 업로드, 캡션, 카테고리, 정렬 | 1 |
| 댓글 관리 | 승인/삭제, 대기 중 알림 뱃지 | 3 |
| 뉴스레터 발송 | 작성 + 미리보기 + 발송 + 이력 | 3 |
| 조회수 통계 | 인기 글 Top 10, 일별 추이 | 2 |
| 예약 발행 | 날짜/시간 지정 발행 | 3 |
| 태그 관리 | 태그별 글 목록, 인기 태그 | 3 |
| SEO 점검 | 각 글의 SEO 점수, 누락된 메타 확인 | 2 |
| 미디어 라이브러리 | Supabase Storage의 모든 이미지를 한 곳에서 관리 | 2 |

---

## site_settings 추가 예정 키

| 키 | 기본값 | Phase |
|----|--------|-------|
| intro_image_url | (Supabase Storage URL) | 1 |
| welcome_title | "Welcome to My Mairangi" | 1 |
| welcome_description | "A family's story..." | 1 |
| gallery_title | "Gallery" | 1 |
| gallery_description | "Moments from Mairangi Bay" | 1 |
| magazine_shelf_title | "Magazine Shelf" | 완료 |
| magazine_shelf_hint | "Scroll to explore" | 완료 |
| default_theme | "light" | 2 |
| storypress_video_url | "" | 4 |
| social_instagram | "" | 2 |
| social_youtube | "https://youtube.com/@..." | 2 |
| google_analytics_id | "" | 4 |

---

## SEO 추가 최적화

| 항목 | 현재 | 목표 |
|------|------|------|
| 블로그 개별 URL | ✅ /blog/[slug] | 완료 |
| JSON-LD | ✅ BlogPosting | WebSite, Organization, BreadcrumbList 추가 |
| RSS 피드 | ❌ | /feed.xml 추가 |
| 태그 페이지 | ❌ | /blog/tag/[tag] |
| 검색 가능 URL | ❌ | 검색 결과 페이지 /search?q= |
| 이미지 alt 텍스트 | 부분적 | 모든 이미지에 의미 있는 alt |
| 페이지 속도 | 미확인 | Lighthouse 90+ 목표 |
| 구조화된 FAQ | ❌ | FAQPage schema (NZ Life 섹션) |

---

## 디자인 개선 체크리스트 (REFERENCE_DESIGN 비교)

Claude Code에서 디자인 리뷰 시 이 체크리스트를 사용:

```
지시서:
"REFERENCE_DESIGN.jsx와 현재 구현을 비교해서 디자인 차이점을 찾아줘.
특히 확인할 것:
1) 히어로 캐러셀 — 이미지 saturate(1.5), 오버레이 rgba(0,0,0,0.4), 인디케이터 도트 크기
2) Intro 섹션 — vivid-hover 효과, gradient overlay, 링크 카드 hover
3) Magazine Shelf — spine/cover 크로스페이드 타이밍, 배경색 #1a1a1a, 인디고 월 뱃지
4) Blog Library — 카드 1:1 비율, 그라디언트 오버레이 3단계, hover translateY(-16px)
5) 모달/상세 페이지 — 드롭캡 크기, 21:9 이미지, 저자 정보 레이아웃
6) Footer — 3컬럼 그리드, 투명도 값 (0.4/0.3/0.2/0.1)
7) 반응형 — 768px 브레이크포인트, 모바일 메뉴 풀스크린
8) 애니메이션 — stagger 지연, cubic-bezier(0.16, 1, 0.3, 1) 적용 여부
DESIGN_SYSTEM.md를 참고하고, 차이점을 목록으로 정리한 뒤 하나씩 수정해줘."
```

---

## 프레이머/웹빌더 수준 기능 비교

| 기능 | Framer/Wix | MHJ 현재 | 추가 계획 |
|------|-----------|---------|----------|
| 비주얼 에디터 | ✅ | ❌ (Claude Code로 대체) | 유지 — Claude Code가 더 강력 |
| 텍스트 관리 | ✅ | ✅ site_settings | 완료 |
| 이미지 업로드 | ✅ | ✅ Supabase Storage | 완료 |
| 블로그 CMS | ✅ | ✅ TipTap + CRUD | 완료 |
| SEO 설정 | ✅ | ✅ metadata + sitemap | 완료 |
| 검색 | ✅ | ❌ | Phase 2 |
| 다크 모드 | ✅ | ❌ | Phase 2 |
| 댓글 | 플러그인 | ❌ | Phase 3 |
| 뉴스레터 | 플러그인 | ✅ 구독 수집 | 발송은 Phase 3 |
| Analytics | ✅ | ❌ | Phase 4 |
| 다국어 | 플러그인 | ❌ | Phase 4 |
| 커스텀 도메인 | ✅ | ❌ | Phase 4 |
| 폼 빌더 | ✅ | 부분적 | 필요 시 |
| 이커머스 | ✅ | ❌ | 필요 시 (Stripe) |

**핵심 차이**: Framer/Wix는 드래그앤드롭 비주얼 에디터가 강점이지만, MHJ는 Claude Code를 통해 자연어로 "히어로 제목 크기를 좀 키워줘" 같은 요청이 가능하므로 실질적으로 더 유연합니다. 코드 수준의 커스터마이징이 가능한 것이 최대 장점.

---

## 작업 시 주의사항 (Claude Code에게)

1. **디자인 수정 시 반드시 DESIGN_SYSTEM.md를 먼저 읽을 것**
2. **REFERENCE_DESIGN.jsx가 디자인의 진실의 원천** — 색상/폰트/간격/애니메이션 값을 임의로 변경하지 말 것
3. **개발 서버 포트는 3003 고정** (localhost:3003)
4. **Supabase MCP로 DB 작업 직접 실행** (대시보드 복붙 불필요)
5. **콘텐츠는 영어**, UI는 영어 (한국어 설명은 관리자 페이지에만)
6. **cache: 'no-store'** — 모든 Supabase fetch에 적용되어 있음 (실시간 반영)
7. **TipTap 에디터** — immediatelyRender: false 옵션 필수 (SSR 호환)
