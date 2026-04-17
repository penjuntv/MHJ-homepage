# MHJ 매거진 시스템 v2 — 실행 지시서

> **이 문서의 목적:** Magazine Design Bible 확정 후, 매거진 시스템을 v2로 업그레이드하기 위해 남은 기술적/운영적 작업을 정리한 것입니다.
> **새 대화에서 이 문서를 공유하고 작업을 시작하세요.**
> 작성: 2026-04-18

---

## 현재 상태 요약

### ✅ 완료된 것
- **Magazine Design Bible v1 확정** (MHJ_MAGAZINE_DESIGN_BIBLE.md)
  - 판형: 210 × 275mm (Kinfolk/Monocle 사이, A4 너비 호환)
  - 12-column grid (column 12mm, gutter 3mm)
  - 타이포그래피 체계 (Playfair Display + Inter + Noto Sans KR, 3-family rule)
  - 컬러 시스템 (Achromatic + 이슈별 악센트 1색)
  - 12개 마스터 템플릿 설계 완료
  - 이슈 구조 (24p 기본, 4의 배수 규칙)
  - 서가 → 이슈 상세 → 뷰어 인터랙션 흐름 정의
- **기존 매거진 시스템 (v1)**
  - 7개 템플릿 동작 중 (TEXT-ONLY, ESSAY, CLASSIC, SPLIT, PHOTO HERO, PHOTO ESSAY, STORY-2)
  - 서가 UI (좌우 스크롤, 3:4 커버)
  - A4 비율 모달 뷰어 + 이미지 라이트박스
  - ArticlePageRenderer 공용 컴포넌트
  - 매거진 7개, 기사 19개+
  - Admin: 미리보기 좌우 2열 + sticky

### ⬜ 미해결 (기술 — 매거진 v2 전환)
1. **고정 판형 렌더링** — 현재 웹 반응형 → 210×275mm 고정 비율(42:55) 페이지 렌더링으로 전환
2. **12개 템플릿 구현** — 기존 7개 → 12개로 확장 (5개 신규: T01 Cover, T04 Title Card, T08 Sidebar, T11 Directory, T12 Pull Quote)
3. **뷰어 리디자인** — 고정 비율 페이지 + 좌우 넘김 + 페이지 번호
4. **서가 UI 리디자인** — "한 권 꺼내는" 인터랙션, 이슈 상세 페이지 (표지 히어로 + 내지 그리드)
5. **Admin 편집 UI** — 템플릿별 조절 가능 요소 (텍스트 크기 슬라이더, 줄간격, 배경색, 악센트, 드롭캡 등)
6. **Running Header / Folio** — 페이지 상단 이슈정보 + 하단 페이지 번호 자동 생성
7. **Flatplan UI** — Admin에서 이슈 전체 페이지 배치 계획 (드래그앤드롭)

### ⬜ 미해결 (운영)
8. **기존 기사 마이그레이션** — v1 템플릿 → v2 템플릿 매핑 적용
9. **디자인 QA** — Antigravity + Playwright 루프 (필수, 텍스트 프롬프트만으로 불가)
10. **PDF Export** — 인쇄 전환 대비 (Phase 4, 지금은 하지 않음)

---

## 실행 순서 (3단계)

### 1단계: 고정 판형 + 템플릿 엔진 (Claude Code, Opus)
> **가장 큰 작업. 매거진 v2의 근간.**

#### 작업 1A: 페이지 렌더링 엔진

핵심 변경: 콘텐츠에 따라 크기가 변하는 현재 방식 → **고정 비율 페이지** 안에 콘텐츠를 배치하는 방식.

```
Claude Code 프롬프트:

docs/MAGAZINE_DESIGN_BIBLE.md를 먼저 읽으세요. (레포에 추가 후)
docs/DESIGN_RULES.md, docs/ARCHITECTURE.md도 읽으세요.

매거진 페이지 렌더링을 고정 판형 시스템으로 전환합니다.

현재 파일 먼저 읽기:
- components/magazine/ 전체 구조
- components/magazine/ArticlePageRenderer.tsx
- components/magazine/templates/ 폴더
- app/magazine/[id]/page.tsx
- app/mhj-desk/magazines/ 폴더

핵심 변경:
1. MagazinePage 컨테이너 컴포넌트 생성
   - aspect-ratio: 42/55 (210:275mm)
   - max-width: 620px (뷰어), 100% (Admin 미리보기)
   - 내부 padding으로 Live Area 구현 (top:6.55%, right:7.14%, bottom:7.27%, left:8.57%)
   - overflow: hidden (콘텐츠가 넘치면 잘림)

2. 12-column CSS grid 시스템
   - Live area 안에서 12-column grid
   - gap: 사방 비율 기반 (gutter 3mm = ~1.7%)
   - 각 템플릿이 이 grid 위에 배치

3. 기존 ArticlePageRenderer를 MagazinePage 안에 래핑
   - 기존 7개 템플릿은 먼저 MagazinePage 안에서 동작하도록
   - 깨지는 부분 수정

모델: Opus
npm run build 통과 필수.
```

