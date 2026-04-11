# HOMEPAGE_DESIGN_REFRESH.md — Claude Code 세션 지시서
# 홈페이지 색감/대비/시각적 밀도 개선

> **이 파일을 읽고 그대로 실행하세요.**
> **이 작업은 반드시 Antigravity + Playwright QA 루프와 함께 진행하세요.**
> Plan Mode에서 계획을 세우고, 승인 후 실행하세요.

---

## 문제

홈페이지 전체가 **연하고 밋밋합니다.** 크림 배경 위에 크림 톤 카드, 유일한 accent(갈색)도 너무 조용해서 시선을 잡는 포인트가 없습니다. Kinfolk이나 Cereal Magazine 같은 에디토리얼 매거진의 "미니멀하지만 존재감 있는" 느낌이 아니라, "그냥 비어있는" 느낌입니다.

---

## 반드시 먼저 읽을 파일

```
docs/DESIGN_RULES.md
docs/DESIGN_SYSTEM.md
app/(public)/page.tsx
app/globals.css
components/NewsletterCTA.tsx
components/BlogCard.tsx (또는 PostCard.tsx)
```

---

## 개선 방향 (5가지)

### 1. 배경 대비 만들기 — 섹션별 배경색 교대

**문제**: 전체 페이지가 #FFFFFF 또는 #FAF8F5 단일 톤. 섹션 경계가 보이지 않음.

**해결**: 섹션마다 배경색을 교대로 사용하여 시각적 리듬 생성.

```
히어로 캐러셀: #FAF8F5 (cream)
인트로 텍스트: #FFFFFF (white)
LATEST 섹션: #FAF8F5 (cream)
EXPLORE BY TOPIC: #FFFFFF (white)
FROM THE ARCHIVE: #F5F0EA (warm) ← 약간 더 진한 크림
MAGAZINE: #FAF8F5 (cream)
NEWSLETTER CTA: #1A1A1A (dark) ← 반전 섹션
FOOTER: #FAF8F5 (cream)
```

