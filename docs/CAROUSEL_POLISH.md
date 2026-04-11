# CAROUSEL_POLISH.md — Claude Code 세션 3 지시서
# 캐러셀 슬라이드 디자인 폴리싱

> **이 파일을 읽고 그대로 실행하세요.**
> Plan Mode에서 계획을 세우고, 승인 후 실행하세요.
> **세션 1, 2가 완료된 후에 실행하세요.**

---

## 작업 목표

캐러셀 슬라이드 7개 컴포넌트의 디자인 퀄리티를 에디토리얼 매거진 수준으로 끌어올린다. 기능 변경 없이 비주얼만 개선한다.

---

## 반드시 먼저 읽을 파일

```
docs/DESIGN_RULES.md           ← 색상, 폰트, radius, 호버 규칙
docs/DESIGN_SYSTEM.md          ← 디자인 토큰
components/carousel/tokens.ts  ← 캐러셀 전용 토큰
components/carousel/slides/    ← 7개 슬라이드 (수정 대상)
```

---

## 확인된 문제 & 수정 사항

### 1. CoverSlide — 텍스트 가독성 부족

**문제**: 사진 위에 흰 글씨가 올라가는데, 사진이 밝으면 글씨가 안 보임. 그림자도 배경 처리도 없음.

**수정**:
- 사진 위에 하단→상단 그라데이션 오버레이 추가
  ```
  background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)
  ```
