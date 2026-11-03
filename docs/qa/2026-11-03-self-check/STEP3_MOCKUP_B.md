# STEP 3 — 시안 B 목업 비교 (2026-11-03)

> 지시서 §2 STEP 3. **코드 반영 없음**이다. 라이브 www.mhj.nz 에 목업을 덧입혀 캡처하고 검사했다. `git diff --stat -- app components` = 0.

## 시안 B 정의와 만든 법

| # | 바꾼 것 | 목업 방법 |
|---|---|---|
| 1 | 강조색 인디고·보라 → MHJ Green. 라이트 `#3E5F4A`, 다크 `#8FB39B`(파생값). AI Insight 버튼의 보라 그라데이션은 단색 면 `#EEF3EF` / 다크 `#18201B` 로 | CSS: `--accent`·`--callout-bg` 재정의, AI 버튼 인라인 스타일은 `!important` 로 덮음 |
| 2 | 홈 h1 을 12px 대문자 회색 꼬리표에서 문장형 제목으로: 33px(1280 기준), 600, `--text` 색, `text-wrap: balance` | CSS |
| 3 | 메타·라벨에서 대문자 변환을 모두 해제한다. 대문자를 풀 때 자간 0.01em, 굵기 900→600, 9~11px→12px 로 함께 정돈. 점 구분자는 쉼표로, 브레드크럼은 빗금으로 | CSS + **글자 치환 JS** |

- 파일: [`mockup/mockup-B.css`](mockup/mockup-B.css), [`mockup/mockup-B.js`](mockup/mockup-B.js)
- **지시서와 다른 점 1건**: 지시서는 "CSS만 주입"이라고 했다. 하지만 홈 메타의 `·` 는 글자로 박혀 있어("Life in Aotearoa · 30 Oct 2026") CSS 로는 지울 수 없다.
  그래서 `mockup-B.js` 가 텍스트 노드의 `·` 만 쉼표로 바꾼다. 블로그 메타의 점은 3px 원 `span` 이라 CSS 로 숨겼다.
- 3번의 굵기·크기 정돈은 지시서 3항에 없는 손질이다. 대문자만 풀면 10px·900 굵기 소문자가 어색해져 B 가 불리해지므로 함께 했다. 실제 반영 때 같은 묶음으로 다룬다.

## 캡처 (STEP 0 과 같은 구도)

- before 18장: `/Users/penny/MHJ_HOMEPAGE/qa-screenshots/2026-11-03-self-check/before/`
- after-B 18장: `/Users/penny/MHJ_HOMEPAGE/qa-screenshots/2026-11-03-self-check/after-B/`. 모두 응답 200이고, 다크 6장은 `.dark` 가 켜졌다. 실명 검출 0.
- 짝 비교 18쌍: `/Users/penny/MHJ_HOMEPAGE/qa-screenshots/2026-11-03-self-check/pairs/`. `qa-screenshots/` 는 `.gitignore` 대상이라 커밋하지 않는다.
- 커밋한 짝 비교 9장(JPEG): `pairs/`. 3페이지마다 1280 라이트·1280 다크·390 라이트 세 장이다.
  - [홈 1280 라이트](pairs/pair-home-1280-light.jpg) · [홈 1280 다크](pairs/pair-home-1280-dark.jpg) · [홈 390 라이트](pairs/pair-home-390-light.jpg)
  - [블로그 1280 라이트](pairs/pair-blog-1280-light.jpg) · [블로그 1280 다크](pairs/pair-blog-1280-dark.jpg) · [블로그 390 라이트](pairs/pair-blog-390-light.jpg)
  - [매거진 1280 라이트](pairs/pair-magazine-1280-light.jpg) · [매거진 1280 다크](pairs/pair-magazine-1280-dark.jpg) · [매거진 390 라이트](pairs/pair-magazine-390-light.jpg)

## DOM 계산값 A → B (`dom-facts-A.json` → `dom-facts-B.json`, 1280 라이트)

| 항목 | 홈 | 블로그 상세 | 매거진 목록 |
|---|---|---|---|
| 인디고 칠한 요소 | 1 → **0** | 7 → **0** | 1 → **0** |
| 브라운·그린 칠한 요소 | 21 → 22 | 11 → 18 | 10 → 11 |
| 대문자 요소 | 59 → **0** | 49 → **0** | 43 → **0** |
| 가운뎃점 노드(보임/전체) | 16/27 → **0/0** | 2/4 → **0/0** | 6/12 → **0/0** |
| h1 | 12px 900 대문자 자간 2px 회색 → **33px 600 문장형 `--text`** | Playfair 900 48px 대문자 → 같은 크기 **문장형**("Starting School in New Zealand") | 변화 없음 |
| `--accent` | `#4F46E5`/다크 `#818CF8` → `#3E5F4A`/다크 `#8FB39B` | 같음 | 같음 |

