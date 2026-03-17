# MHJ HOMEPAGE — DESIGN SYSTEM

> REFERENCE_DESIGN.jsx에서 추출한 디자인 토큰. 이 문서가 구현의 진실의 원천(Source of Truth).

---

## 1. 색상 체계 (Color Tokens)

### 기본 색상
| Token | 값 | 용도 |
|-------|-----|------|
| `--bg` | `#FFFFFF` | 페이지 배경, 모달 배경, 카드 배경 |
| `--text` | `#1A1A1A` | 기본 텍스트, 주요 제목 |
| `--text-secondary` | `#64748B` | 본문 텍스트, 설명 텍스트 (About, Intro 등) |
| `--text-tertiary` | `#CBD5E1` | 라벨, 날짜, 서브헤딩, placeholder 느낌의 연한 텍스트 |
| `--text-muted` | `#94A3B8` | 비활성 탭, 약한 텍스트 |
| `--accent` | `#4F46E5` | 인디고 강조색 — 매거진 월 라벨, AI Insight 버튼, Vision 라벨 |
| `--accent-light` | `#EEF2FF` | AI Insight 버튼 배경, AI Reflection 카드 배경 |
| `--accent-text` | `#818CF8` | 블로그 카테고리 라벨, 아티클 날짜/저자 텍스트 |
| `--accent-deep` | `#312E81` | AI Reflection 인용문 텍스트 |
| `--accent-pale` | `#A5B4FC` | AI Reflection 소제목 |
| `--accent-underline` | `#C7D2FE` | Intro 섹션 "JOURNAL" 밑줄 |
| `--accent-role` | `#6366F1` | About 페이지 역할(role) 텍스트 |
| `--surface` | `#F8FAFC` | 서피스/카드 배경 (필터 바, About 배경, CMS 입력필드) |
| `--border` | `#F1F5F9` | 보더, 구분선, 네비게이션 하단선 |
| `--border-light` | `#E2E8F0` | 버튼 보더 (Share, CMS) |
| `--black` | `#000000` | 푸터 배경, CTA 버튼 배경, CMS 아이콘 배경 |

### 오버레이 & 투명도
| 용도 | 값 |
|------|-----|
| 히어로 오버레이 | `rgba(0,0,0,0.4)` |
| 서가 spine 오버레이 | `rgba(0,0,0,0.6)` |
| 서가 active 오버레이 | `rgba(0,0,0,0.4)` |
| 블로그 카드 그라디언트 | `linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)` |
| Intro 이미지 그라디언트 | `linear-gradient(to top, rgba(0,0,0,0.6), transparent)` |
| 아티클 카드 오버레이 | `rgba(0,0,0,0.2)` → hover시 `transparent` |
| 모달 백드롭 | `rgba(255,255,255,0.4)` + `backdrop-filter: blur(40px)` |
| CMS 백드롭 | `rgba(0,0,0,0.6)` + `backdrop-filter: blur(12px)` |
| 네비게이션 배경 | `rgba(255,255,255,0.95)` + `backdrop-filter: blur(20px)` |
| 푸터 텍스트 투명도 | `rgba(255,255,255,0.4)` / `0.3` / `0.2` / `0.1` |
| 서가 Issue 라벨 배경 | `rgba(255,255,255,0.2)` + `backdrop-filter: blur(12px)` |

---

## 2. 타이포그래피 (Typography)

### 폰트 패밀리
- **Display**: `'Playfair Display', serif` — `.font-display` 클래스
- **Body**: `'Noto Sans KR', sans-serif` — 기본 (`*` 선택자)

### Playfair Display 사용처 (font-display)
| 용도 | weight | italic | 예시 |
|------|--------|--------|------|
| 히어로 제목 | 900 | no | "마이랑이 마켓의 아보카도" |
| 모달 대형 제목 | 900 | no | 상세 글 제목 |
| Intro "JOURNAL" | 300 | italic | Landing 인트로 섹션 |
| About "DAUGHTERS" | 300 | italic | About 멤버 섹션 |
| Blog "The Library" | 900 | italic | Blog 페이지 헤딩 |
| Intro 이미지 텍스트 | 900 | italic | "Start to Glow" |
| AI Reflection 인용문 | — | italic | AI 감상평 텍스트 |

