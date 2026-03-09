# MHJ HOMEPAGE 시작 가이드

## 이 폴더에 있는 파일들

| 파일 | 설명 |
|------|------|
| `CLAUDE.md` | 프로젝트 전체 스펙. Claude Code가 읽고 이해하는 핵심 문서 |
| `REFERENCE_DESIGN.jsx` | Gemini Canvas에서 만든 원본 디자인 코드. 디자인 참고용 |
| `seed-data/magazines.json` | 매거진 10개 초기 데이터 |
| `seed-data/articles.json` | 아티클 6개 초기 데이터 (2026년 3월호) |
| `seed-data/blogs.json` | 블로그 10개 초기 데이터 (slug, meta_description 포함) |
| `seed-data/family.json` | 가족 멤버 3명 데이터 |
| `seed-data/setup.sql` | Supabase 테이블 생성 SQL |
| `.env.example` | 환경변수 템플릿 |

---

## Claude Code에서 시작하는 법

### 1단계: 프로젝트 폴더로 이동
터미널에서 프로젝트 폴더로 가서 Claude Code를 실행하세요.

### 2단계: CLAUDE.md를 읽게 하기
Claude Code에게 이렇게 말하세요:

> "CLAUDE.md를 읽고 이 프로젝트를 이해해줘. 그리고 REFERENCE_DESIGN.jsx도 참고해서 디자인을 동일하게 구현해줘."

### 3단계: 프로젝트 초기화 요청
> "Next.js 14 App Router + Tailwind CSS + Supabase로 프로젝트를 초기화해줘. CLAUDE.md의 기술 스택과 파일 구조를 따라줘."

### 4단계: 페이지별로 구현 요청
> "Landing 페이지부터 만들어줘. REFERENCE_DESIGN.jsx의 LandingPage 컴포넌트를 참고해서 동일한 디자인으로."

> "Magazine Shelf 페이지를 만들어줘. 서가 UI가 핵심이야. REFERENCE_DESIGN.jsx의 MagazineShelf 컴포넌트를 그대로 구현해줘."

### 5단계: Supabase 연결
> "seed-data/setup.sql을 Supabase에 실행할 수 있게 도와줘. 그리고 시드 데이터도 넣어줘."

### 6단계: 관리자 페이지
> "/admin 관리자 페이지를 만들어줘. 블로그 글을 쉽게 추가/수정/삭제할 수 있는 직관적인 UI로."

### 7단계: SEO 최적화
> "CLAUDE.md의 SEO 섹션대로 메타태그, sitemap.xml, robots.txt, JSON-LD를 설정해줘."

### 8단계: 배포
> "Vercel에 배포할 수 있게 설정해줘."

---

## 나중에 콘텐츠 관리할 때

### 블로그 글 추가
관리자 페이지(`/admin`)에서 직접 작성하면 됩니다.

### 매거진 이슈 추가
관리자 페이지에서 새 이슈를 만들고, 아티클을 추가합니다.

### 디자인 수정이 필요할 때
Claude Code에 자연어로 요청하세요:
> "블로그 카드의 모서리를 좀 더 둥글게 해줘"
> "About 페이지에 가족 사진 갤러리 섹션을 추가해줘"
> "네비게이션에 'Gallery' 메뉴를 하나 더 추가해줘"

---

## 주의사항

- `.env.local` 파일은 절대 깃에 커밋하지 마세요 (API 키가 들어있음)
- 이미지는 Supabase Storage에 업로드하는 것을 권장합니다
- Unsplash 이미지 URL은 초기 개발용이고, 나중에 실제 가족 사진으로 교체하세요
