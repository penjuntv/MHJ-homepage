# MHJ 디자인 업그레이드 기획안 (2026-11-03)

> 작성: MHJ 자가검증 세션(Claude). 근거: 같은 폴더의 STEP 1~4 문서와 조사서 [AI 티 없는 디자인](https://claude.ai/artifact/KaBasm5q5VJ4Ja6zooqbUJ). 틀: [StoryPress 기획안](https://claude.ai/artifact/SsXjvYj2wTCRKmbXWn3d2W).
> 읽기용 페이지(Artifact, 비공개): https://claude.ai/artifact/7v3TxY6y5dHexDMGLrAzt3 — 원본 `plan-page/index.html`
> **계획 문서다.** 이번 작업에서 화면 코드 변경은 0이다(`git diff --stat -- app components` = 0). 반영은 PeNnY 결재 뒤 단계별 지시로 한다. push 0.

## 한 줄 요약

**사진과 가족 이야기는 그대로 주인공으로 두고, 그 위에 덧씌운 "기본값처럼 보이는 꾸밈" 세 가지를 걷어 낸다.** 세 가지는 Tailwind 인디고·보라, 자간 넓은 대문자 꼬리표, 가운뎃점 메타 문구다. 그 전에 방문자에게 웹폰트가 아예 안 내려가는 회귀(M0)부터 고친다.

---

## PeNnY가 정할 것 (결정마다 추천 1개)

| # | 결정 | 고를 것 | **추천** | 이유 |
|---|---|---|---|---|
| D1 | 시안 | A 현행 / B(강조색 그린 + 홈 h1 문장형 + 메타 대문자·가운뎃점 제거) | **B** | 같은 CDP 방식으로 검사하면 홈 44→14, 블로그 37→27건. DOM 의 인디고·대문자·가운뎃점이 3페이지 모두 0이 된다. 판별표 해당 축은 3→1. **단, 5초 테스트 응답은 0건이다.** 사람 3명 이상의 응답에서 B 가 "무엇을 하는 곳인가"를 A 보다 덜 맞히지 않을 때 M1 에 착수한다 |
| D2 | 다크 모드 강조색 | `#8FB39B`(브랜드 그린의 명도만 올린 파생값) / `#C9A882`(브랜드 키트 Brown Dark) | **`#8FB39B`** | 라이트 `#3E5F4A` 와 같은 색상·채도라 "링크·누를 곳 = 초록"이 두 테마에서 같다. 다크 면 명암비 8.57 / 7.95 / 7.22. `#C9A882` 는 이미 로고·Most Read 번호 색이라 장식과 누를 곳이 구분되지 않는다. 승인하면 `mhj-brand-kit/BRAND_GUIDE.md` 색 표에 "Green Light `#8FB39B` — 다크 모드 링크" 한 줄을 더한다 |
| D3 | 사이트 규칙서 개정 | 개정 / 유지 | **개정(D1=B 일 때)** | 지금 화면은 `DESIGN_RULES.md` §6.4("인디고는 AI Insight·인터랙티브 요소에만")와 §5.2("라벨 = uppercase·자간 2px")를 **지키고 있다.** 시안 B 는 위반을 고치는 안이 아니라 규칙을 바꾸는 안이라, 규칙서를 먼저 고쳐야 다음 세션들이 되돌리지 않는다. 문구 초안은 아래 "규칙서 개정 초안" |
| D4 | 본문 서체 | Noto Sans KR 유지(M0 로 복구) / IBM Plex Sans KR / Source Serif 4 + Noto Serif KR | **Noto Sans KR 유지** | 지금 방문자는 Noto 가 아니라 시스템 글꼴을 본다(M0). M0 만 고치면 규칙서가 정한 글꼴이 처음으로 보인다. Noto Sans KR 은 과사용 글꼴 목록(Inter·Roboto·Fraunces·Geist·Plus Jakarta Sans·Space Grotesk)에 없다. 코드가 쓰는 400~900 굵기가 모두 있고, 전송량은 IBM Plex 와 같은 급이다. AI 티는 본문 서체가 아니라 라벨·색에 있었다(STEP 1). "대담함은 한 곳에만" — 바꿀 곳은 라벨이다 |
| D5 | 다크 바탕 `#0A0A0A` | 유지 / 따뜻한 근흑으로 | **유지** | 공식 스킬이 꼽은 신호는 "근흑 + 형광 강조 하나"라는 조합이다. MHJ 다크에는 형광 강조가 없고, B 에서 강조색이 차분한 그린이 되면 조합이 성립하지 않는다. 바꾸면 다크 전 화면 명암 재검증이 필요한데, 얻는 것이 적다 |
| D6 | 기사 제목 Playfair 900 이탤릭 | 유지 / 정체(roman)로 | **유지** | 검사기 지적은 섹션 제목 1건("You Might Also Like")뿐이다. 홈 기사 제목의 이탤릭은 사진 다음으로 MHJ 를 알아보게 하는 얼굴이다. 섹션 제목 h2 의 이탤릭만 M3 에서 따로 본다 |
| D7 | 원문이 대문자인 꼬리표 "FROM OUR GALLERY"·"Continue Reading"·"Join the conversation" | 문장형으로 바꾸기 / 꼬리표 삭제 | **삭제** | 바로 아래 h2("@MHJ Family on Instagram"·"You Might Also Like"·"Comments (2)")가 같은 말을 한다. Impeccable 은 제목 위 꼬리표를 "의뢰서로도 못 되살리는" 금지로 둔다. 대문자 변환이 아니라 원문 글자라 B 목업에서도 남았다 |

**5초 테스트**: 페이지 https://claude.ai/artifact/9VzcuqfMSaiJNpSF4JXZJB , **응답 0건(사람 검증 대기)**. 진행은 PeNnY 몫이다.

---

## 자가검증 결과 요약 (숫자)

### 기계 검사 — Impeccable 4.8.0 (STEP 1, URL 모드, 페이지당 1회)
- **홈 43건, 블로그 상세 40건, 합 83건.**
  - 판정: 진짜 문제 77 · 디자인 범위 밖 1(본문 줄표 25개) · 의도된 선택 5("my mairangi" 로고 문구 10px, Playfair 이탤릭 섹션 제목) · **오탐 0**
  - 큰 덩어리: 10px 라벨 46건(규칙서 §5.2 하한 11px 보다 작음), 블로그 본문 한 줄 96~103자 16건, 제목 위 꼬리표 4건, 본문 안내 상자 명암 2.4:1 2건.
- **검사기가 못 보는 것**: 규칙 62개 안에 "대문자 h1"·"가운뎃점 메타"·"Tailwind 인디고"를 잡는 규칙이 없다. 그래서 아래 DOM 숫자가 근거다.

### DOM 계산값 (STEP 1, 1280, 홈 / 블로그 / 매거진)
- 홈 h1 = **12px·900·대문자·자간 2px·회색** 문장. 사이트가 무엇인지 말하는 유일한 문장이 가장 작고 옅다.
- 대문자 요소 **59 / 49 / 43**. 모두 넓은 자간이다.
- 보이는 가운뎃점 문구 **16 / 2 / 6**("LIFE IN AOTEAROA · 30 OCT 2026", "by Yussi · 10 views · 2 Comments").
- 화면에 칠해진 인디고 요소는 **1 / 7 / 1** 뿐이다(포커스 테두리, AI Insight, 본문 링크). 브라운·그린은 21 / 11 / 10.
  인디고는 면적이 아니라 "누를 곳의 색이 Tailwind 기본값"이라는 점이 문제다.
- **AI Insight 버튼에 보라 그라데이션**이 있다. 라이트는 `#EEF2FF→#F5F3FF`, 다크는 `rgba(109,40,217)`·`rgba(147,51,234)` 다(STEP 2). 사이트에서 "AI" 이름이 붙은 유일한 버튼에 대표적인 AI 신호가 붙어 있다.

### 판별표 5축 (조사서 "AI 티 판별표")

| 축 | A 현행 | B 시안 |
|---|---|---|
| 색과 바탕 | 해당(약) | 비해당 |
| 글자 | **해당** | 해당(약) — Playfair 굵은 이탤릭, M0 |
| 구조와 장식 | 해당(일부) | 비해당 |
| 움직임 | 비해당 | 비해당 |
| 글과 증거 | 비해당 | 비해당 |

### 전수표 (STEP 2, `app`·`components`, 관리자 제외, 행 수 = grep 건수)
- 인디고·보라 **67행**(공개 화면 46, 교체 대상 42)
- 브라운·그린 **75행**(전부 유지)
- 대문자 **217행**(공개 153)
- 가운뎃점 **79행**(화면 문구 23)

### 시안 B 목업 (STEP 3)
- 검사기(같은 CDP 방식): **홈 44 → 14, 블로그 37 → 27.**
- DOM: 인디고 0, 대문자 0, 가운뎃점 0(3페이지 × 라이트·다크).
- B 에서 새로 생긴 2건(FAQ 제목 넓은 자간·11px)은 목업 CSS 의 누락이다. M2 에 넣는다.

### 새로 찾은 것 — 방문자에게 웹폰트가 안 내려간다 (M0)
- 빌드된 CSS 에서 `next/font` Inter 규칙이 Google Fonts `@import` 보다 앞에 놓여, 브라우저가 `@import` 를 버린다.
- 그 결과 Noto Sans KR 은 한 번도 그려지지 않는다. Playfair 는 그 글꼴을 깐 기기에서만 보이고, 나머지 방문자는 기본 serif(Times 계열)를 본다. 증거: `evidence/blog-1280-light-visitor.png`.
- 이번 캡처 A·B 는 Playfair 가 설치된 Mac 기준이다. 비교는 공정하지만, 일반 방문자 화면은 이보다 못하다.

---

## 지금 홈이 주는 인상

- **AI 기본값으로 읽히는 것**
  - 사이트 정체성 문장이 12px 회색 대문자 꼬리표다.
  - 기사마다 "LIFE IN AOTEAROA · 30 OCT 2026" 대문자+가운뎃점 메타가 붙는다.
  - "FROM OUR GALLERY" 같은 꼬리표가 h2 위에 붙는다.
  - 블로그의 AI Insight 버튼은 사이트 어디에도 없는 라벤더 보라 알약이다(다크 모드에서도 연보라 그대로).
- **이미 MHJ 만 가진 것**: 가족이 직접 찍은 사진이 첫 화면의 주인공이다(생일 케이크, 마이랑이 해변, K-Beat 무대). 브랜드 키트의 브라운 워드마크와 "my mairangi" 문구, Playfair 기사 제목도 있다.
  다른 사이트가 흉내 낼 수 없는 재료이고, 이번 기획은 이것을 건드리지 않는다.
- 비교 이미지: `pairs/pair-home-1280-light.jpg` 외 8장.

---

## 업그레이드 단계

각 단계는 **시안 확인 → PeNnY 결재 → 구현 → 3폭 × 2테마 전후 캡처 → `/code-review`·`/verify` → push 결재** 순으로 간다. 단계마다 수정 파일은 5개 이하다.

### M0 — 웹폰트 회귀 수정 (선행, 별도 세션에서 진행 중)
- 상태: 세션 "라이브 웹폰트 미로드 회귀 수정"이 [penjuntv/MHJ-homepage#179](https://github.com/penjuntv/MHJ-homepage/pull/179) 를 열었다(머지 전).
- 성공 기준:
  - 라이브에서 `fonts.gstatic.com` 요청이 생긴다.
  - CDP `getPlatformFontsForNode` 로 본문이 Noto Sans KR(`isCustomFont:true`), 제목이 Playfair(`isCustomFont:true`)로 그려진다.
  - 3폭 캡처.
- M1 전후 비교 캡처는 **M0 배포 뒤 새 기준선**으로 다시 찍는다. 글꼴 변화가 시안 효과에 섞이지 않게 하려는 것이다.

### M1 — 홈 히어로·메타 (D1=B, D2, D3, D7 결재 뒤)

| 수정 파일 | 바꿀 것 |
|---|---|
| `docs/DESIGN_RULES.md` (+ `mhj-brand-kit/BRAND_GUIDE.md` 한 줄) | §5.2·§6.4·§10.1 개정, 새 항목 2개. D2 승인 시 Green Light 추가 |
| `app/globals.css` | `--accent` `:45`(→`#3E5F4A`)·`:123`(→`#8FB39B`), `--callout-bg` `:57`·`:128`, `.home-pillars-label` `:2231`·`.pillar-empty` `:2319` 대문자 해제 |
| `app/(public)/page.tsx` | h1(`:316`) 문장형 제목. 메타 가운뎃점 `:672·766·801·802·968·979·980` → 쉼표. 대문자 라벨 18행 정리 |
| `components/InstagramFeed.tsx` | `:187` "FROM OUR GALLERY" 꼬리표 삭제(D7), 인스타 태그 10px → 12px |
| `components/NewsletterCTA.tsx` | `:162·340` 안내문 11px → 13px(규칙서 메타 크기), "Mairangi Notes" 라벨 대문자 해제 |

**성공 기준**
- 홈 DOM(`scripts/dom-facts.mjs`):
  - 인디고 0, 보이는 가운뎃점 0
  - 대문자 변환 요소 0
  - h1 이 24px 이상이고 `--text` 색
- Impeccable 홈 URL 1회:
  - `kicker-above-heading` 0
  - `undersized-ui-text` 10 이하(현 39, 남는 것은 로고 문구 2 + 기둥 날짜 등. 날짜는 M1 에서 같이 12px 로 올리면 2)
  - `tiny-text` 0
- `scripts/qa/audit-contrast.mjs`·`audit-a11y.mjs` 0
- 홈 1280·1194·390 × 라이트·다크 전후 12장
- `npm run build` 통과, `tsc` 0

### M2 — 기사 읽기 화면 (블로그 상세)

| 수정 파일 | 바꿀 것 |
|---|---|
| `components/AiInsight.tsx` | 인디고·보라 9행 → 그린 단색 면(`#EEF3EF`/다크 `#18201B`). 그라데이션 삭제. 버튼 대문자 해제 |
| `app/(public)/blog/[slug]/page.tsx` | h1 대문자 해제(같은 Playfair 900). 메타 줄 3px 점 → gap. "Continue Reading" 꼬리표 삭제(`:699`, D7). 대문자 8행 |
| `app/globals.css` | `.blog-content` 본문 폭을 한 줄 65~75자로(현 656px·16px → 약 600px·17px, 시안에서 확정). `.blog-faq h2` `:1143` 대문자·자간 0.27em 해제. `.dark .ai-insight-card` `:873~887`·`.comment-toast` `:1605`. `.ai-reflection` 반경 `32px→12px`(`:486`, CLAUDE.md 규칙 7 위반 해소). `.adjacent-card-label` `:2370` 10px → 12px |
| `app/(public)/blog/[slug]/CommentSection.tsx` | "Join the conversation" 꼬리표 삭제(`:513`, D7). 폼 라벨 Name·Email·Comment 10px → 13px. 대문자 9행 |

**본문 서체 비교** (D4 근거, `fonts/`)
- 같은 기사(`starting-school-in-new-zealand`)의 같은 문단과 한국어 요약을, 1280·390 에서 서체만 바꿔 찍었다.
- 글꼴 전송량은 Playwright 로 두 번 잰 범위다. 한글 글꼴은 그 페이지가 쓰는 글자 조각만 받아서 실행마다 값이 흔들린다.

| 안 | 이 Mac 에서 그려진 글꼴(CDP) | 글꼴 전송 | 비교판 |
|---|---|---:|---|
| 현행 실제 | Helvetica + Apple SD Gothic Neo(로컬, 웹폰트 없음) | 0KB | `fonts/sheet-body-1280.png` 첫 칸 |
| **현행 의도 Noto Sans KR (추천)** | Noto Sans KR(웹) | 67~111KB | 둘째 칸 |
| 후보 1 Source Serif 4 + Noto Serif KR | 둘 다 웹 | 261~338KB | 셋째 칸 |
| 후보 2 IBM Plex Sans KR | 웹(라틴·한글 한 가족) | 69~98KB | 넷째 칸 |

- 후보 1(세리프 본문)은 잡지다운 온기가 있다. 하지만 전송량이 약 3배이고, 제목 Playfair 와 세리프끼리 겹쳐 제목·본문 대비가 약해진다. 390 폭에서 한글 세리프 요약문은 산세리프보다 획이 가늘어 덜 또렷해 보인다(`fonts/sheet-ko-390.png`. Claude 의 눈 판단이고 측정값은 아니다).
- 후보 2 는 Noto 보다 조금 더 사람 손 같은 형태다. 다만 900 굵기가 없어(최대 700), 코드의 900 라벨·제목 굵기를 함께 바꿔야 한다.
- 결론(D4): Noto 유지가 추천이다. 읽기 개선은 서체가 아니라 **한 줄 길이(약 100자 → 65~75자)와 본문 크기**에서 얻는다.

**본문 HTML 안의 명암 2.4:1**(`#9ca3af` on `#faf8f5`, 안내 상자 2건)은 코드가 아니라 DB 의 글 본문(`style=` 속성)에 있다. 고치려면 글 본문 수정(관리자 편집 또는 승인된 SQL)이 필요해 M2 와 별도로 결재받는다.

**성공 기준**
- Impeccable 블로그 URL 1회:
  - `line-length` 0(현 16)
  - `kicker-above-heading` 0
  - `wide-tracking`·`tiny-text` 0
  - `undersized-ui-text` 4 이하(로고 문구 2 + 안내 상자 라벨)
- DOM: 인디고·보라 0, 다크에서 AI 버튼이 테마 면을 따름
- 블로그 3폭 × 2테마 전후 12장
- `audit-contrast`·`audit-a11y` 0
- build·tsc 0

### M3 — 매거진·목록

| 수정 파일 | 바꿀 것 |
|---|---|
| `components/BlogLibrary.tsx` | 대문자 15행, 가운뎃점 `:563·595`, `var(--accent)` 3행(토큰 교체로 따라옴) |
| `components/MagazineViewer.tsx` | 인디고 하드코딩 7행(목차 활성 표시·배지 면) → `var(--accent)`·그린 면. 가운뎃점 9행(화면 문구). 대문자 14행 |
| `components/magazine/MagazineIssueDetail.tsx` | `:272·275·281` 가운뎃점("Mairangi Bay · Auckland · New Zealand"). 대문자 4행 |
| `components/MagazineShelf.tsx` | 대문자 6행. 책등 날짜 "AUG 2026" 은 데이터가 대문자라 표시 형식에서 처리 |
| `app/(public)/blog/tag/[tag]/page.tsx` | `:126` 가운뎃점, 대문자 3행 |

- 섹션 제목 h2 의 Playfair 이탤릭("You Might Also Like" 등)을 정체로 바꿀지 이 단계에서 시안 2개로 본다(D6 의 남은 몫).
- **성공 기준**:
  - `/blog`·`/magazine`·이슈 상세 DOM 의 인디고 0, 보이는 가운뎃점 0, 대문자 변환 요소 0(매거진 지면 템플릿 제외)
  - 3페이지 × 3폭 × 2테마 전후
  - `audit-contrast`·`audit-a11y` 0
  - build·tsc 0

---

## 규칙서 개정 초안 (D3)

| 위치 | 현행 | 제안 |
|---|---|---|
| `DESIGN_RULES.md` §6.4 | 인디고 액센트(`--accent`)는 AI Insight 버튼, 인터랙티브 요소에만 사용 | 강조색 `--accent` 는 MHJ Green(라이트 `#3E5F4A` / 다크 `#8FB39B`). 링크·포커스·AI Insight·현재 위치 표시에만 쓴다. 그라데이션 금지 |
| §6.1·§6.2 토큰 표 | `--accent: #4F46E5` / 다크 `#818CF8` | 위 값으로. 명암비 표의 `--accent` 줄을 7.14 / 6.74 / 6.31 · 8.57 / 7.95 / 7.22 로 |
| §5.2 크기 체계 | 라벨/캡션 11px, letter-spacing 2px, uppercase, 회색 | 라벨/캡션 12px, letter-spacing 0.01em, **문장형(대문자 변환 금지)**, `--text-tertiary` |
| §10.1 카드 도식 | `CATEGORY ← 11px, gray-400, uppercase` | `Category ← 12px, --text-tertiary` |
| 새 항목 | (없음) | 메타는 쉼표나 줄바꿈으로 나눈다. 가운뎃점(·)·3px 점 구분자를 쓰지 않는다 |
| 새 항목 | (없음) | 제목 위 꼬리표(kicker)를 쓰지 않는다. 정보가 있는 라벨(예: "Issue 07")만 예외 |
| 변경 이력 | — | 2026-11-xx AI 기본값 걷어내기 1차(이 기획안 링크) |

---

## 바꾸지 않을 것

- **사진이 주인공**: 홈 히어로 사진 비율·크기, 카드 사진은 그대로다. 시안 B 는 문구만 바꿨다.
- **호버 규칙**: 투명도·미세 확대(1.02~1.03)만 쓴다. `translateY`·`saturate()` 금지(CLAUDE.md 규칙 6).
- **카드 반경 12px 이하**(블로그 6px). 32px 이상 금지(규칙 7). `.ai-reflection` 32px 는 오히려 M2 에서 12px 로 바로잡는다.
- **다크 모드는 `globals.css` 변수만** 쓴다(규칙 5). 새 색은 토큰으로만 넣는다.
- **브랜드 워드마크와 "my mairangi" 로고 문구**(10px·0.28em, 규칙서 §17.2).
- **매거진 지면 템플릿**(`components/magazine/templates/**`, 지면 예외 — `MHJ_MAGAZINE_DESIGN_BIBLE.md`), **StoryPress 제품 랜딩 팔레트**(§6.5).
- **관리자 화면**(`app/mhj-desk/**`): `var(--accent)` 를 0회 써서 토큰 교체가 번지지 않는다. 인디고 하드코딩 121행은 이번 범위 밖이다.
- **본문 서체·다크 바탕·기사 제목 이탤릭**(D4·D5·D6 추천대로라면).
- 이미지 생성 AI 호출 0, 새 사진 0. 있는 가족 사진만 쓴다.

## 위험과 대응

- **5초 테스트 0건**: 지금 B 추천은 기계 검사와 판별표 근거뿐이다. 사람 3명 이상 결과 전에는 M1 을 시작하지 않는다. 응답자가 적어 방향 확인용이지 통계가 아니다.
- **"빈약해 보임"**: 조사서가 경고한 위험이다. 대문자 꼬리표가 주던 매거진 같은 긴장감이 빠진다. 대응은 홈 h1 크기 대비(12px → 33px)와 사진 크기다. 5초 테스트 Q3("가장 먼저 눈에 띈 것")로 확인한다.
- **M0 와 섞임**: 글꼴이 바뀌면 화면 인상이 크게 달라진다. M1 전후 비교는 M0 배포 뒤 기준선으로 다시 찍는다.
- **검사기는 신호이지 정답이 아니다**: 점수를 올리려고 고치지 않는다. 남는 건수는 판정표(진짜 문제/의도된 선택)로 설명한다.
- **실명**: 모든 단계 캡처·문서·5초 테스트 이미지에서 실명 검사 0 을 유지한다(name-guard 패턴 재사용).

## 다음 행동

**PeNnY**
1. 5초 테스트 진행: 페이지를 진행자 기기에서 열고 3명 이상(처음 보는 분 포함)에게 보여 주기. 응답자 기기에서 열려면 Share 메뉴로 공유.
2. D1~D7 결정. D1 은 테스트 결과 뒤.
3. M0 PR #179 머지·배포 결재(별도 세션).

**Claude**
1. 완료: STEP 0~4 와 이 기획안(2026-11-03). 커밋은 문서·캡처만, push 0.
2. 결정이 나면 M1 지시서 → M0 뒤 기준선 재캡처 → 구현 → 3폭 × 2테마 전후 → `/code-review`·`/verify` → push 결재 요청.

## 근거 자료 (같은 폴더)

- [`STEP1_SELF_CHECK.md`](STEP1_SELF_CHECK.md) — 검사기 판정표, DOM, 5축, 웹폰트 회귀
- [`STEP2_INVENTORY.md`](STEP2_INVENTORY.md) — 전수표 438행, 명암비 계산값
- [`STEP3_MOCKUP_B.md`](STEP3_MOCKUP_B.md) — 목업 방법, A·B 비교, 톤 테스트, 회귀 기록
- [`STEP4_FIVE_SECOND_TEST.md`](STEP4_FIVE_SECOND_TEST.md) — 5초 테스트 페이지, 저장 시험
- `scripts/` — 캡처·DOM·전수표·짝 비교·CDP 검사·서체 비교 스크립트(저장소 루트에서 실행)
- 캡처 원본(커밋 안 함): `/Users/penny/MHJ_HOMEPAGE/qa-screenshots/2026-11-03-self-check/{before,after-B,pairs}/`