### Noto Sans KR weight별 용도
| Weight | 용도 |
|--------|------|
| 400 | (사용 안 함 — 최소 500) |
| 500 | 본문 텍스트, 설명 텍스트, CMS textarea |
| 700 | 라벨, 푸터 링크, 날짜/카테고리, 푸터 연락처 |
| 900 | 제목, 네비게이션, 버튼, 서브헤딩, 대부분의 UI 라벨 |

### Typography Scale (5단계 — CSS 변수, 2026.03 정의)

| 단계 | CSS 변수 | 값 | 용도 | 클래스 |
|------|---------|-----|------|--------|
| **Display** | `--fs-display` | `clamp(56px, 8vw, 96px)` | 페이지 타이틀 ("The Library", "START TO GLOW") | `.type-display` — fw900, ls-3px, lh0.85 |
| **H1** | `--fs-h1` | `clamp(36px, 5vw, 56px)` | 섹션 타이틀 ("Reader Favorites", "Explore Our Content") | `.type-h1` — fw900, ls-2px, lh0.9 |
| **H2** | `--fs-h2` | `clamp(24px, 3vw, 36px)` | 카드 제목, 아티클 제목, 멤버 이름 | `.type-h2` — fw900, ls-1px, lh1.1 |
| **Body** | `--fs-body` | `clamp(16px, 1.5vw, 18px)` | 본문 텍스트, 설명 텍스트 | `.type-body` — fw500, lh1.6 |
| **Caption** | `--fs-caption` | `11px` | 날짜·카테고리·저자·라벨 | `.type-caption` — fw900, ls3px, uppercase |

> ⚠️ 새 텍스트 요소 추가 시 반드시 이 5단계 중 하나를 사용할 것.
> 매거진 에디터(`/admin`) 폰트는 예외 — 본문 13px, 제목 24px 고정.

### font-size 패턴 (큰 → 작은)
| 크기 | 용도 |
|------|------|
| `clamp(48px, 8vw, 140px)` | 드롭캡 첫 글자 |
| `clamp(48px, 8vw, 120px)` | 모달 대형 제목 |
| `clamp(56px, 8vw, 112px)` | Blog "The Library" |
| `clamp(48px, 8vw, 112px)` | Magazine Issue 제목 |
| `clamp(48px, 8vw, 96px)` | About "START TO GLOW" |
| `clamp(40px, 10vw, 160px)` | 히어로 캐러셀 제목 |
| `clamp(40px, 6vw, 72px)` | Intro "MAIRANGI" |
| `clamp(36px, 5vw, 56px)` | About "THE THREE" |
| `clamp(32px, 5vw, 72px)` | 서가 Cover 제목 |
| `clamp(32px, 4vw, 48px)` | Intro 이미지 "Start to Glow" |
| `clamp(24px, 3vw, 44px)` | 블로그 카드 제목 |
| `clamp(20px, 3vw, 36px)` | 모달 저자 이름 |
| `clamp(18px, 3vw, 40px)` | 모달 본문 |
| `clamp(18px, 3vw, 32px)` | AI Reflection 텍스트 |
| `clamp(18px, 2vw, 24px)` | Intro/About 설명 텍스트, About 링크 카드 |
| `clamp(16px, 2vw, 24px)` | Blog 설명 텍스트 |
| `clamp(10px, 1.5vw, 14px)` | 히어로 "Featured Story" |
| `clamp(10px, 1.2vw, 12px)` | 히어로 "Discover More" |
| 28px | About 멤버 이름, 아티클 카드 제목, Footer 브랜드 |
| 24px | Featured Editor 이름, Magazine Issue Editor |
| 22px | CMS 모달 제목 |
| 20px | 네비게이션 브랜드 "MY MAIRANGI" |
| 18px | Intro 이미지 설명 |
| 14px | 셀프 라벨 (Magazine Shelf, Edition 등), 본문, 푸터 링크/연락처 |
| 12px | 모달 날짜/카테고리, Vision 라벨, AI Insight 버튼, CMS 이미지 입력 |
| 11px | 네비게이션 메뉴, 서가 spine 연도, 필터 버튼, Open Edition, 서가 Scroll hint |
| 10px | Intro "Our Story" 라벨, AI Reflection 소제목, CMS 섹션 제목, 푸터 하단 |
| 9px | 블로그 카드 날짜/카테고리, 아티클 날짜/저자 |
| 8px | 네비게이션 "Family Archive" 부제목 |