- 이 오버레이는 하단 40%를 덮어서 제목/부제/한국어 부제가 항상 읽힘
- 사진 없는 경우(coverImageUrl 비어있을 때): bgWarm(#FAF8F5) 배경 + 어두운 텍스트(#1A1A1A) — 현재 로직 유지하되 레이아웃 개선

**추가**:
- 카테고리 태그(좌상단): 배경 rgba(255,255,255,0.2), backdrop-filter 없이 순수 반투명, padding 6px 14px, borderRadius 4px, fontSize 11px, letterSpacing 3px, uppercase
- MHJ 로고(우상단): fontSize 16px, Playfair Display, fontWeight 700, opacity 0.9

### 2. ContextSlide (#2) — 너무 비어보임

**문제**: "WHY THIS MATTERS" 라벨 + subtitle + 한국어 부제만 있고, 슬라이드의 60%가 빈 공간.

**수정**:
- 텍스트를 수직 중앙 정렬 (justifyContent: 'center')
- "WHY THIS MATTERS" 위에 accent line 추가: width 40px, height 3px, background #8A6B4F, marginBottom 16px
- subtitle 폰트를 키움: 36px → 42px (Playfair Display)
- 한국어 부제: 간격 넓힘 marginTop 20px

### 3. ContentSlide (#3~6) — 하단 여백 과다, 텍스트 상단 몰림

**문제**: 번호 + 제목 + 본문 + 하이라이트 + 한국어가 상단에 몰리고, 하단 60%가 빈 공간.

**수정**:
- 전체 레이아웃을 수직 중앙이 아닌 **상단 1/3 지점에서 시작**하도록 조정
  ```
  paddingTop: 160 (기존 80에서 증가)
  ```
- 또는 flexDirection: 'column', justifyContent: 'center' 로 완전 수직 중앙
- 번호(01, 02...)와 제목 사이에 accent line 추가: width 40px, height 3px, background #8A6B4F, marginTop 12px, marginBottom 20px
- 하이라이트 박스 개선:
  - 현재: 배경만 있는 단순 박스
  - 변경: 좌측에 accent border 추가 (borderLeft: 4px solid #8A6B4F) + 배경 #FEF3C7 + padding 16px 20px + borderRadius 0 (좌측 직선, 우측도 직선 — 인용 스타일)
- 본문(body) line-height: 1.7 → 1.8
- 번호 스타일 개선: Playfair Display italic, fontSize 56px (현재 64보다 약간 줄임), color를 accent(#8A6B4F)에서 textTertiary(#CBD5E1)로 변경 — 번호가 너무 튀지 않게

### 4. VisualBreakSlide (#7) — 사진 없을 때 처리

**문제**: visualImageUrl이 없으면 빈 슬라이드가 됨.

**수정**:
- 사진 없을 때: bgWarm(#FAF8F5) 배경 + 큰 인용문 중앙 배치 (pullQuote를 메인 요소로)
- pullQuote 스타일: Playfair Display italic, fontSize 36px, color #1A1A1A, textAlign center, maxWidth 800px
- 인용문 위아래에 장식 따옴표: fontSize 72px, Playfair Display, color #CBD5E1, lineHeight 1
- 사진 있을 때: 현재 로직 유지하되, Cover와 동일한 하단 그라데이션 오버레이 적용 (pullQuote 가독성)

### 5. SummarySlide (#8) — 체크리스트 시각 개선

**문제**: 단순 텍스트 나열. "저장할 만한" 느낌이 부족.

**수정**:
- 각 체크 항목을 카드화: 
  - background: white (#FFFFFF)
  - border: 1px solid #EDE9E3
  - borderRadius: 8px
  - padding: 14px 18px
  - marginBottom: 10px
- ✓ 마크를 accent 색상(#8A6B4F)으로, fontWeight 700
- 슬라이드 상단에 "KEY TAKEAWAYS" 라벨: fontSize 11px, letterSpacing 4px, uppercase, color #8A6B4F
- 한국어 요약은 하단에 구분선(1px #EDE9E3) 후 작은 글씨로

### 6. YussiTakeSlide (#9) — 개성 부여

**문제**: 다른 콘텐츠 슬라이드와 구분이 안 됨.

**수정**:
- 상단에 "YUSSI'S TAKE" 라벨: fontSize 11px, letterSpacing 4px, uppercase, color #8A6B4F
- 라벨 아래 accent line: width 40px, height 3px, #8A6B4F
- 영어 본문: Playfair Display italic, fontSize 24px, lineHeight 1.6 — 인용문 스타일로 차별화
- 한국어: 본문 아래, Noto Sans KR, fontSize 16px, color textSecondary
- 배경: bgWarm(#FAF8F5) 대신 약간 다른 톤 — #F5F0EA (살짝 더 따뜻한 크림) — 이전 슬라이드들과 미묘하게 다르게

### 7. CtaSlide (#10) — 행동 유도 강화

**문제**: CTA가 약함. 브랜드 로고만 있고 행동 유도가 부족.

**수정**:
- 상단 1/3: MHJ 로고 크게 (Playfair Display, fontSize 48px, #8A6B4F) + tagline "my mairangi" (Inter, fontSize 12px, letterSpacing 4px)
- 중앙: CTA 텍스트 (Playfair Display, fontSize 28px, "Read the full article")
- 하단: 3개 아이콘 + 텍스트 행
  - 💾 Save this for later
  - 📩 Send to a friend
  - ➕ Follow @mhj_nz
  - 각 행: fontSize 18px, Inter, color textSecondary
- 배경: accent(#8A6B4F) — dark style CTA. 모든 텍스트 흰색(#FFFFFF)

### 8. 공통 — 하단 워터마크 통일

모든 슬라이드 하단에:
- 좌: "MHJ" (Playfair Display, fontSize 14px, color textTertiary #CBD5E1)
- 우: "01 / 10" (Inter, fontSize 12px, color textTertiary)
- position: absolute, bottom: 40px (안전 영역 내)

현재 구현이 이미 있으면 스타일만 통일. 없으면 추가.

---

## 수정 대상 파일

```
components/carousel/slides/
  CoverSlide.tsx         ← 그라데이션 오버레이 + 카테고리 태그 + 로고
  ContextSlide.tsx       ← 수직 중앙 + accent line + 폰트 키움
  ContentSlide.tsx       ← 여백 조정 + accent line + 하이라이트 개선 + 번호 톤 다운
  VisualBreakSlide.tsx   ← 사진 없을 때 처리 + 그라데이션
  SummarySlide.tsx       ← 체크리스트 카드화 + 라벨
  YussiTakeSlide.tsx     ← italic 인용 스타일 + 배경 차별화
  CtaSlide.tsx           ← 브랜드 CTA 강화 + 어두운 배경
```

`tokens.ts`, `types.ts`, `utils.ts`, `render.tsx` — 무수정.
`app/api/carousel/` — 무수정.
`app/mhj-desk/carousel/` — 무수정.

---

## 디자인 절대 규칙

- 인디고(#4F46E5) 사용 금지
- border-radius ≤ 8px (CTA 버튼 24px만 예외)
- display: 'flex' only (grid 금지 — Satori 제약)
- 인라인 스타일만 (Tailwind/class 불가 — Satori 제약)
- accent color: #8A6B4F (MHJ 브랜드)
- 따뜻한 톤 유지 — 차가운 회색(#F5F5F5) 금지

---

## 테스트

1. `npm run build` 통과
2. 더미 데이터로 `/api/carousel/generate` 호출 → 10장 PNG 생성 확인
3. 각 슬라이드 PNG를 열어서 시각 확인:
   - Cover: 사진 위 텍스트 가독성
   - Content: 하단 여백 감소, 텍스트 적절한 위치
   - Summary: 체크리스트 카드 스타일
   - CTA: 어두운 배경 + 흰 텍스트
4. 한글 렌더링 깨짐 없음
5. 사진 없는 경우(coverImageUrl/visualImageUrl 빈값) 정상 처리
