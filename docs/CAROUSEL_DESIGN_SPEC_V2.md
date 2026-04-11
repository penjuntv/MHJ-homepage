# MHJ 캐러셀 디자인 스펙 v2
## Claude Code 구현 가이드 — Satori 호환

*2026-04-09 벤치마크 리서치 기반 확정*
*이 문서를 `docs/CAROUSEL_DESIGN_SPEC_V2.md`에 복사 후 Claude Code에서 참조*

---

## 기본 사양

| 항목 | 값 | 비고 |
|------|-----|------|
| 출력 크기 | 1080 × 1080 px | 인스타 정방형 (프로필 그리드 최적) |
| 렌더링 엔진 | Satori (SVG 변환) | CSS 제약 있음 — 아래 호환 섹션 참고 |
| 총 슬라이드 | 10장 | 8-10장이 인게이지먼트 스윗스팟 |
| 폰트 | Playfair Display (제목) + Noto Sans KR (본문) | MHJ 브랜드 서체 유지 |
| 텍스트 안전 영역 | 양옆 80px, 상하 80px | 60px 최소 → 80px로 여유 확보 |

---

## 색상 시스템 (슬라이드별 교대)

### 팔레트

```
--bg-warm:     #FAF8F5   (MHJ 크림)
--bg-brown:    #3D2E1F   (다크 브라운)
--bg-sage:     #E8EDE5   (세이지 그린, 연한)
--bg-clay:     #D4B896   (클레이/테라코타, 연한)
--bg-ivory:    #F5F0E8   (아이보리)

--text-dark:   #1A1A1A   (다크 배경 이외)
--text-light:  #FAF8F5   (다크 배경 위)
--text-muted:  #8A6B4F   (브라운 포인트)

--accent-gold: #C9A96E   (골드 포인트)
--accent-sage: #7A9B6D   (세이지 그린, 진한)
```

### 슬라이드별 배경 배치

| 슬라이드 | 타입 | 배경 | 텍스트 색상 |
|---------|------|------|-----------|
| 1 | Cover | `--bg-brown` | `--text-light` |
| 2 | Context | `--bg-warm` | `--text-dark` |
| 3~6 | Content (4장) | 교대: ivory → sage → ivory → clay | `--text-dark` |
| 7 | Summary | `--bg-brown` | `--text-light` |
| 8 | Yussi's Take | `--bg-sage` | `--text-dark` |
| 9 | Quote | `--bg-warm` | `--text-dark` |
| 10 | CTA | `--bg-brown` | `--text-light` |

**핵심 원칙: 같은 배경이 연속 3장 나오면 안 됨. 밝은/어두운이 교대해야 함.**

---

## 슬라이드별 상세 스펙

### 1. Cover Slide

```
배경: #3D2E1F (다크 브라운)
상단: 카테고리 라벨 — "NZ SCHOOL GUIDE" 
      Noto Sans KR 700, 14px, letter-spacing 4px, uppercase
      색상: #C9A96E (골드)
      
중앙: 제목 — 최대 10단어
      Playfair Display 700, 48px (최소 40px)
      색상: #FAF8F5
      line-height: 1.2
      text-align: center

하단: 서브타이틀 — 1줄
      Noto Sans KR 400, 18px
      색상: #C9A96E (골드)
      
최하단: "SWIPE →" 
       Noto Sans KR 500, 14px, letter-spacing 3px
       색상: rgba(250,248,245,0.6)

여백: 상80 좌80 우80 하60
콘텐츠 면적: 최소 55%
```

**Hook 패턴 (8-10 단어):**
- "5 things nobody tells you before NZ school"
- "The lunch box mistake every new parent makes"
- "What I wish I knew before our first school day"

### 2. Context Slide (문제 제기)

```
배경: #FAF8F5

상단: 에피소드 번호 원형 배지
      80×80 원형, 배경 #3D2E1F, 텍스트 #FAF8F5
      Noto Sans KR 700, 28px
      "01" ~ "05"

중앙: 본문 — 문제 상황 설명 (3~5줄)
      Noto Sans KR 400, 22px
      색상: #1A1A1A
      line-height: 1.6
      max-width: 800px (좌우 140px 마진)

하단: "Here's what we learned →"
      Noto Sans KR 500, 16px
      색상: #8A6B4F

여백: 상100 좌140 우140 하80
```

### 3~6. Content Slides (핵심 포인트 4장)

```
배경: 교대 (ivory → sage → ivory → clay)

구조 (위에서 아래):

① 번호 배지: 60×60 원형
   배경: #3D2E1F (또는 sage 배경일 때 #FAF8F5)
   텍스트: 반대색, Noto Sans KR 700, 24px

② 제목: 1줄
   Playfair Display 700, 32px (최소)
   색상: #1A1A1A
   margin-top: 24px

③ 본문: 2~4줄
   Noto Sans KR 400, 20px
   색상: #1A1A1A
   line-height: 1.6
   margin-top: 16px

④ 하이라이트 박스:
   배경: rgba(201,169,110,0.15) (골드 10~15% 투명)
   패딩: 20px 24px
   border-left: 4px solid #C9A96E
   margin-top: 24px

   하이라이트 텍스트:
   Noto Sans KR 700, 20px
   색상: #3D2E1F
   
⑤ 한국어 하이라이트:
   Noto Sans KR 400, 16px
   색상: #8A6B4F
   margin-top: 8px

여백: 상80 좌100 우100 하80
전체 콘텐츠 면적: 60% 이상
```

### 7. Summary Slide