### letter-spacing 패턴
| 값 | 용도 |
|-----|------|
| -4px | 히어로 대형 제목 |
| -3px | 대형 제목들 (About, Magazine Issue, Intro "MAIRANGI") |
| -2px | 중형 제목 (About "THE THREE", 서가 Cover, Intro "JOURNAL", CMS 제목) |
| -1px | 소형 제목 (네비게이션 브랜드, 카드 제목들, About 멤버 이름, AI Insight 버튼) |
| -0.5px | AI Insight 버튼 |
| 3px | 네비게이션 메뉴, 필터 버튼, CMS 섹션 제목, Intro "Our Story", AI Reflection 소제목, 서가 spine 연도 |
| 4px | 네비게이션 "Family Archive", 푸터 섹션 라벨, AI Reflection 소제목 |
| 5px | 각종 섹션 라벨 ("Magazine Shelf", "Edition", 모달 날짜, 블로그 카드 날짜, About "The Members", Open Edition) |
| 6px | Vision 라벨 ("Vision & Values"), About "The Members" |
| 8px | 히어로 "Featured Story" |

### text-transform: uppercase 적용 대상
거의 모든 라벨, 제목, 버튼, 네비게이션 메뉴에 적용. 본문 텍스트와 한국어 설명문만 제외.

### line-height 패턴
| 값 | 용도 |
|-----|------|
| 0.8 | 대형 타이포 제목 (히어로, 모달, 서가 Cover) |
| 0.85 | 중형 제목 (About, Blog Library, Intro) |
| 0.9 | 블로그 카드 제목 |
| 1.0 | About "THE THREE" |
| 1.4 | AI Reflection 인용문 |
| 1.5 | 모달 본문 |
| 1.6 | 설명 텍스트, 푸터 설명 |
| 1.7 | About 멤버 바이오 |
| 1.8 | 푸터 설명 |

---

## 3. 공간과 레이아웃 (Spacing & Layout)

### ⚠️ 8px 그리드 시스템 (2026.03 기준 — 최우선 원칙)

**CSS 변수 (`:root`):**
```css
--section-v:   clamp(64px, 8vw, 96px)   /* 섹션 수직 패딩 */
--section-h:   clamp(24px, 4vw, 80px)   /* 섹션 수평 패딩 */
--content-max: 1280px                    /* 최대 콘텐츠 폭 */
--text-max:    720px                     /* 본문 텍스트 최대 폭 */
--card-radius: 24px                      /* 카드 기본 radius */
--card-pad:    clamp(16px, 2vw, 24px)   /* 카드 내부 패딩 */
```

**비례 원칙:**
- 히어로: 80~85vh (가장 큼)
- 일반 섹션: 50~70vh 이하
- 보조 섹션 (Explore, Latest Issues): 히어로의 40~60%
- 카드: 화면 높이의 50% 이하

**간격 단위:** 8의 배수 (8, 16, 24, 32, 48, 64, 96px)
**섹션 간격 (데스크탑):** 64~96px | **모바일:** 48~64px

### 섹션 padding
| 패턴 | 사용처 |
|------|--------|
| `var(--section-v) var(--section-h)` | **표준** — 모든 신규 섹션 |
| `clamp(64px, 8vw, 96px) clamp(24px, 4vw, 80px)` | 동등 표기 |
| `clamp(40px, 8vw, 128px) clamp(24px, 4vw, 40px)` | Landing Intro (레거시) |
| `clamp(60px, 10vw, 128px) clamp(24px, 4vw, 40px)` | About Vision (레거시) |
| `96px 32px` (모바일) / `96px 96px` (데스크톱) | 모달 내부 |
| `40px 24px` | Magazine Shelf 헤더 |
| `96px 40px` | 푸터 |

### border-radius
| 값 | 사용처 |
|-----|--------|
| 999px (pill) | 버튼(CTA, 필터, AI Insight, Close), 아이콘 버튼, 서가 Issue 라벨 |
| 50% | 원형 아이콘 버튼 (Instagram, Mail, Share, Arrow) |
| 48px | About 프로필 이미지 |
| 40px | Landing Intro 이미지, About 멤버 이미지, 블로그 카드 |
| 32px | 아티클 카드 이미지, 모달 이미지(21:9), AI Reflection 카드, CMS 모달, Magazine Issue Editor 카드 |
| 24px | Intro About 링크 카드, 필터 바 컨테이너 |
| 16px | 필터 개별 버튼, CMS 입력 필드, CMS 아이콘 |
| 2px | 서가 spine 월 라벨 배경 |