#### 작업 1B: 5개 신규 템플릿 구현

```
Claude Code 프롬프트:

docs/MAGAZINE_DESIGN_BIBLE.md의 "6. 12개 마스터 템플릿" 섹션을 읽으세요.

기존 7개 템플릿에 5개 신규 템플릿을 추가합니다.

먼저 읽을 파일:
- components/magazine/templates/ 폴더 전체
- components/magazine/ArticlePageRenderer.tsx

추가할 템플릿:
1. T01 COVER — 표지 (풀 블리드 사진 + Masthead + 제목 영역)
2. T04 TITLE-CARD — 타이틀 카드 (여백 중심, 타이포그래피만)
3. T08 SIDEBAR — 본문 8col + 사이드바 4col (Cream 배경)
4. T11 DIRECTORY — 3단 균등 목차/디렉토리
5. T12 PULL-QUOTE — 인용구 페이지 (여백이 핵심)

각 템플릿은:
- MagazinePage 컨테이너 안에서 12-column grid 사용
- 디자인 바이블의 타입 스케일 정확히 따르기
- 배경색/악센트 조절 가능하도록 props 설계

DB 변경 필요 시:
- articles 테이블의 template_type CHECK 제약 조건에 새 값 추가
- apply_migration 사용 (execute_sql 아님)

모델: Opus
npm run build 통과 필수.
```

#### 작업 1C: 기존 템플릿 v2 적응

```
Claude Code 프롬프트:

기존 7개 템플릿을 v2 12-column grid 시스템에 맞게 리팩터링합니다.

매핑:
- TEXT-ONLY → T05 (Essay): 8-column 너비, 드롭캡 추가
- ESSAY → T05 (Essay): 통합
- CLASSIC → T06 (Classic): 6+6 균등 2단
- SPLIT → T07 (Feature Split): 5+7 비대칭
- PHOTO-HERO → T02 (Section Opener): 오프너 역할 명확화
- PHOTO-ESSAY → T09 (Photo Essay): 2×2 + 변형
- STORY-2 → T10 (Photo Spread): 스프레드 기반

기존 기사 데이터는 그대로 유지하되, 렌더링만 v2 grid 안에서 이루어지도록.
기존 template_type 값은 유지하고 내부적으로 v2 매핑 적용.

모델: Opus
npm run build 통과 필수.
```

---

### 2단계: 서가 + 이슈 상세 + 뷰어 리디자인 (Claude Code, Opus + Antigravity)

> **비주얼 작업 — Antigravity + Playwright QA 필수**

#### 작업 2A: 뷰어 리디자인

```
Claude Code 프롬프트:

docs/MAGAZINE_DESIGN_BIBLE.md "11. 서가 & 뷰어 UI 규격" 읽으세요.
docs/DESIGN_RULES.md도 읽으세요.

매거진 뷰어를 리디자인합니다.

현재 파일 먼저 읽기:
- components/magazine/MagazineViewer.tsx (또는 관련 컴포넌트)
- app/magazine/[id]/page.tsx

변경 사항:
1. 뷰어 모달
   - 배경: rgba(0,0,0,0.85)
   - 페이지 컨테이너: aspect-ratio 42/55, max-width 620px
   - 페이지 배경: #FDFCFA
   - 그림자: 0 8px 32px rgba(0,0,0,0.3)
   - 좌우 넘김: 화살표 키 + 화살표 버튼 + 터치 스와이프
   - 넘김 애니메이션: 300ms ease-out slide
   - 페이지 번호 표시

2. Running Header 자동 생성
   - 좌 페이지: "MHJ · ISSUE [N]" (Inter 6.5pt 환산)
   - 우 페이지: 섹션 이름
   - 위치: Live area 상단

3. Folio (페이지 번호)
   - 좌 페이지: 하단 좌측
   - 우 페이지: 하단 우측
   - 표지/목차/풀블리드: 번호 생략

모델: Opus
Antigravity + Playwright QA 루프 실행 필수.
```

#### 작업 2B: 이슈 상세 페이지 리디자인

```
Claude Code 프롬프트:

/magazine/[id] 페이지를 리디자인합니다.

현재: 기사 목록 단순 나열
변경:
1. 표지 히어로 영역
   - 큰 표지 이미지 (max-width 400px)
   - 이슈 정보 (호수, 날짜, 기사 수)
   
2. 내지 그리드
   - 기사별 카드: 대표 이미지 + 제목 + 카테고리 라벨
   - 시안(MAGGIE 매거진)처럼 깔끔하게 정돈
   - 클릭 → 뷰어 모달 열림 (해당 페이지로 바로 이동)

3. 레이아웃
   - 표지 좌측 크게 + 우측에 이슈 소개 텍스트
   - 아래로 내지 그리드 (2~3열)

모델: Opus
Antigravity + Playwright QA 루프 실행 필수.
```

#### 작업 2C: 서가 UI 리디자인