다크(`*-dark`)도 인디고 0, 대문자 0, 가운뎃점 0 이다. 블로그 브라운·그린이 11→18 로 는 것은 AI 버튼·본문 링크·포커스 테두리가 그린으로 칠해졌기 때문이다.

## 검사기 A·B 비교 (Impeccable 4.8.0)

검사 방식이 결과에 섞이지 않게 같은 방식끼리 비교한다.
- STEP 1 의 A 는 URL 모드(`detect <url>`)였다. B 는 목업을 덧입힌 페이지라 `--cdp` 모드로만 검사할 수 있다(떠 있는 Chromium 페이지를 그대로 검사).
- 그래서 **주입 없는 A 대조군을 같은 CDP 모드로 1회** 더 돌렸다. URL 모드와 CDP 모드는 같은 페이지에서도 홈 43→44, 블로그 40→37 로 달랐다.
- 페이지마다 A 대조군 1회와 B 1회만 돌렸다. 결과를 보고 목업을 고쳐 다시 돌리지 않았다(지시서 §3 "점수 올리기 금지").
- 실행기: [`scripts/detect-cdp.mjs`](scripts/detect-cdp.mjs). 파일: `impeccable-{home,blog}-A-cdp.json`, `impeccable-{home,blog}-B.json`

| 규칙 | 홈 A(URL) | 홈 A(CDP) | **홈 B** | 블로그 A(URL) | 블로그 A(CDP) | **블로그 B** |
|---|---:|---:|---:|---:|---:|---:|
| `undersized-ui-text` | 39 | 39 | **10** | 14 | 14 | **6** |
| `line-length` | 0 | 0 | 0 | 16 | 14 | 14 |
| `kicker-above-heading` | 1 | 1 | **0** | 3 | 3 | **0** |
| `unbalanced-heading` | 1 | 1 | 1 | 2 | 2 | 1 |
| `straggler` | 1 | 2 | 2 | 1 | 0 | 0 |
| `tiny-text` | 1 | 1 | 1 | 0 | 0 | **1** |
| `low-contrast` | 0 | 0 | 0 | 2 | 2 | 2 |
| `italic-serif-display` | 0 | 0 | 0 | 1 | 1 | 1 |
| `em-dash-overuse` | 0 | 0 | 0 | 1 | 1 | 1 |
| `wide-tracking` | 0 | 0 | 0 | 0 | 0 | **1** |
| **합계** | **43** | **44** | **14** | **40** | **37** | **27** |

같은 CDP 모드끼리 보면 **홈 44 → 14(−30), 블로그 37 → 27(−10)** 이다.

### B 에 남은 것·새로 생긴 것

- **B 에서 새로 생긴 2건은 목업 결함이다** (블로그 `#faq-heading` 의 `wide-tracking` 0.27em, `tiny-text` 11px).
  - FAQ 제목은 `globals.css` 의 `.blog-faq h2` 규칙으로 대문자가 되는데, 목업 CSS 의 자간·크기 정돈 목록에서 이 선택자를 빠뜨렸다.
  - 대문자만 풀리고 넓은 자간과 11px 가 남은 것이다. 시안 B 의 정의(대문자를 풀 때 자간 ≤0.02em, 12px 이상)를 덜 적용한 것이지 B 의 결함이 아니다.
  - 다시 돌리지 않고 기록만 한다. 실제 반영(M2) 때 `.blog-faq h2` 를 목록에 넣는다.
- **`kicker-above-heading` 0 은 반쯤만 진짜다.**
  - "FROM OUR GALLERY" 는 원문 글자 자체가 대문자라, 대문자 변환을 풀어도 그대로 대문자다. 검사기는 변환 속성으로 판단해 이것을 놓친다.
  - 실제 반영 때는 원문을 "From our gallery" 로 바꾸거나 꼬리표를 없애야 한다. 매거진 책등의 "AUG 2026" 도 데이터가 대문자라 그대로다.
- **남은 10px 글자**(홈 10, 블로그 6)는 대문자가 아닌 작은 글자다.
  - 대상: 기둥 칸 날짜 "2 Oct 2026", 인스타 태그, 이전/다음, "my mairangi" 로고 문구.
  - 시안 B 범위(대문자 라벨) 밖이므로 M2·M3 에서 라벨 크기 하한(규칙서 §5.2 11px → 12px 제안)으로 다룬다. "my mairangi" 는 로고 잠금 규격이라 유지한다.