### 그리드 패턴
| 패턴 | 사용처 |
|------|--------|
| `repeat(auto-fit, minmax(min(400px, 100%), 1fr))` | Landing Intro 2컬럼 |
| `repeat(auto-fit, minmax(min(320px, 100%), 1fr))` | About Vision 2컬럼 |
| `repeat(auto-fit, minmax(min(280px, 100%), 1fr))` | About Members 3컬럼 |
| `repeat(auto-fill, minmax(min(300px, 100%), 1fr))` | Magazine Issue 아티클 |
| `repeat(auto-fill, minmax(min(320px, 100%), 1fr))` | Blog Library 카드 |
| `repeat(auto-fit, minmax(240px, 1fr))` | 푸터 3컬럼 |

### 주요 gap 값
| 값 | 사용처 |
|-----|--------|
| 80px | Landing Intro 그리드, 푸터 그리드, About Vision 그리드 |
| 64px | About Members 그리드 |
| 48px | Magazine Issue 아티클 그리드, 헤더-콘텐츠 간격 |
| 40px | Blog Library 카드 그리드, 네비게이션 메뉴 간격 |
| 32px | 푸터 하단 flex, 모달 하단 flex |
| 24px | 모바일 메뉴, About Vision 내부, 히어로 컨트롤 |
| 16px | 각종 flex 간격 (라벨, 버튼 내부, 블로그 카드 메타) |
| 12px | CMS 입력필드, 네비게이션 아이콘 |
| 8px | 히어로 인디케이터, 필터 버튼, 캐러셀 버튼 |

### aspect-ratio 패턴
| 비율 | 사용처 |
|------|--------|
| 4/5 | Landing Intro 이미지, About 멤버 프로필 |
| 3/4 | About Vision 이미지, 아티클 카드 이미지 |
| 1/1 (정사각형) | 블로그 카드 |
| 21/9 | 모달 하단 이미지 |

### 히어로 캐러셀
- 높이: `85vh`
- 콘텐츠 padding: `0 8%`
- 하단 컨트롤: `bottom: 48px, left: 8%`

### 서가 (Magazine Shelf)
- 컨테이너 높이: `60vh`
- 좌우 padding: `0 8vw`
- Spine 너비: `clamp(80px, 8vw, 120px)`
- Cover 너비: `clamp(300px, 40vw, 520px)`
- 아이템 간 구분: `borderRight: 1px solid rgba(241,245,249,0.3)`
- 배경: `#1a1a1a`

---

## 4. 애니메이션과 인터랙션 (Animation & Interaction)

### transition 속도별 용도
| 속도 | easing | 용도 |
|------|--------|------|
| 0.2s | — | CMS 버튼 hover |
| 0.3s | — (기본 ease) | 대부분의 hover 효과 (색상, 보더, 배경, 버튼 transform) |
| 0.4s | — | 히어로 인디케이터 너비 |
| 0.5s | — | 서가 spine opacity/scale, 아티클 카드 컨테이너 |
| 0.6s | cubic-bezier(0.16, 1, 0.3, 1) | vivid-hover filter 전환 |
| 0.7s | — | 서가 Cover content 전환 (opacity, translateY), 블로그 카드 hover, About 멤버 이미지 |
| 0.8s | cubic-bezier(0.16, 1, 0.3, 1) | **서가 width 전환** (핵심!) |
| 1.0s | ease | 히어로 캐러셀 opacity, About 프로필 grayscale |

### cubic-bezier(0.16, 1, 0.3, 1) 사용처
- 서가 아이템 width 전환 (magazine-item)
- vivid-hover filter 전환
- slide-right 모달 등장 애니메이션
- slideUp 키프레임 애니메이션 (암시적)

### hover 효과 패턴

#### 1. translateY + shadow 강화
```
기본: transform: none, box-shadow: 0 15px 40px rgba(0,0,0,0.08)
hover: transform: translateY(-16px), box-shadow: 0 30px 60px rgba(0,0,0,0.15)
적용: 아티클 카드, 블로그 카드
```

#### 2. filter saturate 강화 (vivid-hover)
```
기본: filter: saturate(1.2) contrast(1.05)
hover: filter: saturate(2.2) contrast(1.1) brightness(1.05)
적용: Landing Intro 이미지, 아티클 카드 이미지
```

#### 3. grayscale → color (About 프로필)
```
기본: filter: grayscale(100%)
hover: filter: grayscale(0%)
transition: 1s
```

