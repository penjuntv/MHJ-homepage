# MHJ 캐러셀 디자인 스펙 v4
## 슬라이드별 레이아웃 변주 — 5번 레퍼런스 스타일 적용

*2026-04-10 PeNnY 레퍼런스 기반*
*docs/CAROUSEL_DESIGN_SPEC_V4.md 에 복사*

---

## 핵심 컨셉

**"7장이 각각 다른 레이아웃이지만 하나의 브랜드로 읽힌다"**

### 통일 요소 (모든 슬라이드 공통)
- 배경: **#FFFFFF 순백** (크림 아님 — 더 모던하고 선명)
- 폰트 패밀리: Playfair Display (세리프) + Noto Sans KR (산세리프)
- 텍스트 색상: #1A1A1A (본문) + #C9A96E (골드 포인트)
- 하단 footer: position absolute, bottom 40, "MHJ" 좌 + "0X / 7" 우, 14px #CBD5E1
- footer 위에 가는 수평선: 1px #E5E0D8, 좌80 우80, bottom 70

### 변주 요소 (슬라이드마다 다름)
- 텍스트 크기/배치/정렬
- 장식 요소 (원형, 점선, 수평선)
- 레이아웃 (중앙형, 좌정렬, 2컬럼, 리스트형)

---

## 7슬라이드 상세

### Slide 1: COVER — "킥" 슬라이드 (3번 레퍼런스 영감)

```
배경: #FFFFFF

중앙에 원형 프레임:
- 원: width 400, height 400, borderRadius 200
- 테두리: border 2px dashed #C9A96E (골드 점선)
- 원 안에:
  - "5" — Playfair Display 900, 160px, #C9A96E
  
원 아래:
- 제목: "things nobody tells you"
  Playfair Display 400 italic, 40px, #1A1A1A
  marginTop: 40
  
- "before NZ school"
  Playfair Display 700, 48px, #1A1A1A
  marginTop: 8

하단 footer + 수평선 + "SWIPE →" 중앙 14px #CBD5E1
```

**이 슬라이드가 스크롤을 멈추는 이유:**
- 골드 점선 원이 시각적 앵커
- "5"가 원 안에서 폭발적으로 큼
- 제목은 italic + bold 혼용으로 타이포 긴장감

### Slide 2: CONTENT 1 — 대형 타이포 좌정렬

```
배경: #FFFFFF
정렬: 좌정렬, 수직 중앙

번호: "01"
  Noto Sans KR 300, 80px, #C9A96E (골드, 가벼운 weight)

제목: "Your address decides\nyour school"
  Playfair Display 700, 52px, #1A1A1A
  marginTop: 16

구분선: width 60px, height 3px, #C9A96E
  marginTop: 24

본문: "Check the school zone\nbefore signing a rental."
  Noto Sans KR 400, 36px, #3D2E1F
  marginTop: 24
  line-height: 1.5

정렬: alignItems: 'flex-start' (좌정렬)
padding: '0 100px'
```

### Slide 3: CONTENT 2 — 중앙 원형 강조 (킥 변주)

```
배경: #FFFFFF
정렬: 수직 수평 중앙

상단: "02" — Noto Sans KR 300, 24px, #CBD5E1, letterSpacing 4px
  marginBottom: 32

중앙 원형 배경:
- 원: width 500, height 500, borderRadius 250
- backgroundColor: #FAF8F5 (연한 크림 — 순백과 미세 대비)
- 원 안에 (flex column center):
  - 제목: "No hat,\nno play"
    Playfair Display 700, 56px, #1A1A1A
    textAlign: center
  - 본문: "Buy the hat first.\nLabel it. Buy a spare."
    Noto Sans KR 400, 32px, #3D2E1F
    marginTop: 20
    textAlign: center
```

### Slide 4: CONTENT 3 — 리스트/메뉴판 스타일

```
배경: #FFFFFF
정렬: 좌정렬, 수직 중앙

상단 라벨: "WHAT TO KNOW"
  Noto Sans KR 700, 14px, letterSpacing 4px, #C9A96E
  marginBottom: 40

제목: "There are NO cafeterias"
  Playfair Display 700, 48px, #1A1A1A
  marginBottom: 32

리스트 (가로선으로 구분):
  "Pack lunch every day" — Noto Sans KR 400, 32px, #3D2E1F
  ─────────────── (1px #E5E0D8, width 100%)
  "No microwaves at school" — 32px
  ───────────────
  "Thermos with warm rice = hero" — 32px

각 항목 padding: 20px 0
alignItems: 'flex-start'
padding: '0 100px'
```

### Slide 5: CONTENT 4 — 대형 키워드 중앙

```
배경: #FFFFFF
정렬: 수직 수평 중앙

"04" — Noto Sans KR 300, 24px, #CBD5E1
  marginBottom: 24

키워드: "FREE"
  Playfair Display 900, 120px, #C9A96E (골드, 초대형)

서브: "ESOL is free"
  Noto Sans KR 700, 36px, #1A1A1A
  marginTop: 16

본문: "Your child is assessed automatically.\nNo forms, no cost."
  Noto Sans KR 400, 32px, #3D2E1F
  marginTop: 24
  textAlign: center
```

### Slide 6: CONTENT 5 — italic 인용 스타일