핵심: **NEWSLETTER CTA 섹션을 어두운 배경(#1A1A1A)에 흰 텍스트로** 만들어서 페이지에 시각적 앵커를 만듭니다. 현재 크림 위에 크림이라 존재감이 없습니다.

### 2. 히어로 캐러셀 강화

**문제**: 히어로 이미지 위 텍스트가 약함. 그라데이션이 부족하거나 텍스트 크기가 작음.

**해결**:
- 히어로 이미지 위 그라데이션: `linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)`
- 히어로 제목: font-size를 현재보다 10-15% 키우기
- 카테고리 라벨: 배경을 반투명 흰색에서 accent(#8A6B4F) solid로 변경 → 눈에 띔
- "by Yussi · Read →" 텍스트: 현재 거의 안 보임 → opacity 높이기 또는 색상 밝게

### 3. 카드 hover 효과 + 그림자

**문제**: 카드가 배경과 분리되지 않음. 평평하게 보임.

**해결**:
- 카드에 미세한 그림자 추가: `box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)`
- hover 시: `box-shadow: 0 4px 12px rgba(0,0,0,0.08)` + `transition: box-shadow 0.2s ease`
- **translateY 금지** (DESIGN_RULES), **saturate 금지** — 그림자만 사용
- 카드 배경을 명시적 #FFFFFF로 (배경이 cream인 섹션에서 카드가 white로 떠보이게)

### 4. 섹션 라벨 강화

**문제**: LATEST, EXPLORE BY TOPIC 등 라벨이 너무 연함 (이전에 tertiary → secondary로 변경했지만 여전히 약함).

**해결**:
- 섹션 라벨에 왼쪽 accent bar 추가: 라벨 앞에 4px × 16px 갈색(#8A6B4F) 바
- 또는 섹션 라벨 아래에 accent underline: 2px solid #8A6B4F, width 30px
- 라벨 font-size를 현재보다 1px 키우기

### 5. Newsletter CTA 다크 모드 반전

**문제**: CTA 섹션이 배경과 동화되어 눈에 안 띔.

**해결**: CTA 섹션을 어두운 배경으로 반전.
```css
background: #1A1A1A;
color: #FFFFFF;
/* FREE 배지: 기존 #FEF3C7 유지 — 어두운 배경에서 더 눈에 띔 */
/* 이메일 입력 배경: rgba(255,255,255,0.1) */
/* 버튼: #8A6B4F 배경, #FFFFFF 텍스트 */
```

이 반전 섹션이 페이지 스크롤 중에 **시각적 앵커** 역할을 합니다. Cup of Jo, The Everygirl 등 모든 성공 사례가 이 패턴을 사용합니다.

---

## 6. 캐러셀 슬라이드 디자인 전면 개편 (Instagram 게시용)

**문제**: 현재 캐러셀 슬라이드가 인스타그램에서 사용하기에 허접합니다. 여백이 과도하고, 텍스트가 작고, 배경이 밋밋해서 인스타 피드에서 완전히 묻힙니다. 홈페이지와 같은 "연한/밋밋한" 문제가 캐러셀에도 동일하게 존재합니다.

**현재 문제 (슬라이드별):**
- CoverSlide: 텍스트가 하단 1/3에만. 상단 2/3이 완전히 비어있음. STORYPRESS 배지 불필요.
- ContentSlide: 번호(01)와 제목은 좋지만 하단 절반이 완전히 비어있음. highlight 박스가 작음.
- SummarySlide: 체크리스트 항목이 너무 작고 여백이 과도. 한국어 요약이 분리되어 밑에 떨어져 있음.
- YussiSlide: 좋은 구조이지만 텍스트가 작고 상단 여백 과도.
- CtaSlide: 갈색 배경은 좋지만 "Read the full article"만 있고 빈 공간 과도.
- QuoteSlide: 가장 심각 — 중앙에 한 줄 텍스트만 있고 나머지 전부 비어있음.
- ContextSlide: WHY THIS MATTERS 텍스트가 너무 작고 빈 공간 과도.

**개선 방향:**

### CoverSlide
- 텍스트를 수직 중앙으로 올리기 (현재 하단 → 중앙-하단)
- 제목 font-size: 현재보다 20-30% 키우기
- 카테고리 배지: 반투명 → 갈색 solid background로 변경
- 배경: 단색 크림 → 미세한 그라데이션 또는 패턴 추가
- STORYPRESS 배지 제거 (INDEPENDENT 모드에서 불필요)
- "SWIPE →" 힌트를 하단에 더 눈에 띄게

### ContentSlide (포인트 슬라이드)
- 텍스트를 상단으로 올려서 여백 줄이기 (상단 패딩 줄이기)
- 번호(01) 크기 키우기 + 갈색 원형 배경
- 제목 font-size 키우기
- highlight 박스: 더 넓게 + 패딩 키우기 + 좌측 accent bar 두껍게
- 한국어 텍스트 크기 키우기 (현재 너무 작음)
- 하단 빈 공간 채우기: 관련 아이콘/이모지를 큰 사이즈로 배경 장식 또는 추가 컨텍스트

### SummarySlide
- 체크리스트 항목 font-size 키우기
- 각 항목 사이 간격 키우기 (현재 너무 빽빽하면서 동시에 전체는 작음)
- 한국어 요약을 영어 항목 바로 아래에 인라인으로 (분리하지 않기)
- 배경: 약간 다른 톤 (크림이 아닌 연한 warm grey)

### QuoteSlide
- 인용문 font-size 크게 키우기 (현재의 2배)
- 큰 인용 부호(") 장식 — 갈색, 큰 사이즈
- 배경: 연한 그라데이션 또는 미세 패턴
- 또는 이 슬라이드를 없애고 ContextSlide와 합치기

### CtaSlide
- "Read the full article" 외에 추가 텍스트: 캐러셀 제목 반복 + "Full guide at mhj.nz"
- "💾 Save · 📩 Share · ➕ Follow @mhj_nz" 텍스트 크기 키우기
- MHJ 로고 더 크게
- QR 코드 추가 고려 (www.mhj.nz)

### 전체 공통
- 모든 슬라이드의 상단/하단 여백 30-40% 줄이기
- 본문 텍스트 최소 font-size: 16px (현재 12-14px 추정 → 인스타에서 안 보임)
- 제목 텍스트 최소 font-size: 28px
- 배경색: 단순 크림(#FAF8F5)에서 → 슬라이드마다 미세한 변화 주기 (odd/even 교대 이미 있다면 대비를 더 강하게)
- 하단 "MHJ" 워터마크 + 페이지 번호: 현재 거의 안 보임 → opacity 높이기

**수정 대상 파일:**
```
components/carousel/slides/CoverSlide.tsx
components/carousel/slides/ContentSlide.tsx
components/carousel/slides/SummarySlide.tsx
components/carousel/slides/YussiSlide.tsx
components/carousel/slides/CtaSlide.tsx
components/carousel/slides/QuoteSlide.tsx
components/carousel/slides/ContextSlide.tsx
components/carousel/engine/CarouselRenderer.tsx (공통 스타일 있으면)
```

**검증:**
- Admin에서 INDEPENDENT 모드로 캐러셀 생성 → Download ZIP → 10장 모두 확인
- 각 슬라이드에서 빈 공간이 40% 이하인지 확인
- 인스타 피드 미리보기(1080×1080 crop)에서 제목이 읽히는지 확인

---

## 수정 대상 파일

| 파일 | 변경 |
|------|------|
| `app/(public)/page.tsx` | 섹션별 배경색 교대 + 섹션 라벨 accent bar |
| `app/globals.css` | 카드 그림자 + hover transition + 섹션 배경 클래스 |
| `components/NewsletterCTA.tsx` | 어두운 배경 반전 스타일 (variant prop 또는 전역) |
| `components/BlogCard.tsx` 또는 `PostCard.tsx` | 카드 그림자 추가 |
| `components/carousel/slides/*.tsx` | **7개 슬라이드 컴포넌트 전면 리디자인** |

**절대 수정 금지**: `components/carousel/*`, `app/mhj-desk/*`, `app/api/*`

---

## 디자인 규칙 (재확인)

- 인디고(#4F46E5) 절대 금지
- translateY hover 금지 — **box-shadow만** 사용
- saturate() 금지
- border-radius ≤ 12px (카드 6-8px)
- heading 72px cap
- 8px grid
- 신규 색상 추가 금지 — 기존 팔레트(#1A1A1A, #8A6B4F, #FAF8F5, #F5F0EA, #EDE9E3, #FEF3C7)만 사용
- 다크모드: 각 변경사항에 대해 dark mode 변수도 확인

---

## Antigravity QA 필수

이 작업은 **텍스트 프롬프트만으로 완료할 수 없습니다.**

1. Claude Code에서 코드 변경
2. Antigravity에서 localhost:3003 스크린샷
3. 비교 → 미세 조정
4. 반복

특히 섹션 배경색 교대, 카드 그림자 강도, CTA 반전 색감은 **실제 화면을 보면서** 조정해야 합니다.

---

## 테스트

1. `npm run build` 통과
2. 홈페이지 스크롤 시 섹션별 배경색 교대 확인
3. 카드 hover 시 그림자 변화 확인
4. Newsletter CTA 어두운 배경 + 흰 텍스트 확인
5. 섹션 라벨 accent bar 확인
6. 다크모드 전환 시 전체 정상
7. 모바일 375px 정상
8. 기존 DESIGN_RULES 위반 없음