```
Claude Code 프롬프트:

/magazine 서가 페이지를 리디자인합니다.

현재: 좌우 스크롤 카드
변경:
1. 서가 느낌의 UI
   - 매거진이 세로로 꽂혀있는 느낌
   - 커버 카드: 3:4 비율, radius 0px (잡지는 직각)
   - 그림자: 0 4px 16px rgba(0,0,0,0.08)
   - 호버: translateY(-8px) + shadow 강화 ("한 권 빠져나오는" 느낌)
   
2. 반응형
   - 데스크톱: 4~5열 그리드
   - 태블릿: 3열
   - 모바일: 2열

모델: Opus
Antigravity + Playwright QA 루프 실행 필수.
```

---

### 3단계: Admin 편집 UI 고도화 (Claude Code, Sonnet/Opus)

#### 작업 3A: 템플릿별 편집 컨트롤

```
Claude Code 프롬프트:

매거진 Admin 편집 UI에 템플릿별 조절 컨트롤을 추가합니다.

현재 파일 먼저 읽기:
- app/mhj-desk/magazines/ 폴더 전체

추가할 컨트롤:
| 요소 | UI | 저장 |
|------|-----|------|
| 텍스트 크기 | 슬라이더 (제목 24~48pt, 본문 8~11pt) | articles.style_overrides JSONB |
| 줄간격 | 슬라이더 (130~170%) | 〃 |
| 배경색 | 컬러 피커 (제한된 팔레트 6색) | 〃 |
| 악센트 색 | 드롭다운 (시즌 4색) | magazines 테이블에 accent_color 추가 |
| 정렬 | 버튼 그룹 (좌/중앙/우) | articles.style_overrides |
| 드롭캡 | 토글 + 크기 슬라이더 (3~5줄) | 〃 |
| 구분선 | 토글 + 굵기 + 색상 | 〃 |

DB 변경:
- articles 테이블에 style_overrides JSONB 컬럼 추가 (없으면)
- magazines 테이블에 accent_color VARCHAR 추가

모델: Sonnet (UI 작업이므로)
npm run build 통과 필수.
```

#### 작업 3B: Flatplan UI (백로그)

```
이슈 전체 페이지 배치를 시각적으로 계획하는 드래그앤드롭 UI.
→ 우선순위 낮음. 콘텐츠가 충분히 쌓인 후 필요.
→ 현재는 Admin에서 기사 sort_order로 관리.
```

---

## 실행 순서 요약

```
Week 1-2:
├── 작업 1A: 고정 판형 렌더링 엔진 (Opus) ← 최우선
├── 작업 1B: 5개 신규 템플릿 (Opus)
└── 작업 1C: 기존 템플릿 v2 적응 (Opus)

Week 3:
├── 작업 2A: 뷰어 리디자인 (Opus + Antigravity)
├── 작업 2B: 이슈 상세 리디자인 (Opus + Antigravity)
└── 작업 2C: 서가 UI 리디자인 (Opus + Antigravity)

Week 4:
├── 작업 3A: Admin 편집 컨트롤 (Sonnet)
├── 기존 기사 마이그레이션 검증
└── 전체 QA (Antigravity + Playwright)

백로그:
├── 작업 3B: Flatplan UI
├── PDF Export (Phase 4)
└── 인쇄 대응 (CMYK, bleed, 용지 등)
```

---

## 의존성 & 선행 조건

| 작업 | 선행 조건 |
|------|----------|
| 1B (신규 템플릿) | 1A (고정 판형 엔진) 완료 |
| 1C (기존 적응) | 1A 완료 |
| 2A~2C (UI 리디자인) | 1A~1C 완료 (템플릿이 고정 판형에서 정상 동작) |
| 3A (Admin 컨트롤) | 1B 완료 (어떤 props가 필요한지 확정) |

---

## 참고 문서 위치

| 문서 | 위치 | 용도 |
|------|------|------|
| Magazine Design Bible | `MHJ_MAGAZINE_DESIGN_BIBLE.md` → 레포 `docs/`에 추가 필요 | 디자인 최상위 기준 |
| MHJ Project Bible | `docs/MHJ_Project_Bible.md` | 전체 프로젝트 참조 |
| DESIGN_RULES | `docs/DESIGN_RULES.md` | 웹사이트 디자인 시스템 |
| ARCHITECTURE | `docs/ARCHITECTURE.md` | 코드 구조 참조 |
| DB_SCHEMA | `docs/DB_SCHEMA.md` | 테이블 구조 |

---

## 별도 진행 (다른 대화창)

- **캐러셀 V2 Export 수정** — 인스타 실행 지시서(별도 문서) 참조
- **캐러셀 모바일 그리드 수정**
- **Yussi Factory v5 업데이트**
- **인스타 프로필 세팅** (수동)

---

*작업 1A(고정 판형 엔진)가 완료되면 매거진이 "진짜 잡지처럼" 보이기 시작합니다.*
*작업 2단계(서가+뷰어)까지 완료되면 "한 권 꺼내서 넘기는" 경험이 완성됩니다.*
*최종 업데이트: 2026-04-18*