```
배경: #FFFFFF
정렬: 수직 수평 중앙

"05" — Noto Sans KR 300, 24px, #CBD5E1
  marginBottom: 40

큰 따옴표 장식: """
  Playfair Display 400, 120px, #E5E0D8 (매우 연한 회색)
  marginBottom: -20 (겹침 효과 — 안 되면 marginBottom 0)

인용문: "The school supplies\neverything."
  Playfair Display 400 italic, 48px, #1A1A1A
  textAlign: center
  line-height: 1.4

서브: "Don't buy a pencil case."
  Noto Sans KR 700, 36px, #3D2E1F
  marginTop: 24
```

### Slide 7: CTA — 다크 반전

```
배경: #1A1A1A (검정에 가까운 다크 — v3의 브라운보다 모던)

정렬: 수직 수평 중앙

로고: "MHJ"
  Playfair Display 400, 56px, #C9A96E

"my mairangi"
  Noto Sans KR 400, 14px, letterSpacing 4px, #C9A96E
  marginTop: 4

구분선: width 60px, height 1px, #C9A96E
  marginTop: 32

"Save this for later"
  Noto Sans KR 700, 32px, #FFFFFF
  marginTop: 32

"www.mhj.nz"
  Noto Sans KR 500, 28px, #C9A96E
  marginTop: 16

"@mhj_nz"
  Noto Sans KR 400, 20px, rgba(255,255,255,0.4)
  marginTop: 12
```

---

## Satori 구현 가이드

### 원형 프레임 (Slide 1, 3)
```tsx
<div style={{
  width: 400, height: 400, borderRadius: 200,
  border: '2px dashed #C9A96E',  // Slide 1: 점선
  // 또는
  backgroundColor: '#FAF8F5',    // Slide 3: 크림 채움
  display: 'flex', flexDirection: 'column',
  justifyContent: 'center', alignItems: 'center',
}}>
  <span style={{ fontSize: 160, color: '#C9A96E' }}>5</span>
</div>
```

### 구분선 (Slide 2, 4, 7)
```tsx
<div style={{
  width: 60, height: 3, backgroundColor: '#C9A96E',
  marginTop: 24,
}} />
// 또는 전폭 가는 선:
<div style={{
  width: '100%', height: 1, backgroundColor: '#E5E0D8',
  marginTop: 20, marginBottom: 20,
}} />
```

### footer 수평선 + 텍스트 (모든 슬라이드)
```tsx
{/* 수평선 */}
<div style={{
  position: 'absolute', bottom: 70, left: 80, right: 80,
  height: 1, backgroundColor: '#E5E0D8',
}} />
{/* footer 텍스트 */}
<div style={{
  position: 'absolute', bottom: 40, left: 80, right: 80,
  display: 'flex', justifyContent: 'space-between',
  fontSize: 14, color: '#CBD5E1',
}}>
  <span>MHJ</span>
  <span>01 / 7</span>
</div>
```

### 수직 중앙 (v3에서 확인된 방법)
```tsx
// 최외곽: 직접 자식만, wrapper div 없음
<div style={{
  display: 'flex', flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',  // 또는 'flex-start' (좌정렬 슬라이드)
  width: '100%', height: '100%',
  padding: '0 80px',     // 좌우만
  backgroundColor: '#FFFFFF',
  position: 'relative',
}}>
  {/* 콘텐츠 요소 — 직접 자식 */}
  {/* footer — absolute */}
</div>
```

**⚠️ Slide 1, 3의 원형 안에 텍스트:**
원형 div가 콘텐츠를 감싸는 wrapper가 됩니다. 이건 괜찮을 수 있지만,
만약 center가 깨지면 원형 div 자체를 직접 자식으로 놓고 그 안의 텍스트만 감쌉니다.
테스트로 확인.

---

## 모바일 가독성 (v3에서 확인됨, 동일 기준)

| 요소 | 캔버스 px | 모바일 실효 |
|------|---------|----------|
| 커버 "5" | 160 | 58px ✅ |
| 커버 제목 | 48 | 17px ✅ |
| 콘텐츠 번호 | 80 | 29px ✅ |
| 콘텐츠 제목 | 48~56 | 17~20px ✅ |
| 콘텐츠 본문 | 32~36 | 12~13px ✅ |
| "FREE" 키워드 | 120 | 43px ✅ |

---

## 구현 순서

각 슬라이드가 다른 레이아웃이므로 render.tsx에서 슬라이드 타입별로 분기하거나,
각 슬라이드를 별도 컴포넌트로 만들 수 있습니다.

**권장: render.tsx에서 슬라이드 인덱스별 분기**
```tsx
function renderSlide(index, data) {
  switch(index) {
    case 0: return <CoverSlideV4 data={data} />;
    case 1: return <ContentLeftAlign data={data.points[0]} index={1} />;
    case 2: return <ContentCircle data={data.points[1]} index={2} />;
    case 3: return <ContentList data={data.points[2]} index={3} />;
    case 4: return <ContentKeyword data={data.points[3]} index={4} />;
    case 5: return <ContentQuote data={data.points[4]} index={5} />;
    case 6: return <CtaSlideV4 />;
  }
}
```

또는 ContentSlide에 `variant` prop을 추가:
```tsx
<ContentSlide variant="left-align" ... />
<ContentSlide variant="circle" ... />
<ContentSlide variant="list" ... />
<ContentSlide variant="keyword" ... />
<ContentSlide variant="quote" ... />
```

**커밋:** `design: carousel v4 — unique layouts per slide, circle frames, typography contrast`
