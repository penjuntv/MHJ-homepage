# STEP 1 — 기계 자가검증 (2026-11-03)

> 지시서: `~/StoryPress-Ops/design/2026-11-02-ai-free-design-research/handoff/2026-11-03_MHJ_self-check-and-upgrade-plan.md` §2 STEP 1
> 대상: 라이브 www.mhj.nz, 로그아웃 상태, 1280×800. 화면 코드 변경 0.

## 파일

| 파일 | 내용 |
|---|---|
| `impeccable-home.json` | `npx impeccable@4.8.0 detect https://www.mhj.nz --json` — 43건 |
| `impeccable-blog.json` | `npx impeccable@4.8.0 detect https://www.mhj.nz/blog/starting-school-in-new-zealand --json` — 40건 |
| `dom-facts-A.json` | 홈·블로그·매거진 × 라이트·다크, Playwright `getComputedStyle` 계산값 |
| `evidence/*-installed.png` · `*-visitor.png` | 웹폰트 회귀 증거(아래 §3) |

검사기 버전은 npx 캐시의 `impeccable@4.8.0`(StoryPress 11-02 실행과 같은 캐시)이다. 페이지당 1회만 돌렸다.
종료 코드 2는 "찾은 것이 있음"이라는 뜻이고 실행 오류가 아니다.

## 1. 검사기 건수표 (JSON 건수와 같음: 홈 43 · 블로그 40 · 합 83)

| 규칙 | 등급 | 묶음 | 홈 | 블로그 | 판정 | 근거 |
|---|---|---|---:|---:|---|---|
| `undersized-ui-text` | warning | 카테고리·날짜·인스타 태그·폼 라벨·이전/다음 10px | 36 | 10 | 진짜 문제 | 규칙서 §5.2 라벨 하한 11px 보다도 1px 작다. 폼 라벨(Name·Email·Comment)은 입력 안내라 더 크게 필요 |
| `line-length` | warning | 본문·안내 상자·FAQ 한 줄 96~103자 | 0 | 16 | 진짜 문제 | 1280 폭에서 영어 본문 한 줄 ~100자. 조사서 기준 65~75자, 검사기 기준 80자 미만 |
| `undersized-ui-text` | warning | 태그라인 "my mairangi" 10px | 2 | 2 | 의도된 선택 | DESIGN_RULES §17.2 로고 사용 규칙 tagline = "Inter 400, 10px, 0.28em" — 로고 잠금 규격 |
| `kicker-above-heading` | warning | — | 1 | 3 | 진짜 문제 | "FROM OUR GALLERY"·"Continue Reading"·"Join the conversation" 이 h2 위에 붙음. Impeccable 은 의뢰서로도 못 되살리는 금지로 둠. 단 규칙서 §5.2 "라벨 = uppercase" 와 충돌 → 결정 항목 |
| `unbalanced-heading` | advisory | — | 1 | 2 | 진짜 문제 | 제목 끝줄에 한 단어(8~35%). `text-wrap: balance` 한 줄로 해결되는 조판 기본기 |
| `undersized-ui-text` | advisory | 꼬리표 "FROM OUR GALLERY"·"Continue Reading" 10px | 1 | 2 | 진짜 문제 | 위 kicker 와 같은 요소. 크기보다 꼬리표 자체가 신호 |
| `straggler` | advisory | — | 1 | 1 | 진짜 문제 | 문단 끝줄 한 단어. `text-wrap: pretty` 로 해결(경미) |
| `low-contrast` | warning | — | 0 | 2 | 진짜 문제 | 본문 HTML 안내 상자의 `#9ca3af` on `#faf8f5` = 2.4:1. `style=` 속성이라 저장소 `audit-contrast` 가 세지 않는 자리(규칙서 §6.3 "잰 것 중 0") |
| `tiny-text` | warning | — | 1 | 0 | 진짜 문제 | 뉴스레터 폼 아래 "By subscribing, you agree to our Privacy Policy." 11px — 규칙서 §5.2 메타 13px 보다 작음 |
| `italic-serif-display` | warning | — | 0 | 1 | 의도된 선택 | "You Might Also Like" Playfair 이탤릭 48px. 규칙서 §5 가 Playfair 를 display 서체로 지정. 조사서 "대비 강한 세리프 제목" 신호와 겹침 → M3 에서 재검토 |
| `em-dash-overuse` | advisory | — | 0 | 1 | 진짜 문제(디자인 범위 밖) | 본문 줄표 25개. 화면이 아니라 글의 문제 — 편집 단계에서 다룸, 기획안에는 기록만 |
| **합계** | | | **43** | **40** | | |

판정별 합계: 진짜 문제 77 · 진짜 문제(디자인 범위 밖) 1 · 의도된 선택 5 · **오탐 0**.
사진 속 글자 같은 오탐은 이번에는 나오지 않았다(StoryPress 55건 중 `text-occlusion` 10건 같은 유형 없음).