- `line-length`·`low-contrast`·`em-dash` 는 B 와 무관하다. 본문 폭과 본문 HTML 안내 상자의 문제라 M2 에서 다룬다.

## 판별표 5축 — A 와 B

| 축 | A | B | 근거 |
|---|---|---|---|
| 색과 바탕 | 해당(약) | **비해당** | 인디고 칠한 요소 0, 보라 그라데이션 0. 상호작용 색이 브랜드 그린. 다크 h1 slate-400 은 문장형 제목이 되며 `--text` 로 바뀜. 다크 바탕 `#0A0A0A` 는 그대로(결정 항목) |
| 글자 | 해당 | **해당(약)** | 대문자 요소 0, 홈 h1 이 문장형 제목. 남은 것: 기사 제목 Playfair 900 이탤릭(대비 강한 세리프), 웹폰트 미로드(M0) |
| 구조와 장식 | 해당(일부) | **비해당** | 가운뎃점 0, 꼬리표 0(검사기 기준. 원문 대문자 "FROM OUR GALLERY" 는 남음) |
| 움직임 | 비해당 | 비해당 | 변화 없음 |
| 글과 증거 | 비해당 | 비해당 | 변화 없음 |

**A 3축 해당 → B 1축(글자, 약) 해당.**

## 톤 테스트 ("따뜻하되 세련된, 감성적이되 지적인")

- 홈:
  - A 의 첫 줄은 12px 회색 대문자 꼬리표다. 사이트가 무엇인지 말하는 유일한 문장인데 가장 작고 옅게 놓여, 사진 위에서 장식처럼 읽힌다.
  - B 는 같은 문장을 사람 목소리 크기로 말한다("A Korean family's school & life notes from Mairangi Bay, Auckland"). 그 아래 메타도 "Life in Aotearoa, 30 Oct 2026" 처럼 문장으로 읽힌다.
  - **"지적인"(정보가 먼저 들어옴)과 "따뜻한"(소리치지 않는 말투)에 B 가 더 가깝다.**
- 블로그:
  - A 의 "STARTING SCHOOL IN NEW ZEALAND" 대문자 Playfair 900 은 포스터처럼 소리친다. B 의 "Starting School in New Zealand" 는 같은 서체 같은 크기인데 읽힌다.
  - AI Insight 버튼은 A 에서 사이트에 없는 라벤더색 알약이었다. B 에서는 브랜드 그린 단색이라 사이트의 일부로 보인다.
- 잃는 것: A 의 넓은 자간 대문자에는 매거진 표지 같은 "세련됨"이 일부 있다. B 는 그 긴장감을 덜어 낸 만큼 평평해 보일 수 있다.
  조사서의 경고("장식만 빼면 빈약해 보인다")와 같은 지점이다. 그 빈자리는 사진 크기와 홈 h1 의 크기 대비가 채우는 구조다. 사람 5초 테스트(STEP 4)로 확인할 항목이다.
- 이 판단은 AI(Claude)의 판정이다. 사람 판정은 STEP 4 결과로 바뀔 수 있다.

## 회귀 기록 (지시서 B 항)

- **다크 모드**: after-B 다크 9장(3페이지 × 3폭)을 확인했다. 색이 깨진 곳은 없다.
  - A 에서는 AI Insight 버튼이 다크에서도 연보라 면(`#EEF2FF`) 그대로 떠 있었다(before `blog-*-dark.png`). B 목업에서는 다크 면 `#18201B` 로 테마를 따른다. 실제 반영 때 다크 짝을 함께 넣어야 하는 자리다.
- **관리자 화면**: 목업은 공개 3페이지에만 주입해 관리자 화면에는 영향이 없다.
  - 실제 반영 때도 `--accent` 교체는 관리자에 번지지 않는다. `app/mhj-desk`·`components/admin` 은 `var(--accent)` 를 0회 쓰고, 인디고는 하드코딩 121행뿐이다(STEP 2 제외분).
  - 관리자 편집기 `components/TipTapEditor.tsx` 12행도 하드코딩이다. 관리자 색을 바꿀지는 별도 판단이다.
- **이 Mac 의 글꼴**: STEP 1 §3 처럼 Playfair 가 로컬에 깔려 있어 A·B 모두 제목이 Playfair 로 보인다. 같은 조건이라 비교는 공정하지만, 일반 방문자 화면은 아니다.
