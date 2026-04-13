# CAROUSEL V2 — 마스터 플랜 (v1.1 통합본)
## MHJ Instagram Carousel Generator 완전 재구축

*작성: 2026-04-11 | 수정: 2026-04-14 (yussi-inata 업데이트 반영)*
*렌더링 엔진: html-to-image (클라이언트 사이드)*
*목표: Canva 수준의 에디토리얼 캐러셀 자동 생성*
*레퍼런스 코드: `penjuntv/yussi-inata` (Google AI Studio 앱)*

---

## 세션 1 완료 (2026-04-14)

### 구현 완료 항목

1. **yussi-inata 이식**
   - `NZIcons.tsx` — 10개 SVG (Koru, SilverFern, Kiwi, Mountain, Squiggle, NZMap, SouthernCross, BookOpen, SunRays, OrganicBlob)
   - `filters.ts` — 이미지 필터 8종 (grayscale, sepia, blur, darken, lighten, vibrant, contrast)
   - `textBg.ts` — 텍스트 배경 4종 (glass-light/dark, solid-light/dark) + inline style 방식
   - `fontTheme.ts` — 폰트 테마 3종 (editorial, modern, tech)

2. **타입 확장**
   - 27+ 레이아웃 타입 추가 (cover-magazine, content-stat-grid, content-bar-chart, content-donut-chart, content-social-quote, content-neo-brutalism, content-timeline)
   - SlideConfig에 imageFilter, textBackground, fontTheme, globalTexture, accentIcon 필드 추가

3. **토큰 업데이트**
   - gold → #C9A882 (MHJ 브랜드), goldWarm → #D4A373 (yussi-inata 원본)
   - mono 폰트 추가

4. **공유 컴포넌트**
   - `SlideFooter.tsx` — 모든 슬라이드 하단 MHJ Footer ("MHJ" + "01/10")
   - `TextureOverlay.tsx` — noise/paper 텍스처 오버레이
   - `AccentDecoration.tsx` — NZ 아이콘 장식 (선택적 배치)

5. **레이아웃 5개 구현**
   - `CoverMinimal` — 아치형 사진 + 타이포, 필터/텍스처/아이콘 지원
   - `ContentEditorial` — 드롭캡 + 상단 사진 + textBg 지원
   - `ContentQuote` — 대형 인용부호 + 중앙 텍스트
   - `ContentStatGrid` — 2x2 통계 그리드 (yussi-inata info-stat-grid 기반)
   - `CtaMinimal` — 다크 CTA + MHJ 로고

6. **슬라이드 편집 시스템**
   - `SlideEditPanel.tsx` — 탭 기반 편집 (Layout | Filter | Color | Font | Icon)
   - 27개 레이아웃 선택, 8종 이미지 필터, 6개 색상 프리셋, 3개 폰트 테마, 10개 NZ 아이콘
   - Undo/Redo (yussi-inata past/future 패턴)

7. **Export 엔진** — html-to-image + JSZip + file-saver (클라이언트 사이드)

---

## 세션 2 완료 (2026-04-14)

### 구현 완료: 27개 레이아웃 전체

**커버 (7종):**
CoverMinimal, CoverArch, CoverFullImage, CoverSplit, CoverPolaroid, CoverMagazine, CoverDark

**콘텐츠 (11종):**
ContentEditorial, ContentStep, ContentSplit, ContentQuote, ContentBoldNumber, ContentPhotoOverlay, ContentAbstract, ContentList, ContentContinuousLine, ContentArchPhoto, ContentStatGrid

**인포그래픽 (2종):**
ContentBarChart, ContentDonutChart

**스타일 (2종):**
ContentNeoBrutalism, ContentSocialQuote

**특수 (4종):**
SummaryChecklist, YussiTake, VisualBreak, CtaMinimal

**추가 (1종):**
ContentTimeline

### 아키텍처 변경
- `SlideRenderer` — switch문 → `LAYOUT_MAP` 객체 방식으로 리팩토링 (27개 1:1 매핑)
- `convertInput` — 슬라이드별 다양한 레이아웃 자동 배정 (cover-arch → content-quote → content-step/editorial/split/photo-overlay → visual-break → summary-checklist → yussi-take → cta-minimal)
- 모든 레이아웃: inline style only (html-to-image 호환), SlideFooter, TextureOverlay, AccentDecoration 공유 컴포넌트 사용
- `npm run build` 통과, 캐러셀 페이지 22.8 kB

---

## 세션 3 완료 (2026-04-14)

### 구현 완료

1. **Gemini AI 레이아웃 추천 API**
   - `POST /api/carousel/ai-layout` — text → Gemini 2.0 Flash → 10 SlideConfig[]
   - 27개 레이아웃 중 최적 조합 자동 선택, MHJ 브랜드 규칙 프롬프트 내장
   - JSON 파싱 + 유효성 검증 + fallback

2. **3가지 입력 모드**
   - **Blog** — 기존 BlogSelector + CarouselEditor 플로우
   - **AI Generate** — 텍스트 입력 → Gemini API → 슬라이드 직접 생성
   - **Manual** — 10장 빈 슬라이드 생성 → 편집
   - 탭 UI (Blog | AI Generate | Manual)

3. **인라인 텍스트 편집**
   - SlideEditPanel에 Text 탭 추가 (title, subtitle, body, imageUrl 직접 편집)
   - 실시간 미리보기 반영

4. **개별 슬라이드 다운로드**
   - LivePreview에 PNG 다운로드 버튼 추가 (html-to-image 단건 export)
   - ZIP 다운로드는 ExportEngine에서 기존 유지

5. **빌드**
   - `npm run build` 통과, 24.4 kB
   - `/api/carousel/ai-layout` API 추가

---

## 주의사항

1. yussi-inata 코드는 참고용 — Tailwind v4 문법 충돌 가능
2. NZIcons.tsx는 순수 SVG — 그대로 복사 가능 (완료)
3. yussi-inata CSS 변수를 MHJ 토큰으로 매핑 (완료)
4. 세션 2는 반드시 Playwright QA
5. 기존 기능 유지 — BlogSelector, CaptionPanel, HashtagManager, RecentList
6. npm run build 매 세션 끝에 반드시 통과
7. OG 이미지(/api/og)는 Satori 유지 — 절대 건드리지 않음