### 검사기가 못 보는 것 (중요)
규칙 62개(`--list-rules`)에는 **"대문자 h1"·"가운뎃점 메타"·"Tailwind 인디고"를 직접 잡는 규칙이 없다.**
`ai-color-palette`·`overused-font`·`all-caps-body` 는 돌았지만 0건이다. 1판이 꼽은 세 신호는 검사기 점수로는 안 보이므로, 아래 DOM 숫자가 근거가 된다.
검사기 0건을 "신호 없음"으로 읽지 않는다.

## 2. DOM 계산값 요약 (`dom-facts-A.json`, 1280, 보이는 요소만)

| 항목 | 홈 | 블로그 상세 | 매거진 목록 |
|---|---|---|---|
| h1 | Noto Sans KR 900 **12px uppercase, 자간 2px**, `rgb(95,110,130)` "A KOREAN FAMILY'S SCHOOL & LIFE NOTES…" | Playfair 900 48px **uppercase** "STARTING SCHOOL IN NEW ZEALAND" | Playfair 900 40px "Magazine Shelf" |
| 기사 제목 | Playfair 900 **italic** | Playfair 900 (h1) | — |
| 본문 선언 서체 | Noto Sans KR 16px | Noto Sans KR | Inter 14px("Scroll to explore") |
| 인디고 칠한 요소(라이트) | **1**(skip-link 테두리) | **7**(skip-link, AI INSIGHT 글자·아이콘 3, 본문 링크) | **1** |
| 브라운·그린 칠한 요소(라이트) | 21 (`#8A6B4F` 18, `#C9A882` 3) | 11 | 10 |
| `--accent` | 라이트 `#4F46E5` / 다크 `#818CF8` | 같음 | 같음 |
| 대문자 요소(자기 글자 있는 것) | **59** (59개 모두 자간 ≥0.08em) | **49** (46) | **43** (37) |
| 가운뎃점 텍스트 노드 보임/전체 | **16** / 27 | 2 / 4 | 6 / 12 |
| 가운뎃점 예 | "LIFE IN AOTEAROA · 30 OCT 2026", "by Yussi · 10 views · 2 Comments" | "Writer · Social work student…", "FROM OUR FAMILY · STORYPRESS" | "MAIRANGI BAY · AUCKLAND · NEW ZEALAND" ×6 |
| 다크 바탕 | `rgb(10,10,10)` = `#0A0A0A` | 같음 | 같음 |
| 다크 h1 색(홈) | `rgb(148,163,184)` = Tailwind slate-400 그대로 | | |

다크에서도 인디고·브라운 칠한 개수는 같다(색만 `#818CF8`·`#C9A882` 로 바뀜).
**해석**: 인디고는 "사이트 색"이 아니다. 칠한 면적은 블로그 상세의 AI Insight·본문 링크·포커스 테두리 정도로, 규칙서 §6.4 "인디고는 AI Insight·인터랙티브 요소에만"을 지키고 있다.
문제는 면적이 아니라 **상호작용 색(링크·포커스·AI 버튼)이 Tailwind 기본값**이라는 점, 그리고 브랜드 키트(브라운·그린)와 다른 계열이라는 점이다.
1판의 "인디고 25파일"은 코드 등장 수다. 화면에 칠해지는 수는 1~7개다.

## 3. 새 발견 — 라이브 웹폰트가 실제로는 내려가지 않는다 (P1, 범위 밖이라 기록만)

- 라이브 CSS(`/_next/static/css/7e4598827a0085eb.css`)에서 Google Fonts `@import` 가 2,108번째 글자에 있다. 그 앞에 `next/font` Inter 의 `@font-face` 가 먼저 나온다.
  CSS 규칙상 `@import` 는 다른 규칙보다 앞에 와야 하므로 **브라우저가 이 `@import` 를 무시한다.**
- 실측 결과는 다음과 같다.
  - 페이지 로드 중 `fonts.googleapis.com`·`fonts.gstatic.com` 요청이 0건이고, 받은 글꼴 파일은 Inter woff2 1개뿐이다.
  - `document.fonts` 에는 Inter 만 있다.
  - CDP `getPlatformFontsForNode` 로 실제 그려진 글꼴을 보면, 블로그 본문은 **Helvetica**, h1 은 **이 Mac 에 설치된** Playfair Display ExtraBold(`isCustomFont:false`)다.
- 결론: 방문자 화면에서는 **Noto Sans KR 이 한 번도 그려지지 않는다.** Playfair 는 그 글꼴을 깐 기기에서만 보인다.
  나머지 방문자는 제목을 기본 serif(Times 계열)로, 본문을 시스템 sans 로 본다.
  재현 캡처: `evidence/blog-1280-light-visitor.png`. 같은 이름의 `@font-face` 로 Times New Roman 을 대신 물려 일반 방문자를 흉내 냈고, CDP 로 그려진 글꼴이 Times New Roman 인 것을 확인했다.