```
배경: #3D2E1F

상단: "KEY TAKEAWAYS"
      Noto Sans KR 700, 14px, letter-spacing 4px
      색상: #C9A96E

중앙: 체크리스트 4~5항목
      각 항목:
        "✓" — Noto Sans KR 700, 24px, 색상 #C9A96E
        텍스트 — Noto Sans KR 500, 20px, 색상 #FAF8F5
        line-height: 1.5
        항목 간 간격: 20px

하단: 한국어 요약 (동일 구조, 18px, 색상 rgba(250,248,245,0.7))

여백: 상80 좌100 우100 하80
```

### 8. Yussi's Take Slide

```
배경: #E8EDE5 (세이지 그린)

상단: "YUSSI'S TAKE"
      Noto Sans KR 700, 14px, letter-spacing 4px
      색상: #7A9B6D (진한 세이지)

중앙: Yussi 코멘트
      Playfair Display 400 italic, 24px
      색상: #1A1A1A
      line-height: 1.5
      따옴표: 큰 따옴표 " 장식 — 72px, #7A9B6D, 상단 좌측

하단: 한국어 번역
      Noto Sans KR 400, 18px
      색상: #3D2E1F, opacity 0.7

여백: 상80 좌100 우100 하80
```

### 9. Quote Slide (선택적 — 통계 또는 인용)

```
배경: #FAF8F5

중앙: 큰 통계 숫자 또는 인용문
      숫자: Playfair Display 700, 72px, 색상 #C9A96E
      인용: Playfair Display 400 italic, 28px
      출처: Noto Sans KR 400, 14px, 색상 #8A6B4F

여백: 상160 좌120 우120 하160
콘텐츠 수직 중앙 정렬
```

### 10. CTA Slide

```
배경: #3D2E1F

구조 (위에서 아래):

① 로고: "MHJ" — Playfair Display 400, 36px, 색상 #C9A96E
   "my mairangi" — Noto Sans KR 400, 12px, letter-spacing 3px, 색상 #C9A96E

② 메인 CTA: "Read the full guide"
   Noto Sans KR 700, 28px, 색상 #FAF8F5

③ URL: "www.mhj.nz"
   Noto Sans KR 500, 22px, 색상 #C9A96E
   
④ 소셜: "@mhj_nz"
   Noto Sans KR 400, 18px, 색상 rgba(250,248,245,0.6)

⑤ 구독 CTA: "Subscribe to Mairangi Notes →"
   Noto Sans KR 400, 16px, 색상 #C9A96E

수직 중앙 정렬, 각 요소 간 간격 24px
여백: 전방향 80px
```

---

## Satori CSS 호환성 가이드

### ✅ 사용 가능
- `display: flex` (flexDirection, alignItems, justifyContent)
- `width`, `height`, `padding`, `margin`
- `backgroundColor`, `color`
- `fontSize`, `fontWeight`, `fontFamily`, `fontStyle`
- `letterSpacing`, `lineHeight`, `textAlign`
- `borderRadius`, `borderLeft`, `borderRight`, `borderTop`, `borderBottom`
- `opacity`
- `position: absolute/relative` (간단한 경우)
- `overflow: hidden`

### ❌ 사용 불가 / 주의
- `box-shadow` — Satori 미지원. 대비는 색상으로만 해결
- `background-image: linear-gradient()` — 제한적 지원. 단색 권장
- `transform` — 미지원
- `@media` queries — 미지원 (고정 1080×1080)
- `gap` (flex) — 일부 버전 미지원 → `margin`으로 대체
- `text-shadow` — 미지원
- 외부 이미지 URL — 지원되지만 로딩 실패 시 빈 공간
- SVG 내 복잡한 패스 — 간단한 것만

### 배경 변화 구현 방법
단색 배경 교대가 가장 안정적. 장식 요소가 필요하면:
- 큰 원형 `div`를 `position: absolute`로 배치 (배경색보다 약간 밝거나 어두운 톤)
- 좌상단/우하단 코너에 80~120px 원형 장식 (opacity 0.1~0.15)

---

## 현재 대비 변경 요약

| 항목 | AS-IS (30점) | TO-BE (70점 목표) |
|------|-------------|------------------|
| 커버 배경 | 크림 (#FAF8F5) | 다크 브라운 (#3D2E1F) |
| 커버 제목 크기 | ~24px | 48px |
| 콘텐츠 여백 | ~70% | ~40% (콘텐츠 60%+) |
| 배경 교대 | 크림 반복 | 5색 교대 (brown/warm/ivory/sage/clay) |
| 번호 표시 | 작은 텍스트 | 60px 원형 배지 |
| 하이라이트 | 없음 | 골드 보더 + 반투명 배경 박스 |
| CTA 슬라이드 | 크림 배경, 작은 텍스트 | 다크 브라운, 28px URL |
| 한국어 | 없음 또는 작음 | 각 슬라이드 하단에 16~18px |

---

## 구현 우선순위 (Claude Code)

1. `CoverSlide.tsx` — 다크 배경, 대형 제목, 골드 악센트
2. `ContentSlide.tsx` — 배경 교대, 원형 배지, 하이라이트 박스
3. `SummarySlide.tsx` — 다크 배경, 체크리스트
4. `CtaSlide.tsx` — 다크 배경, 대형 URL
5. `YussiSlide.tsx` — 세이지 배경, 이탤릭 인용
6. `QuoteSlide.tsx` / `ContextSlide.tsx` — 나머지
7. `CarouselRenderer.tsx` — 슬라이드 순서 + 배경색 매핑 로직

**커밋 메시지:** `design: carousel slides v2 — dark covers, 5-color rotation, bold typography, highlight boxes`