#### 4. 서가 width 확장
```
기본: width: clamp(80px, 8vw, 120px) — spine 표시
hover: width: clamp(300px, 40vw, 520px) — cover 표시
+ 내부 spine opacity: 1→0, cover opacity: 0→1 (크로스페이드)
```

#### 5. 버튼 scale
```
hover: transform: scale(1.1) — CMS 플로팅 버튼
```

### 키프레임 애니메이션
| 이름 | 효과 | duration | easing |
|------|------|----------|--------|
| fadeIn | opacity: 0→1 | 0.8s | ease-out |
| slideUp | opacity: 0→1, translateY: 30px→0 | 0.7s | ease-out |
| slideRight | opacity: 0→1, translateX: 100%→0 | 0.7s | cubic-bezier(0.16, 1, 0.3, 1) |
| zoomIn | opacity: 0→1, scale: 0.95→1 | 0.5s | ease-out |
| spin | rotate: 0→360deg | 1s | linear (infinite) |

### stagger 패턴
- `.stagger-1`: animation-delay: 0.1s
- `.stagger-2`: animation-delay: 0.2s
- `.stagger-3`: animation-delay: 0.3s
- `.stagger-4`: animation-delay: 0.4s
- 적용: About 멤버 카드, 아티클 카드, 블로그 카드
- 최대 stagger: `Math.min(i + 1, 4)` — 4개까지만

### 서가 마우스 휠 → 가로 스크롤
```js
el.addEventListener('wheel', (e) => {
  e.preventDefault();
  el.scrollLeft += e.deltaY;
}, { passive: false });
```

### 히어로 캐러셀 자동재생
- 6초 간격 (`setInterval 6000`)
- opacity 1s ease 전환
- 이전/다음 버튼 + 인디케이터 도트 (active: 48px, inactive: 32px)

---

## 5. 특수 효과 (Special Effects)

### 드롭캡 (모달 본문)
```css
첫 글자: fontSize clamp(48px, 8vw, 140px), fontWeight 900, float left,
         marginRight 16px, lineHeight 0.8, color #f1f5f9
나머지: fontSize clamp(18px, 3vw, 40px), fontWeight 500, lineHeight 1.5
```

### 세로 텍스트 (서가 spine)
```css
.vertical-text {
  writing-mode: vertical-rl;
  text-orientation: mixed;
}
```

### backdrop-filter 사용처
| blur 값 | 사용처 |
|---------|--------|
| blur(40px) | 모달 백드롭 |
| blur(20px) | 네비게이션 |
| blur(12px) | CMS 백드롭, 서가 Issue 라벨 |

### 그림자 패턴
| 값 | 사용처 |
|-----|--------|
| `0 25px 60px rgba(0,0,0,0.12)` | Intro 이미지, About Vision 이미지, 모달 이미지 |
| `0 30px 80px rgba(0,0,0,0.12)` | About Vision 이미지 |
| `0 15px 40px rgba(0,0,0,0.08)` | 아티클 카드, About 멤버 이미지 |
| `0 30px 60px rgba(0,0,0,0.15)` | hover 시 카드 |
| `0 4px 12px rgba(0,0,0,0.04)` | 블로그 카드 기본 |
| `0 10px 30px rgba(0,0,0,0.2)` | 활성 필터 버튼 |
| `0 10px 40px rgba(0,0,0,0.3)` | CMS 플로팅 버튼 |
| `0 10px 30px rgba(0,0,0,0.2)` | CTA 버튼 ("Like this Archive") |
| `-20px 0 60px rgba(0,0,0,0.08)` | 모달 패널 좌측 그림자 |
| `0 25px 60px rgba(0,0,0,0.2)` | CMS 모달 |
| `0 4px 20px rgba(0,0,0,0.5)` (textShadow) | 서가 spine 제목 |
| `0 4px 30px rgba(0,0,0,0.4)` (textShadow) | 서가 Cover 제목 |

---

## 6. 반응형 브레이크포인트

### 768px (모바일/데스크톱 전환)
- 네비게이션: 데스크톱 메뉴 숨김 → 햄버거 메뉴 표시
- 모달 내부 패딩: 32px → 96px

### 그리드 자동 반응형
- `auto-fit` / `auto-fill` + `minmax(min(Xpx, 100%), 1fr)` 패턴으로 자연스러운 반응형
- `min()` 함수로 모바일에서 단일 컬럼 보장

### clamp() 반응형
- 모든 주요 폰트 사이즈, 패딩에 clamp() 사용
- 뷰포트 기반 유동적 스케일링