- 1판·11-02 `dom-facts.json` 의 "라이브 계산값 h1·본문 Noto Sans KR"은 **선언값**이다. 렌더된 글꼴이 아니다. 이번 판에서 바로잡는다.
- `app/globals.css` 9행 주석은 "2026-09-08 W3-C 실측에서 Noto·Playfair 로드됨"이라고 적고 있다. 그 뒤 어느 시점에 회귀했고, 시점은 확인하지 못했다.
  `next/font` Inter 는 2026-04-01(`838b4b0`)부터 있었으므로, CSS 묶음 순서가 바뀐 빌드(Next 버전 올림 등)가 의심된다. 이 판단은 추정이다.
- **영향**: 이번 before 캡처 18장은 Playfair 가 깔린 이 Mac 기준이라, 제목이 일반 방문자 화면보다 좋아 보인다. 시안 비교·5초 테스트는 A·B가 같은 조건이라 공정하다. 다만 "현행 = 이 캡처"로 읽으면 안 된다.
- 고치는 일은 이번 범위(코드 변경 0) 밖이다. 기획안 M0 로 올린다.

## 4. 판별표 5축 채점 (조사서 "AI 티 판별표")

| 축 | 판정 | 근거(위 숫자) |
|---|---|---|
| 색과 바탕 | **해당(약)** | 상호작용 색이 Tailwind indigo-600 `#4F46E5`·indigo-400 `#818CF8`, 홈 h1 다크 색이 slate-400 그대로. 칠한 면적은 1~7요소로 작다(§2). 보라 그라데이션·크림+테라코타·형광 강조는 없다. 다크 `#0A0A0A` 는 무채 근흑이고 형광 강조가 없어 공식 스킬의 "근흑+형광 하나" 조합에는 들지 않는다 → 다크 바탕은 **의도된 선택**(규칙서 §6.2)으로 두고 결정 항목에 올림 |
| 글자 | **해당** | 홈 h1 자체가 12px 대문자·자간 2px 회색 꼬리표 문장. 대문자 요소 59/49/43개가 전부 넓은 자간. 기사 제목 Playfair 900 이탤릭(대비 강한 세리프). 블로그 h1 도 대문자. Inter 는 로드되지만 실제 6~10요소(태그라인 등)에만 쓰여 과사용 글꼴 신호는 약함. 여기에 §3 웹폰트 회귀 |
| 구조와 장식 | **해당(일부)** | 가운뎃점 메타 보이는 노드 16/2/6, 제목 위 꼬리표 4건(검사기). 반면 아이콘 상자 3개·가짜 일러스트·히어로 지표·카드 속 카드는 0(검사기 `icon-tile-stack`·`nested-cards`·`shape-assembled-illustration` 0건) → 사진이 주인공인 구조는 **강점** |
| 움직임 | **비해당** | 섹션마다 스크롤 등장 효과 없음(`IntersectionObserver` 는 읽기 추적 2파일뿐). `animate-fade-in` 5곳·`slide-up` 1곳, 호버는 규칙서대로 opacity·미세 scale. 다만 fade-in 0.8s 는 조사서 "UI 애니메이션 300ms 미만"보다 길고, `prefers-reduced-motion` 처리가 `globals.css` 에 0 → 경미한 품질 항목으로 기록 |
| 글과 증거 | **비해당** | `marketing-buzzword`·`theater-slop-phrase`·`aphoristic-cadence` 0건. 사진·이야기가 모두 실제 가족 것. 줄표 25개는 기사 1편의 글 문제(§1) |

**합계: 5축 중 해당 3(색 약·글자·구조 일부) / 비해당 2.** 가장 무거운 축은 **글자**다. 대문자·넓은 자간 꼬리표가 사이트 전체의 목소리를 만들고 있고, 그 위에 웹폰트 회귀가 겹친다.

## 5. 저장소 규칙과 충돌 (보고)

| 지시서 시안 B | 저장소 규칙 | 처리 |
|---|---|---|
| (1) 강조색을 브라운·그린으로 | `docs/DESIGN_RULES.md` §6.4 "인디고 액센트는 AI Insight·인터랙티브 요소에만" — 인디고를 **정본으로 둔** 규칙 | 목업은 진행(코드 변경 0). 반영하려면 §6.4 개정이 필요 → 결정 항목 |
| (3) 메타에서 대문자 제거 | `docs/DESIGN_RULES.md` §5.2 "라벨/캡션 11px, letter-spacing 2px, **uppercase**, 회색", §10.1 카드 도식 "CATEGORY 11px uppercase" | 같음 |
| 캡처 커밋 `qa-screenshots/**` | `.gitignore` 71행 `qa-screenshots/` | 저장소 규칙을 따른다. 캡처는 메인 체크아웃 `qa-screenshots/2026-11-03-self-check/` 에 두고 커밋하지 않는다. 짝 비교 이미지만 `docs/qa/**/*.png`(허용)로 커밋 |
