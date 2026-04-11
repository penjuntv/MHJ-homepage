# MHJ 캐러셀 디자인 스펙 v3
## 글로벌 스탠다드 기반 전면 재설계

*2026-04-10 리서치 + Satori 디버깅 결과 반영*
*docs/CAROUSEL_DESIGN_SPEC_V3.md 에 복사*

---

## v2 → v3 핵심 변경 요약

| 항목 | v2 | v3 | 근거 |
|------|-----|-----|------|
| 슬라이드 수 | 10장 | **7장** | 7-8장이 완독율 최적 |
| 구조 | Cover→Context→4Content→Summary→Yussi→Quote→CTA | **Cover → 5 Content → CTA** | 불필요한 팽창 제거 |
| 배경 | 5색 교대 (다크 3장) | **크림 #FAF8F5 통일, CTA만 다크** | 밝은 배경이 저장율 90%+ |
| 본문 | 26px | **40px, 1문장** | 모바일 실효 9px→14px |
| 제목 | 40px | **56px** | 모바일 실효 20px |
| 슬라이드당 정보 | 제목+본문+하이라이트+한국어 | **번호+제목+본문 1문장** | 1 slide = 1 idea |
| 한국어 | 매 슬라이드 | **CTA만** | 정보 과밀 해소 |
| 하이라이트 박스 | 매 콘텐츠 | **제거** | 본문 1문장이 곧 핵심 |
| 커버 요소 | 6개 | **2개 (숫자+제목)** | 시선 분산 제거 |

---

## 기본 사양

| 항목 | 값 |
|------|-----|
| 출력 크기 | **1080 × 1350 px** (4:5 portrait) |
| 렌더링 | Satori |
| 슬라이드 | **7장** |
| 폰트 | Playfair Display (제목) + Noto Sans KR (본문) |
| 안전 영역 | 양옆 80px, 상하 100px |

---

## Satori 수직 중앙 정렬 — 확정된 방법

디버깅 결과:
- test-A/B/C (단순 텍스트)에서는 justifyContent: 'center' 작동
- 복잡한 콘텐츠 (배지+제목+본문)에서는 내부 wrapper가 stretch되어 center 무효화

**해결법: 내부 wrapper div 없이, 모든 요소를 최외곽 flex container의 직접 자식으로 배치**

```tsx
// 모든 슬라이드 공통 패턴
<div style={{
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',      // 수평 중앙
  width: '100%',
  height: '100%',
  backgroundColor: '#FAF8F5',
  padding: '0 80px',          // 좌우만, 상하 패딩 없음!
  textAlign: 'center',
}}>
  {/* 모든 요소가 여기 직접 자식 — wrapper div 없음 */}
  <div style={{ fontSize: 56, ... }}>제목</div>
  <div style={{ fontSize: 40, ... }}>본문</div>
</div>
```

**⚠️ 절대 하지 말 것:**
- 콘텐츠를 감싸는 `<div style={{ display: 'flex', width: '100%' }}>` wrapper 넣기
- 상하 padding 넣기 (center가 깨짐)
- footer를 같은 flex flow에 넣기 (별도 position absolute)

---

## 7슬라이드 구조

```
Slide 1: COVER     — 다크 브라운 배경, 숫자 + 제목
Slide 2: CONTENT 1 — 크림 배경
Slide 3: CONTENT 2 — 크림 배경  
Slide 4: CONTENT 3 — 크림 배경
Slide 5: CONTENT 4 — 크림 배경
Slide 6: CONTENT 5 — 크림 배경 (5 things면 5개, 4 things면 4개 + 다른 구조)
Slide 7: CTA       — 다크 브라운 배경
```

---

## 슬라이드별 상세

### Slide 1: COVER

```
배경: #3D2E1F (다크 브라운) — 커버만 다크
정렬: 수직 수평 중앙

요소 (위에서 아래, 모두 textAlign center):

① 숫자: "5"
   Playfair Display 900, 120px, 색상 #C9A96E (골드)
   
② 제목: "things nobody tells you\nbefore NZ school"
   Playfair Display 700, 48px, 색상 #FAF8F5
   line-height: 1.3
   marginTop: 16

③ 하단 고정 (position absolute, bottom 40):
   좌: "MHJ" — 14px, #8A6B4F
   우: "01 / 7" — 14px, rgba(250,248,245,0.4)
   중앙: "SWIPE →" — 14px, rgba(250,248,245,0.5)

총 요소: 2개 (숫자 + 제목). 이게 전부.
카테고리 라벨, 서브타이틀, 한국어 — 전부 제거.
```

### Slide 2~6: CONTENT (5장)

```
배경: #FAF8F5 (크림) — 전부 통일
정렬: 수직 수평 중앙

요소 (위에서 아래, 모두 직접 자식):

① 번호: "1" ~ "5"
   Noto Sans KR 700, 80px, 색상 #C9A96E (골드)
   (원형 배지 아님 — 숫자만 크게)

② 제목: 1줄
   Playfair Display 700, 56px, 색상 #1A1A1A
   marginTop: 24
   
③ 본문: 1문장, 최대 20단어
   Noto Sans KR 400, 40px, 색상 #3D2E1F
   line-height: 1.5
   marginTop: 20

④ 하단 고정 (position absolute, bottom 40):
   좌: "MHJ" — 14px, #CBD5E1
   우: "02 / 7" ~ "06 / 7" — 14px, #CBD5E1

총 요소: 3개 (번호 + 제목 + 본문). 이게 전부.
하이라이트 박스 없음. 한국어 없음.
```

**콘텐츠 텍스트 예시 (v2 대비 축소):**

| v2 (과밀) | v3 (1 idea) |
|---------|-----------|
| 제목: "Your address decides your school" + 본문 2문장 + 하이라이트 + 한국어 | 제목: "Your address decides your school" + 본문: "Check the school zone before signing a rental." |
| 제목: "No hat, no play — seriously" + 본문 2문장 + 하이라이트 + 한국어 | 제목: "No hat, no play" + 본문: "Buy the hat first. Label it. Buy a spare." |
| 제목: "There are NO cafeterias" + 본문 2문장 + 하이라이트 + 한국어 | 제목: "There are NO cafeterias" + 본문: "Pack lunch every day. A thermos with warm rice is your best friend." |
| 제목: "ESOL is free" + 본문 2문장 + 하이라이트 + 한국어 | 제목: "ESOL is free" + 본문: "Your child is assessed automatically. No forms, no cost." |

### Slide 7: CTA

```
배경: #3D2E1F (다크 브라운)
정렬: 수직 수평 중앙

요소 (위에서 아래):

① 로고: "MHJ"
   Playfair Display 400, 48px, 색상 #C9A96E
   
② "my mairangi"
   Noto Sans KR 400, 16px, letter-spacing 3px, 색상 #C9A96E
   marginTop: 4

③ CTA: "Save this for later ✓"
   Noto Sans KR 700, 36px, 색상 #FAF8F5
   marginTop: 40

④ URL: "www.mhj.nz"
   Noto Sans KR 500, 32px, 색상 #C9A96E
   marginTop: 16
   
⑤ 소셜: "@mhj_nz"
   Noto Sans KR 400, 24px, 색상 rgba(250,248,245,0.5)
   marginTop: 12

⑥ 하단 고정: "07 / 7" — 14px
```

---

## 테스트용 JSON (v3 — 축소된 데이터)

```json
{
  "carousel_title": "5 things nobody tells you before NZ school",
  "carousel_points": [
    {
      "number": "1",
      "title": "Your address decides your school",
      "body": "Check the school zone before signing a rental."
    },
    {
      "number": "2",
      "title": "No hat, no play",
      "body": "Buy the hat first. Label it. Buy a spare."
    },
    {
      "number": "3",
      "title": "There are NO cafeterias",
      "body": "Pack lunch every day. A thermos with warm rice is your best friend."
    },
    {
      "number": "4",
      "title": "ESOL is free",
      "body": "Your child is assessed automatically. No forms, no cost."
    },
    {
      "number": "5",
      "title": "Stationery is provided",
      "body": "The school supplies everything. Don't buy a pencil case."
    }
  ]
}
```

---

## 모바일 가독성 검증표

| 요소 | 캔버스 px | 모바일 실효 (×0.36) | 글로벌 기준 |
|------|---------|----------------|----------|
| 커버 숫자 | 120px | 43px | ✅ 강한 앵커 |
| 커버 제목 | 48px | 17px | ✅ 충분 |
| 콘텐츠 번호 | 80px | 29px | ✅ 눈에 띔 |
| 콘텐츠 제목 | 56px | 20px | ✅ 헤드라인 |
| 콘텐츠 본문 | 40px | 14px | ✅ 최소 기준 충족 |
| CTA 텍스트 | 36px | 13px | ✅ OK |
| CTA URL | 32px | 12px | ✅ OK |
| footer | 14px | 5px | 의도적으로 작게 (장식) |

---

## Satori 호환 주의 (v2에서 이관)

### ✅ 사용 가능
- display: 'flex', flexDirection, justifyContent, alignItems
- width, height ('100%' 권장)
- padding (좌우만), margin
- backgroundColor, color, fontSize, fontWeight, fontFamily
- letterSpacing, lineHeight, textAlign
- borderRadius
- position: 'absolute' (document root 기준 — Satori 버그)

### ❌ 사용 금지
- box-shadow, text-shadow, transform
- gap (margin으로 대체)
- 내부 wrapper div에 width: '100%' + display: 'flex' (center 깨짐)
- 상하 padding (center 깨짐)

---

## 구현 우선순위

1. CoverSlide.tsx — 완전 재작성 (숫자+제목만)
2. ContentSlide.tsx — 완전 재작성 (번호+제목+본문 1문장)
3. CtaSlide.tsx — 재작성 (Save CTA)
4. render.tsx — 7슬라이드 구조로 변경
5. test-carousel.ts — v3 JSON 데이터 + 7장 출력

**Context, Summary, Yussi, Quote 슬라이드 — 이번 v3에서 사용 안 함.**
파일은 남겨두되 render에서 호출하지 않음.

**커밋:** `design: carousel v3 — 7 slides, 40px+ fonts, 1 idea per slide, cream background`
